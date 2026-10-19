// HTTP API + static hosting for the built client.
import express, { type Request, type Response, type NextFunction } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { DB } from './db.ts';
import { nowIso, tx } from './db.ts';
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  hashPassword,
  rateLimiter,
  readCookie,
  requireUser,
  userFromRequest,
  verifyPassword,
} from './auth.ts';
import {
  AttemptPayloadSchema,
  GameDocSchema,
  type GameDoc,
  type GameRecord,
  type GameStatus,
  type GameSummary,
  type PlayPayload,
} from '../shared/schema.ts';
import { newId, pointsFor } from '../shared/engine.ts';
import { publishIssues } from '../shared/validation.ts';
import { blankGame, SAMPLES } from '../shared/samples.ts';
import { computeStats, type AttemptRow } from '../shared/stats.ts';
import { toCsv } from '../shared/importer.ts';

export interface AppOptions {
  db: DB;
  publicDir?: string;
  requireActivationCode?: boolean;
  secureCookies?: boolean;
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

interface GameRow {
  id: string;
  owner_id: string;
  draft: string;
  revision: number;
  published: string | null;
  published_version: number;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function statusOf(row: GameRow): GameStatus {
  if (!row.published) return 'draft';
  if (!row.is_published) return 'paused';
  return row.published === row.draft ? 'live' : 'changed';
}

function toRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    draft: JSON.parse(row.draft),
    revision: row.revision,
    status: statusOf(row),
    isPublished: !!row.is_published,
    publishedVersion: row.published_version,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

// Serialises a validated document the same way every time so that draft/published can be
// compared as strings.
function serialize(doc: GameDoc): string {
  return JSON.stringify(GameDocSchema.parse(doc));
}

const RegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(200),
  activationCode: z.string().trim().max(40).optional(),
});
const LoginSchema = z.object({ email: z.string().trim().toLowerCase().max(120), password: z.string().max(200) });
const CreateGameSchema = z.object({ start: z.enum(['blank', 'science', 'math']).default('blank') });
const SaveDraftSchema = z.object({ draft: GameDocSchema, revision: z.number().int() });

const IMAGE_SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  { mime: 'image/gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
];

