// Class results computed from recorded attempts. Used by the server (dashboard + CSV export).
import type { AnswerRecord, Question } from './schema.ts';

export interface AttemptRow {
  id: string;
  player: string;
  version: number;
  outcome: 'completed' | 'timeout';
  score: number;
  maxScore: number;
  correct: number;
  total: number;
  durationSec: number;
  createdAt: string;
  answers: AnswerRecord[];
}

export interface QuestionStat {
  qid: string;
  prompt: string;
  concept: string;
  answered: number;
  correctRate: number; // 0..1 — answered correctly at any try
  firstTryRate: number; // 0..1
  hintRate: number; // 0..1
}

export interface ConceptStat {
  concept: string;
  answered: number;
  correctRate: number;
}

export interface ResultsStats {
  attemptCount: number;
  averagePercent: number;
  correctRate: number;
  completedRate: number;
  averageDurationSec: number;
  questions: QuestionStat[]; // hardest first
  concepts: ConceptStat[]; // weakest first
}

export function computeStats(attempts: AttemptRow[], questions: Question[]): ResultsStats {
  const byQ = new Map<string, { answered: number; correct: number; first: number; hint: number }>();
  let answered = 0;
  let correct = 0;
  for (const a of attempts)
    for (const r of a.answers) {
      const s = byQ.get(r.qid) ?? { answered: 0, correct: 0, first: 0, hint: 0 };
      s.answered++;
      if (r.correct) s.correct++;
      if (r.correct && r.tries <= 1) s.first++;
      if (r.usedHint) s.hint++;
      byQ.set(r.qid, s);
      answered++;
      if (r.correct) correct++;
    }

  const known = new Map(questions.map((q) => [q.id, q]));
  const questionStats: QuestionStat[] = [...byQ.entries()].map(([qid, s]) => ({
    qid,
    prompt: known.get(qid)?.prompt ?? 'سؤال محذوف من اللعبة',
    concept: known.get(qid)?.concept.trim() ?? '',
    answered: s.answered,
    correctRate: s.correct / s.answered,
    firstTryRate: s.first / s.answered,
    hintRate: s.hint / s.answered,
  }));
  questionStats.sort((a, b) => a.correctRate - b.correctRate || a.firstTryRate - b.firstTryRate);

  const byConcept = new Map<string, { answered: number; correct: number }>();
  for (const q of questionStats) {
    if (!q.concept) continue;
    const c = byConcept.get(q.concept) ?? { answered: 0, correct: 0 };
    c.answered += q.answered;
    c.correct += q.correctRate * q.answered;
    byConcept.set(q.concept, c);
  }
  const concepts = [...byConcept.entries()]
    .map(([concept, c]) => ({ concept, answered: c.answered, correctRate: c.correct / c.answered }))
    .sort((a, b) => a.correctRate - b.correctRate);

  const n = attempts.length;
  return {
    attemptCount: n,
    averagePercent: n ? Math.round(attempts.reduce((s, a) => s + (a.maxScore ? (a.score / a.maxScore) * 100 : 0), 0) / n) : 0,
    correctRate: answered ? correct / answered : 0,
    completedRate: n ? attempts.filter((a) => a.outcome === 'completed').length / n : 0,
    averageDurationSec: n ? Math.round(attempts.reduce((s, a) => s + a.durationSec, 0) / n) : 0,
    questions: questionStats,
    concepts,
  };
}
