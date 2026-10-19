// The game engine: pure, template-independent rules for selecting questions, grading
// answers and scoring. Templates (stars / maze / gates) decide how a round *looks and
// flows*; everything that decides right/wrong and points lives here.
import type {
  AnswerRecord,
  Difficulty,
  GameDoc,
  GameSettings,
  Option,
  Question,
  TemplateId,
} from './schema.ts';
import { normalizeAnswer } from './text.ts';

// ---- Seeded randomness (so a round can be reproduced in tests) ---------------------------

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newId(prefix = ''): string {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return prefix + out;
}

// ---- Answers --------------------------------------------------------------------------------

export type Response =
  | { type: 'mcq'; optionId: string }
  | { type: 'tf'; value: boolean }
  | { type: 'short'; text: string }
  | { type: 'order'; ids: string[] };

export function isCorrect(q: Question, r: Response): boolean {
  switch (q.type) {
    case 'mcq':
      return r.type === 'mcq' && r.optionId === q.correctId;
    case 'tf':
      return r.type === 'tf' && r.value === q.answer;
    case 'short': {
      if (r.type !== 'short') return false;
      const given = normalizeAnswer(r.text);
      return given.length > 0 && q.accepted.some((a) => normalizeAnswer(a) === given);
    }
    case 'order':
      return r.type === 'order' && r.ids.length === q.items.length && r.ids.every((id, i) => id === q.items[i].id);
  }
}

export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case 'mcq':
      return q.options.find((o) => o.id === q.correctId)?.text ?? '';
    case 'tf':
      return q.answer ? 'صح' : 'خطأ';
    case 'short': {
      const seen = new Set<string>();
      return q.accepted
        .filter((a) => a.trim() && !seen.has(normalizeAnswer(a)) && seen.add(normalizeAnswer(a)))
        .join(' أو ');
    }
    case 'order':
      return q.items.map((i) => i.text).join(' ← ');
  }
}

// ---- Rounds ---------------------------------------------------------------------------------

// A question prepared for one play-through: options shuffled (if enabled) and order items
// presented in a scrambled starting arrangement.
export interface PlayQuestion {
  q: Question;
  options: Option[]; // mcq: display order · order: starting arrangement · others: []
}

export function prepareRound(doc: GameDoc, rng: Rng): PlayQuestion[] {
  const { settings } = doc;
  let qs = doc.questions.slice();
  if (settings.order === 'random') qs = shuffle(qs, rng);
  const count = settings.questionCount > 0 ? Math.min(settings.questionCount, qs.length) : qs.length;
  if (count < qs.length) {
    // Pick a random subset but keep the teacher's order when order is fixed.
    const picked = new Set(shuffle(qs, rng).slice(0, count).map((q) => q.id));
    qs = qs.filter((q) => picked.has(q.id));
  }
  return qs.map((q) => ({ q, options: displayOptions(q, settings, rng) }));
}

function displayOptions(q: Question, settings: GameSettings, rng: Rng): Option[] {
  if (q.type === 'mcq') return settings.shuffleOptions ? shuffle(q.options, rng) : q.options.slice();
  if (q.type === 'order') {
    if (q.items.length < 2) return q.items.slice();
    let arr = shuffle(q.items, rng);
    for (let guard = 0; guard < 10 && arr.every((it, i) => it.id === q.items[i].id); guard++) arr = shuffle(q.items, rng);
    if (arr.every((it, i) => it.id === q.items[i].id)) arr = q.items.slice().reverse();
    return arr;
  }
  return [];
}

// ---- Scoring --------------------------------------------------------------------------------

// Full points on the first try, half on a later try, nothing if the answer was revealed.
// With the "penalty" hint mode, opening a hint removes a quarter of the question's points.
export function pointsFor(settings: Pick<GameSettings, 'pointsPerQuestion' | 'hints'>, a: Omit<AnswerRecord, 'qid'>): number {
  if (!a.correct) return 0;
  let pts = a.tries <= 1 ? settings.pointsPerQuestion : Math.ceil(settings.pointsPerQuestion / 2);
  if (a.usedHint && settings.hints === 'penalty') pts -= Math.ceil(settings.pointsPerQuestion / 4);
  return Math.max(pts, 0);
}

export interface RoundSummary {
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  percent: number;
  stars: 0 | 1 | 2 | 3;
}

export function summarize(settings: GameSettings, answers: AnswerRecord[], totalQuestions: number): RoundSummary {
  const score = answers.reduce((s, a) => s + pointsFor(settings, a), 0);
  const maxScore = totalQuestions * settings.pointsPerQuestion;
  const correct = answers.filter((a) => a.correct).length;
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const stars = percent >= 85 ? 3 : percent >= 60 ? 2 : percent >= 30 ? 1 : 0;
  return { score, maxScore, correct, total: totalQuestions, percent, stars };
}

// ---- Template rules that depend on difficulty ------------------------------------------------

export const DIFFICULTY_RULES: Record<TemplateId, Record<Difficulty, string>> = {
  stars: {
    easy: 'تُفتح المنطقة التالية بعد جمع ثلث نجوم المنطقة.',
    medium: 'تُفتح المنطقة التالية بعد جمع نصف نجوم المنطقة.',
    hard: 'تُفتح المنطقة التالية بعد جمع ثلثي نجوم المنطقة.',
  },
  maze: {
    easy: 'المتاهة مكشوفة بالكامل.',
    medium: 'ضباب خفيف: يظهر ما حول الطالبة فقط.',
    hard: 'ضباب كثيف، والخطأ يعيد الطالبة إلى نقطة التفتيش السابقة.',
  },
  gates: {
    easy: '٥ قلوب طاقة لكل بوابة.',
    medium: '٣ قلوب طاقة لكل بوابة.',
    hard: 'قلبان فقط لكل بوابة.',
  },
};

export const STAR_THRESHOLD: Record<Difficulty, number> = { easy: 1 / 3, medium: 1 / 2, hard: 2 / 3 };
export const GATE_HEARTS: Record<Difficulty, number> = { easy: 5, medium: 3, hard: 2 };
export const MAZE_FOG: Record<Difficulty, number> = { easy: 99, medium: 2, hard: 1 };

// Splits n items into groups of roughly `size`, never leaving a group of one when avoidable.
export function splitIntoGroups<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const groupCount = Math.max(1, Math.round(items.length / size));
  const groups: T[][] = [];
  let start = 0;
  for (let g = 0; g < groupCount; g++) {
    const len = Math.floor(items.length / groupCount) + (g < items.length % groupCount ? 1 : 0);
    groups.push(items.slice(start, start + len));
    start += len;
  }
  return groups;
}
