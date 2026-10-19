// API-level checks of the product rules: per-teacher isolation, draft vs. published copies,
// share links and result recording.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { openDb } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import type { GameRecord } from '../shared/schema.ts';

let server: Server;
let base = '';

beforeAll(async () => {
  const db = openDb(':memory:');
  db.prepare("INSERT INTO licenses (code, created_at) VALUES ('RAA-TEST-0000-0001', 'now')").run();
  server = createApp({ db, requireActivationCode: false }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => server.close());

function client() {
  let cookie = '';
  return async (path: string, init: { method?: string; body?: unknown } = {}) => {
    const res = await fetch(base + path, {
      method: init.method ?? 'GET',
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
}

describe('teacher games', () => {
  const math = client();
  const arabic = client();
  const student = client();
  let mathGame: GameRecord;
  let arabicGame: GameRecord;

  it('registers two teachers', async () => {
    expect((await math('/auth/register', { method: 'POST', body: { name: 'معلمة الرياضيات', email: 'm@x.sa', password: 'password1' } })).status).toBe(201);
    expect((await arabic('/auth/register', { method: 'POST', body: { name: 'معلمة اللغة', email: 'a@x.sa', password: 'password1' } })).status).toBe(201);
    expect((await math('/auth/register', { method: 'POST', body: { name: 'معلمة أخرى', email: 'm@x.sa', password: 'password1' } })).status).toBe(409);
  });

  it('creates two games from the same template with different content', async () => {
    mathGame = (await math('/games', { method: 'POST', body: { start: 'math' } })).body.game;
    arabicGame = (await arabic('/games', { method: 'POST', body: { start: 'math' } })).body.game;
    expect(mathGame.id).not.toBe(arabicGame.id);
    // The Arabic teacher replaces the content with her own lesson.
    const d = structuredClone(arabicGame.draft);
    d.meta.title = 'متاهة أنواع الجمل';
    d.meta.subject = 'اللغة العربية';
    d.questions = d.questions.slice(0, 3).map((q, i) => ({ ...q, prompt: `ما نوع الجملة ${i + 1}؟` }));
    const saved = await arabic(`/games/${arabicGame.id}/draft`, { method: 'PUT', body: { draft: d, revision: arabicGame.revision } });
    expect(saved.status).toBe(200);
    arabicGame = saved.body.game;
    const mine = (await math(`/games/${mathGame.id}`)).body.game as GameRecord;
    expect(mine.draft.meta.title).toBe('متاهة الكسور');
    expect(mine.draft.questions).toHaveLength(6);
    expect(mine.draft.questions[0].prompt).not.toContain('نوع الجملة');
  });

  it('keeps games private to their owner', async () => {
    expect((await arabic(`/games/${mathGame.id}`)).status).toBe(404);
    expect((await arabic(`/games/${mathGame.id}/draft`, { method: 'PUT', body: { draft: mathGame.draft, revision: mathGame.revision } })).status).toBe(404);
    expect((await arabic(`/games/${mathGame.id}`, { method: 'DELETE' })).status).toBe(404);
    expect((await math('/games')).body.games.map((g: { id: string }) => g.id)).toEqual([mathGame.id]);
  });

  it('serves only published copies and keeps drafts separate', async () => {
    expect((await student(`/play/${mathGame.id}`)).status).toBe(404);
    const pub = await math(`/games/${mathGame.id}/publish`, { method: 'POST' });
    expect(pub.status).toBe(200);
    expect(pub.body.game.status).toBe('live');
    mathGame = pub.body.game;

    const d = structuredClone(mathGame.draft);
    d.questions[0].prompt = 'سؤال معدّل لم يُنشر بعد';
    mathGame = (await math(`/games/${mathGame.id}/draft`, { method: 'PUT', body: { draft: d, revision: mathGame.revision } })).body.game;
    expect(mathGame.status).toBe('changed');
    const play = await student(`/play/${mathGame.id}`);
    expect(play.body.doc.questions[0].prompt).not.toBe('سؤال معدّل لم يُنشر بعد');
    expect(play.body.version).toBe(1);

    mathGame = (await math(`/games/${mathGame.id}/publish`, { method: 'POST' })).body.game;
    const play2 = await student(`/play/${mathGame.id}`);
    expect(play2.body.doc.questions[0].prompt).toBe('سؤال معدّل لم يُنشر بعد');
    expect(play2.body.version).toBe(2);

    await math(`/games/${mathGame.id}/unpublish`, { method: 'POST' });
    expect((await student(`/play/${mathGame.id}`)).status).toBe(410);
    await math(`/games/${mathGame.id}/publish`, { method: 'POST' });
    expect((await student(`/play/${mathGame.id}`)).status).toBe(200);
  });

  it('rejects stale saves from another device', async () => {
    const stale = await math(`/games/${mathGame.id}/draft`, { method: 'PUT', body: { draft: mathGame.draft, revision: mathGame.revision - 1 } });
    expect(stale.status).toBe(409);
  });

  it('refuses to publish an incomplete game with clear issues', async () => {
    const blank = (await arabic('/games', { method: 'POST', body: { start: 'blank' } })).body.game as GameRecord;
    const r = await arabic(`/games/${blank.id}/publish`, { method: 'POST' });
    expect(r.status).toBe(422);
    expect(r.body.issues.length).toBeGreaterThan(0);
  });

  it('records results only when enabled, recomputing the score', async () => {
    const qid = mathGame.draft.questions[0].id;
    const attempt = { version: 3, player: 'نورة', outcome: 'completed', durationSec: 90, answers: [{ qid, correct: true, tries: 1, usedHint: false }, { qid: 'fake', correct: true, tries: 1, usedHint: false }] };
    expect((await student(`/play/${mathGame.id}/attempts`, { method: 'POST', body: attempt })).status).toBe(403);
    const d = structuredClone(mathGame.draft);
    d.settings.recordResults = true;
    const cur = (await math(`/games/${mathGame.id}`)).body.game as GameRecord;
    await math(`/games/${mathGame.id}/draft`, { method: 'PUT', body: { draft: d, revision: cur.revision } });
    await math(`/games/${mathGame.id}/publish`, { method: 'POST' });
    expect((await student(`/play/${mathGame.id}/attempts`, { method: 'POST', body: attempt })).status).toBe(201);
    const res = await math(`/games/${mathGame.id}/results`);
    expect(res.body.stats.attemptCount).toBe(1);
    expect(res.body.attempts[0]).toMatchObject({ player: 'نورة', score: 10, maxScore: 60, correct: 1 });
    expect((await arabic(`/games/${mathGame.id}/results`)).status).toBe(404);
  });

  it('duplicates and deletes', async () => {
    const dup = await math(`/games/${mathGame.id}/duplicate`, { method: 'POST' });
    expect(dup.body.game.status).toBe('draft');
    expect(dup.body.game.draft.meta.title).toContain('نسخة من');
    expect((await math(`/games/${dup.body.game.id}`, { method: 'DELETE' })).status).toBe(200);
    expect((await math(`/games/${dup.body.game.id}`)).status).toBe(404);
  });
});
