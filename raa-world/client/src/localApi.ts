// In-browser stand-in for the server, used only by the single-file trial build
// (VITE_LOCAL_DEMO=1). It mirrors the API in server/app.ts with the same shared rules,
// but everything lives in this browser's storage: nothing reaches other devices.
import { AttemptPayloadSchema, GameDocSchema, type GameDoc, type GameRecord, type GameStatus, type GameSummary, type PublicUser } from '../../shared/schema.ts';
import { newId, pointsFor } from '../../shared/engine.ts';
import { publishIssues } from '../../shared/validation.ts';
import { blankGame, SAMPLES } from '../../shared/samples.ts';
import { computeStats, type AttemptRow } from '../../shared/stats.ts';
import { toCsv } from '../../shared/importer.ts';

interface Row {
  id: string;
  draft: string;
  revision: number;
  published: string | null;
  publishedVersion: number;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
}
interface Store {
  user: (PublicUser & { password: string }) | null;
  signedIn: boolean;
  games: Record<string, Row>;
  attempts: (AttemptRow & { gameId: string })[];
  assets: Record<string, string>;
}

const KEY = 'raa-world-trial-v1';
let memory: Store | null = null;

function load(): Store {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as Store;
  } catch {
    /* storage blocked: keep everything in memory for this visit */
  }
  memory ??= { user: null, signedIn: false, games: {}, attempts: [], assets: {} };
  return memory;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch (e) {
    if ((e as Error).name === 'QuotaExceededError') fail(507, 'امتلأت مساحة التخزين في المتصفح. احذفي بعض الصور أو الألعاب ثم حاولي مجددًا.');
  }
}

class LocalError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
function fail(status: number, message: string, data: Record<string, unknown> = {}): never {
  throw new LocalError(status, message, { error: message, ...data });
}

const now = () => new Date().toISOString();
const serialize = (doc: GameDoc) => JSON.stringify(GameDocSchema.parse(doc));
const statusOf = (r: Row): GameStatus => (!r.published ? 'draft' : !r.isPublished ? 'paused' : r.published === r.draft ? 'live' : 'changed');
const toRecord = (r: Row): GameRecord => ({
  id: r.id,
  draft: JSON.parse(r.draft),
  revision: r.revision,
  status: statusOf(r),
  isPublished: r.isPublished,
  publishedVersion: r.publishedVersion,
  publishedAt: r.publishedAt,
  updatedAt: r.updatedAt,
});

function createGame(s: Store, doc: GameDoc): Row {
  const row: Row = { id: newId(''), draft: serialize(doc), revision: 1, published: null, publishedVersion: 0, isPublished: false, publishedAt: null, updatedAt: now() };
  s.games[row.id] = row;
  return row;
}

function publishRow(row: Row) {
  row.published = row.draft;
  row.publishedVersion++;
  row.isPublished = true;
  row.publishedAt = now();
  row.updatedAt = now();
}

// A new trial account starts with the two ready lessons so there is something to play at once.
function seed(s: Store, teacher: string) {
  if (Object.keys(s.games).length) return;
  const math = SAMPLES.math();
  math.meta.teacherName = teacher;
  publishRow(createGame(s, math));
  const sci = SAMPLES.science();
  sci.meta.teacherName = teacher;
  sci.settings.recordResults = true;
  publishRow(createGame(s, sci));
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(b);
  });

export function localAssetUrl(id: string): string {
  return load().assets[id] ?? '';
}