export function createApp(opts: AppOptions) {
  const { db } = opts;
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  const api = express.Router();
  api.use(express.json({ limit: '1mb' }));

  const loginLimit = rateLimiter(10, 15 * 60 * 1000);
  const attemptLimit = rateLimiter(120, 10 * 60 * 1000);
  const registerLimit = rateLimiter(10, 60 * 60 * 1000);
  const auth = requireUser(db);

  const setSessionCookie = (res: Response, userId: string) => {
    const { token, maxAgeMs } = createSession(db, userId);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !!opts.secureCookies,
      maxAge: maxAgeMs,
      path: '/',
    });
  };

  const parse = <T>(schema: z.ZodType<T>, body: unknown, message = 'البيانات المرسلة غير صحيحة.'): T => {
    const r = schema.safeParse(body);
    if (!r.success) throw new HttpError(400, message, { details: r.error.issues.slice(0, 5).map((i) => i.path.join('.')) });
    return r.data;
  };

  const gameOf = (userId: string, id: string): GameRow => {
    const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as GameRow | undefined;
    if (!row || row.owner_id !== userId) throw new HttpError(404, 'لم نجد هذه اللعبة في حسابك.');
    return row;
  };
  const ownGame = (req: Request): GameRow => gameOf(req.user!.id, String(req.params.id));

  // ---- Health & config --------------------------------------------------------------------
  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  api.get('/config', (_req, res) => {
    res.json({ requireActivationCode: !!opts.requireActivationCode });
  });

  // ---- Auth --------------------------------------------------------------------------------
  api.post('/auth/register', async (req, res) => {
    if (!registerLimit(req.ip ?? '')) throw new HttpError(429, 'محاولات كثيرة. حاولي بعد قليل.');
    const r = RegisterSchema.safeParse(req.body);
    if (!r.success) {
      const field = r.error.issues[0]?.path[0];
      const msg =
        field === 'email'
          ? 'اكتبي بريدًا إلكترونيًا صحيحًا.'
          : field === 'password'
            ? 'كلمة المرور يجب ألا تقل عن ٨ أحرف.'
            : field === 'name'
              ? 'اكتبي اسمكِ (حرفان على الأقل).'
              : 'تحققي من البيانات المدخلة.';
      throw new HttpError(400, msg);
    }
    const { name, email, password, activationCode } = r.data;
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new HttpError(409, 'هذا البريد مسجّل مسبقًا. سجّلي الدخول بدلًا من ذلك.');
    const code = activationCode?.toUpperCase();
    if (opts.requireActivationCode) {
      const lic = code ? (db.prepare('SELECT used_by FROM licenses WHERE code = ?').get(code) as { used_by: string | null } | undefined) : undefined;
      if (!lic) throw new HttpError(400, 'رمز التفعيل غير صحيح. ستجدينه في رسالة الشراء.');
      if (lic.used_by) throw new HttpError(400, 'رمز التفعيل مستخدم من قبل.');
    }
    const id = newId('u');
    const hash = await hashPassword(password);
    tx(db, () => {
      db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hash, nowIso());
      if (opts.requireActivationCode)
        db.prepare('UPDATE licenses SET used_by = ?, used_at = ? WHERE code = ? AND used_by IS NULL').run(id, nowIso(), code!);
    });
    setSessionCookie(res, id);
    res.status(201).json({ user: { id, name, email } });
  });

  api.post('/auth/login', async (req, res) => {
    const { email, password } = parse(LoginSchema, req.body);
    if (!loginLimit(`${req.ip}|${email}`)) throw new HttpError(429, 'محاولات دخول كثيرة. حاولي بعد ١٥ دقيقة.');
    const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email) as
      | { id: string; name: string; email: string; password_hash: string }
      | undefined;
    if (!row || !(await verifyPassword(password, row.password_hash))) throw new HttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    setSessionCookie(res, row.id);
    res.json({ user: { id: row.id, name: row.name, email: row.email } });
  });

  api.post('/auth/logout', (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) destroySession(db, token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  api.get('/auth/me', (req, res) => {
    res.json({ user: userFromRequest(db, req) });
  });

  // ---- Games (teacher) -----------------------------------------------------------------------
  api.get('/games', auth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT g.*, (SELECT COUNT(*) FROM attempts a WHERE a.game_id = g.id) AS attempt_count
         FROM games g WHERE owner_id = ? ORDER BY updated_at DESC`,
      )
      .all(req.user!.id) as unknown as (GameRow & { attempt_count: number })[];
    const games: GameSummary[] = rows.map((row) => {
      const d = JSON.parse(row.draft) as GameDoc;
      return {
        id: row.id,
        title: d.meta.title,
        subject: d.meta.subject,
        grade: d.meta.grade,
        templateId: d.templateId,
        theme: d.settings.theme,
        questionCount: d.questions.length,
        status: statusOf(row),
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
        attemptCount: row.attempt_count,
      };
    });
    res.json({ games });
  });

  api.post('/games', auth, (req, res) => {
    const { start } = parse(CreateGameSchema, req.body ?? {});
    const doc = start === 'blank' ? blankGame() : SAMPLES[start]();
    if (start === 'blank') doc.meta.teacherName = req.user!.name;
    const id = newId('');
    const now = nowIso();
    db.prepare('INSERT INTO games (id, owner_id, draft, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user!.id, serialize(doc), now, now);
    res.status(201).json({ game: toRecord(gameOf(req.user!.id, id)) });
  });

  api.get('/games/:id', auth, (req, res) => {
    res.json({ game: toRecord(ownGame(req)) });
  });

  // Saving only ever touches the draft — students keep playing the published copy.
  api.put('/games/:id/draft', auth, (req, res) => {
    const row = ownGame(req);
    const { draft, revision } = parse(SaveDraftSchema, req.body, 'تعذّر حفظ اللعبة: بعض الحقول أطول من المسموح أو غير مكتملة.');
    if (revision !== row.revision)
      throw new HttpError(409, 'عُدّلت هذه اللعبة من جهاز أو نافذة أخرى. حمّلي أحدث نسخة قبل المتابعة.', { code: 'conflict' });
    db.prepare('UPDATE games SET draft = ?, revision = revision + 1, updated_at = ? WHERE id = ?').run(serialize(draft), nowIso(), row.id);
    res.json({ game: toRecord(ownGame(req)) });
  });

  api.post('/games/:id/publish', auth, (req, res) => {
    const row = ownGame(req);
    const doc = GameDocSchema.parse(JSON.parse(row.draft));
    const issues = publishIssues(doc);
    if (issues.length) throw new HttpError(422, 'اللعبة غير جاهزة للنشر بعد.', { issues });
    db.prepare(
      `UPDATE games SET published = draft, published_version = published_version + 1, is_published = 1,
       published_at = ?, updated_at = ? WHERE id = ?`,
    ).run(nowIso(), nowIso(), row.id);
    res.json({ game: toRecord(ownGame(req)) });
  });

  api.post('/games/:id/unpublish', auth, (req, res) => {
    const row = ownGame(req);
    db.prepare('UPDATE games SET is_published = 0, updated_at = ? WHERE id = ?').run(nowIso(), row.id);
    res.json({ game: toRecord(ownGame(req)) });
  });

  api.post('/games/:id/duplicate', auth, (req, res) => {
    const row = ownGame(req);
    const doc = JSON.parse(row.draft) as GameDoc;
    doc.meta.title = `نسخة من ${doc.meta.title || 'لعبة بلا اسم'}`.slice(0, 80);
    const id = newId('');
    const now = nowIso();
    db.prepare('INSERT INTO games (id, owner_id, draft, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user!.id, serialize(doc), now, now);
    res.status(201).json({ game: toRecord(gameOf(req.user!.id, id)) });
  });

  api.delete('/games/:id', auth, (req, res) => {
    const row = ownGame(req);
    db.prepare('DELETE FROM games WHERE id = ?').run(row.id);
    res.json({ ok: true });
  });

  // ---- Results ---------------------------------------------------------------------------------
  const attemptsOf = (gameId: string): AttemptRow[] =>
    (
      db.prepare('SELECT * FROM attempts WHERE game_id = ? ORDER BY created_at DESC').all(gameId) as unknown as {
        id: string;
        player: string;
        version: number;
        outcome: 'completed' | 'timeout';
        score: number;
        max_score: number;
        correct: number;
        total: number;
        duration_sec: number;
        created_at: string;
        answers: string;
      }[]
    ).map((r) => ({
      id: r.id,
      player: r.player,
      version: r.version,
      outcome: r.outcome,
      score: r.score,
      maxScore: r.max_score,
      correct: r.correct,
      total: r.total,
      durationSec: r.duration_sec,
      createdAt: r.created_at,
      answers: JSON.parse(r.answers),
    }));

  const questionsFor = (row: GameRow) => {
    // Prefer the published wording (what students saw), then any question only in the draft.
    const pub = row.published ? (JSON.parse(row.published) as GameDoc).questions : [];
    const draft = (JSON.parse(row.draft) as GameDoc).questions;
    const ids = new Set(pub.map((q) => q.id));
    return [...pub, ...draft.filter((q) => !ids.has(q.id))];
  };

  api.get('/games/:id/results', auth, (req, res) => {
    const row = ownGame(req);
    const attempts = attemptsOf(row.id);
    res.json({
      stats: computeStats(attempts, questionsFor(row)),
      attempts: attempts.slice(0, 500).map(({ answers: _a, ...rest }) => rest),
      recording: (JSON.parse(row.published ?? row.draft) as GameDoc).settings.recordResults,
    });
  });

  api.get('/games/:id/results.csv', auth, (req, res) => {
    const row = ownGame(req);
    const attempts = attemptsOf(row.id);
    const questions = questionsFor(row);
    const header = ['الطالبة/الرمز', 'التاريخ', 'الدرجة', 'الدرجة الكاملة', 'النسبة %', 'الإجابات الصحيحة', 'عدد الأسئلة', 'المدة (ثانية)', 'الحالة'];
    header.push(...questions.map((q, i) => `س${i + 1}: ${q.prompt.slice(0, 40)}`));
    const rows: (string | number)[][] = [header];
    for (const a of attempts) {
      const byQ = new Map(a.answers.map((x) => [x.qid, x]));
      rows.push([
        a.player || 'بدون اسم',
        new Date(a.createdAt).toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'short', timeStyle: 'short' }),
        a.score,
        a.maxScore,
        a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0,
        a.correct,
        a.total,
        a.durationSec,
        a.outcome === 'completed' ? 'مكتملة' : 'انتهى الوقت',
        ...questions.map((q) => {
          const x = byQ.get(q.id);
          return x ? (x.correct ? (x.tries <= 1 ? 'صحيحة' : 'صحيحة بعد محاولة') : 'خاطئة') : '—';
        }),
      ]);
    }
    const title = (JSON.parse(row.draft) as GameDoc).meta.title || 'نتائج';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="results.csv"; filename*=UTF-8''${encodeURIComponent(`نتائج - ${title}.csv`)}`);
    res.send(toCsv(rows));
  });

  api.delete('/games/:id/results', auth, (req, res) => {
    const row = ownGame(req);
    db.prepare('DELETE FROM attempts WHERE game_id = ?').run(row.id);
    res.json({ ok: true });
  });

  // ---- Images ----------------------------------------------------------------------------------
  api.post('/assets', auth, express.raw({ type: () => true, limit: '2mb' }), (req, res) => {
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(400, 'لم يصل أي ملف.');
    const kind = IMAGE_SIGNATURES.find((s) => s.test(body));
    if (!kind) throw new HttpError(415, 'نوع الملف غير مدعوم. استخدمي صورة PNG أو JPG أو WEBP.');
    const id = newId('a');
    db.prepare('INSERT INTO assets (id, owner_id, mime, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      req.user!.id,
      kind.mime,
      body,
      body.length,
      nowIso(),
    );
    res.status(201).json({ id });
  });

  api.get('/assets/:id', (req, res) => {
    const row = db.prepare('SELECT mime, data FROM assets WHERE id = ?').get(req.params.id) as { mime: string; data: Uint8Array } | undefined;
    if (!row) throw new HttpError(404, 'الصورة غير موجودة.');
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(row.data));
  });

  // ---- Student play (public) ------------------------------------------------------------------
  const publishedGame = (id: string) => {
    const row = db.prepare('SELECT id, published, published_version, is_published FROM games WHERE id = ?').get(id) as
      | Pick<GameRow, 'id' | 'published' | 'published_version' | 'is_published'>
      | undefined;
    if (!row || !row.published) throw new HttpError(404, 'لم نجد هذه اللعبة. تأكدي من الرابط مع معلمتكِ.', { code: 'not_found' });
    if (!row.is_published) throw new HttpError(410, 'هذه اللعبة غير متاحة حاليًا. أوقفت المعلمة نشرها مؤقتًا.', { code: 'paused' });
    return { id: row.id, version: row.published_version, doc: JSON.parse(row.published) as GameDoc };
  };

  api.get('/play/:id', (req, res) => {
    const payload: PlayPayload = publishedGame(req.params.id);
    res.setHeader('Cache-Control', 'no-store');
    res.json(payload);
  });

  api.post('/play/:id/attempts', (req, res) => {
    if (!attemptLimit(req.ip ?? '')) throw new HttpError(429, 'محاولات إرسال كثيرة. حاولي بعد قليل.');
    const game = publishedGame(req.params.id);
    if (!game.doc.settings.recordResults) throw new HttpError(403, 'تسجيل النتائج غير مفعّل في هذه اللعبة.');
    const p = parse(AttemptPayloadSchema, req.body, 'تعذّر قراءة النتيجة.');
    // The score is recalculated here from the published rules; answers to questions that are
    // not in the published game are ignored.
    const ids = new Set(game.doc.questions.map((q) => q.id));
    const seen = new Set<string>();
    const answers = p.answers.filter((a) => ids.has(a.qid) && !seen.has(a.qid) && seen.add(a.qid));
    const s = game.doc.settings;
    const total = s.questionCount > 0 ? Math.min(s.questionCount, ids.size) : ids.size;
    const score = answers.reduce((sum, a) => sum + pointsFor(s, a), 0);
    db.prepare(
      `INSERT INTO attempts (id, game_id, version, player, outcome, score, max_score, correct, total, duration_sec, answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      newId('t'),
      game.id,
      p.version,
      s.askPlayerName ? p.player.trim() : '',
      p.outcome,
      score,
      total * s.pointsPerQuestion,
      answers.filter((a) => a.correct).length,
      total,
      p.durationSec,
      JSON.stringify(answers),
      nowIso(),
    );
    res.status(201).json({ ok: true });
  });

  api.use((_req, _res, next) => next(new HttpError(404, 'المسار غير موجود.')));
  app.use('/api', api);

  // ---- Client app --------------------------------------------------------------------------------
  if (opts.publicDir && existsSync(opts.publicDir)) {
    const dir = opts.publicDir;
    app.use(express.static(dir, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(join(dir, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...err.extra });
      return;
    }
    const e = err as { type?: string; status?: number };
    if (e?.type === 'entity.too.large') {
      res.status(413).json({ error: 'حجم البيانات أكبر من المسموح. صغّري الصورة أو قلّلي المحتوى.' });
      return;
    }
    if (e?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'تعذّر قراءة البيانات المرسلة.' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم. حاولي مرة أخرى.' });
  });

  return app;
}
