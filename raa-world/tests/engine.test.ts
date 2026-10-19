import { describe, expect, it } from 'vitest';
import { createRng, isCorrect, pointsFor, prepareRound, summarize, splitIntoGroups, correctAnswerText } from '../shared/engine.ts';
import { normalizeAnswer } from '../shared/text.ts';
import { mathSample, scienceSample, blankGame } from '../shared/samples.ts';
import { publishIssues } from '../shared/validation.ts';
import { GameDocSchema, type Question } from '../shared/schema.ts';

describe('normalizeAnswer', () => {
  it('ignores tashkeel, hamza forms, taa marbuta and digits style', () => {
    expect(normalizeAnswer('  الْبِنَاءُ الضَّوْئِيُّ ')).toBe(normalizeAnswer('البناء الضوئي'));
    expect(normalizeAnswer('أرض')).toBe(normalizeAnswer('ارض'));
    expect(normalizeAnswer('مدرسة')).toBe(normalizeAnswer('مدرسه'));
    expect(normalizeAnswer('١/٢')).toBe('1/2');
    expect(normalizeAnswer('٥٦.')).toBe('56');
  });
});

describe('grading', () => {
  const sci = scienceSample();
  const [mcq, tf, , short, order] = sci.questions as Question[];
  it('grades every question type', () => {
    if (mcq.type !== 'mcq' || tf.type !== 'tf' || short.type !== 'short' || order.type !== 'order') throw new Error('sample changed');
    expect(isCorrect(mcq, { type: 'mcq', optionId: mcq.correctId })).toBe(true);
    expect(isCorrect(mcq, { type: 'mcq', optionId: mcq.options[1].id })).toBe(false);
    expect(isCorrect(tf, { type: 'tf', value: true })).toBe(true);
    expect(isCorrect(short, { type: 'short', text: 'التمثيل الضوئى' })).toBe(true);
    expect(isCorrect(short, { type: 'short', text: '' })).toBe(false);
    expect(isCorrect(order, { type: 'order', ids: order.items.map((i) => i.id) })).toBe(true);
    expect(isCorrect(order, { type: 'order', ids: order.items.map((i) => i.id).reverse() })).toBe(false);
    expect(correctAnswerText(tf)).toBe('صح');
  });

  it('scores first tries fully, later tries half, hints with penalty', () => {
    const s = { pointsPerQuestion: 10, hints: 'penalty' as const };
    expect(pointsFor(s, { correct: true, tries: 1, usedHint: false })).toBe(10);
    expect(pointsFor(s, { correct: true, tries: 2, usedHint: false })).toBe(5);
    expect(pointsFor(s, { correct: true, tries: 1, usedHint: true })).toBe(7);
    expect(pointsFor(s, { correct: false, tries: 3, usedHint: false })).toBe(0);
    expect(pointsFor({ pointsPerQuestion: 10, hints: 'free' }, { correct: true, tries: 1, usedHint: true })).toBe(10);
  });
});

describe('rounds', () => {
  it('respects question count, order and option shuffling', () => {
    const doc = mathSample();
    doc.settings.questionCount = 4;
    const round = prepareRound(doc, createRng(7));
    expect(round).toHaveLength(4);
    const ids = doc.questions.map((q) => q.id);
    const positions = round.map((p) => ids.indexOf(p.q.id));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions); // fixed order kept
    for (const p of round) if (p.q.type === 'order') expect(p.options.map((o) => o.id)).not.toEqual(p.q.items.map((i) => i.id));
  });

  it('summarises a round', () => {
    const doc = scienceSample();
    const s = summarize(doc.settings, [
      { qid: 'a', correct: true, tries: 1, usedHint: false },
      { qid: 'b', correct: true, tries: 2, usedHint: false },
      { qid: 'c', correct: false, tries: 2, usedHint: false },
    ], 3);
    expect(s).toMatchObject({ score: 15, maxScore: 30, correct: 2, percent: 50, stars: 1 });
  });

  it('splits into balanced groups', () => {
    expect(splitIntoGroups([1, 2, 3, 4, 5], 3).map((g) => g.length)).toEqual([3, 2]);
    expect(splitIntoGroups([1, 2, 3, 4, 5, 6, 7], 3).map((g) => g.length)).toEqual([4, 3]);
    expect(splitIntoGroups([1, 2], 3).map((g) => g.length)).toEqual([2]);
  });
});

describe('samples & validation', () => {
  it('samples are valid and publishable; blank is not', () => {
    for (const d of [scienceSample(), mathSample()]) {
      expect(GameDocSchema.safeParse(d).success).toBe(true);
      expect(publishIssues(d)).toEqual([]);
    }
    const issues = publishIssues(blankGame());
    expect(issues.map((i) => i.section)).toContain('questions');
    expect(issues.map((i) => i.section)).toContain('info');
  });
});