export async function localRequest(method: string, path: string, body: unknown, raw?: Blob): Promise<unknown> {
  const s = load();
  const parts = path.split('?')[0].split('/').filter(Boolean);
  const [a, id, sub] = parts;
  const b = (body ?? {}) as Record<string, unknown>;
  const me = () => (s.signedIn && s.user ? s.user : fail(401, 'سجّلي الدخول أولًا.'));
  const game = () => {
    me();
    return s.games[id] ?? fail(404, 'لم نجد هذه اللعبة.');
  };
  const pub = (u: Store['user']) => (u ? { id: u.id, name: u.name, email: u.email } : null);
  const out = await (async (): Promise<unknown> => {
    if (a === 'config') return { requireActivationCode: false };
    if (a === 'auth') {
      if (id === 'me') return { user: s.signedIn ? pub(s.user) : null };
      if (id === 'logout') {
        s.signedIn = false;
        return { ok: true };
      }
      const email = String(b.email ?? '').trim().toLowerCase();
      const password = String(b.password ?? '');
      if (id === 'register') {
        const name = String(b.name ?? '').trim();
        if (name.length < 2) fail(400, 'اكتبي اسمكِ (حرفان على الأقل).');
        if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, 'اكتبي بريدًا إلكترونيًا صحيحًا.');
        if (password.length < 8) fail(400, 'كلمة المرور يجب ألا تقل عن ٨ أحرف.');
        s.user = { id: newId('u'), name, email, password };
        s.signedIn = true;
        seed(s, name);
        return { user: pub(s.user) };
      }
      if (id === 'login') {
        if (!s.user || s.user.email !== email || s.user.password !== password)
          fail(401, s.user ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'لا يوجد حساب على هذا الجهاز بعد. أنشئي حسابًا تجريبيًا.');
        s.signedIn = true;
        return { user: pub(s.user) };
      }
    }
    if (a === 'games') {
      me();
      if (!id && method === 'GET') {
        const games: GameSummary[] = Object.values(s.games)
          .sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))
          .map((r) => {
            const d = JSON.parse(r.draft) as GameDoc;
            return {
              id: r.id,
              title: d.meta.title,
              subject: d.meta.subject,
              grade: d.meta.grade,
              templateId: d.templateId,
              theme: d.settings.theme,
              questionCount: d.questions.length,
              status: statusOf(r),
              updatedAt: r.updatedAt,
              publishedAt: r.publishedAt,
              attemptCount: s.attempts.filter((t) => t.gameId === r.id).length,
            };
          });
        return { games };
      }
      if (!id && method === 'POST') {
        const start = String(b.start ?? 'blank');
        const doc = start === 'science' || start === 'math' ? SAMPLES[start]() : blankGame();
        if (start === 'blank') doc.meta.teacherName = s.user!.name;
        return { game: toRecord(createGame(s, doc)) };
      }
      const row = game();
      if (!sub && method === 'GET') return { game: toRecord(row) };
      if (!sub && method === 'DELETE') {
        delete s.games[row.id];
        s.attempts = s.attempts.filter((t) => t.gameId !== row.id);
        return { ok: true };
      }
      if (sub === 'draft') {
        const parsed = GameDocSchema.safeParse(b.draft);
        if (!parsed.success) fail(400, 'تعذّر حفظ اللعبة: بعض الحقول أطول من المسموح أو غير مكتملة.');
        if (b.revision !== row.revision) fail(409, 'عُدّلت هذه اللعبة من نافذة أخرى. حمّلي أحدث نسخة قبل المتابعة.', { code: 'conflict' });
        row.draft = serialize(parsed.data);
        row.revision++;
        row.updatedAt = now();
        return { game: toRecord(row) };
      }
      if (sub === 'publish') {
        const issues = publishIssues(JSON.parse(row.draft));
        if (issues.length) fail(422, 'اللعبة غير جاهزة للنشر بعد.', { issues });
        publishRow(row);
        return { game: toRecord(row) };
      }
      if (sub === 'unpublish') {
        row.isPublished = false;
        row.updatedAt = now();
        return { game: toRecord(row) };
      }
      if (sub === 'duplicate') {
        const doc = JSON.parse(row.draft) as GameDoc;
        doc.meta.title = `نسخة من ${doc.meta.title || 'لعبة بلا اسم'}`.slice(0, 80);
        return { game: toRecord(createGame(s, doc)) };
      }
      const attempts = s.attempts.filter((t) => t.gameId === row.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      const pubQs = row.published ? (JSON.parse(row.published) as GameDoc).questions : [];
      const ids = new Set(pubQs.map((q) => q.id));
      const questions = [...pubQs, ...(JSON.parse(row.draft) as GameDoc).questions.filter((q) => !ids.has(q.id))];
      if (sub === 'results' && method === 'DELETE') {
        s.attempts = s.attempts.filter((t) => t.gameId !== row.id);
        return { ok: true };
      }
      if (sub === 'results')
        return {
          stats: computeStats(attempts, questions),
          attempts: attempts.map(({ answers: _a, gameId: _g, ...rest }) => rest),
          recording: (JSON.parse(row.published ?? row.draft) as GameDoc).settings.recordResults,
        };
      if (sub === 'results.csv') {
        const rows: (string | number)[][] = [['الطالبة/الرمز', 'الدرجة', 'الدرجة الكاملة', 'الإجابات الصحيحة', 'عدد الأسئلة', 'المدة (ثانية)']];
        for (const t of attempts) rows.push([t.player || 'بدون اسم', t.score, t.maxScore, t.correct, t.total, t.durationSec]);
        return { csv: toCsv(rows) };
      }
    }
    if (a === 'assets' && raw) {
      me();
      if (raw.size > 2 * 1024 * 1024) fail(413, 'الصورة كبيرة جدًا.');
      const assetId = newId('a');
      s.assets[assetId] = await blobToDataUrl(raw);
      return { id: assetId };
    }
    if (a === 'play') {
      const row = s.games[id];
      if (!row || !row.published) fail(404, 'لم نجد هذه اللعبة. تأكدي من الرابط مع معلمتكِ.');
      if (!row.isPublished) fail(410, 'هذه اللعبة غير متاحة حاليًا. أوقفت المعلمة نشرها مؤقتًا.');
      const doc = JSON.parse(row.published) as GameDoc;
      if (!sub) return { id: row.id, version: row.publishedVersion, doc };
      if (sub === 'attempts') {
        if (!doc.settings.recordResults) fail(403, 'تسجيل النتائج غير مفعّل في هذه اللعبة.');
        const p = AttemptPayloadSchema.safeParse(body);
        if (!p.success) fail(400, 'تعذّر قراءة النتيجة.');
        const qids = new Set(doc.questions.map((q) => q.id));
        const seen = new Set<string>();
        const answers = p.data.answers.filter((x) => qids.has(x.qid) && !seen.has(x.qid) && seen.add(x.qid));
        const st = doc.settings;
        const total = st.questionCount > 0 ? Math.min(st.questionCount, qids.size) : qids.size;
        s.attempts.push({
          id: newId('t'),
          gameId: row.id,
          player: st.askPlayerName ? p.data.player.trim() : '',
          version: p.data.version,
          outcome: p.data.outcome,
          score: answers.reduce((sum, x) => sum + pointsFor(st, x), 0),
          maxScore: total * st.pointsPerQuestion,
          correct: answers.filter((x) => x.correct).length,
          total,
          durationSec: p.data.durationSec,
          createdAt: now(),
          answers,
        });
        return { ok: true };
      }
    }
    fail(404, 'المسار غير موجود.');
  })();
  if (method !== 'GET') save();
  return out;
}

export { LocalError };
