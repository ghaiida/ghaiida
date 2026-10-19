import { describe, expect, it } from 'vitest';
import { rowsToQuestions, TEMPLATE_HEADERS, TEMPLATE_EXAMPLE_ROWS, questionsToRows } from '../shared/importer.ts';
import { scienceSample } from '../shared/samples.ts';

describe('rowsToQuestions', () => {
  it('reads the downloadable template example', () => {
    const r = rowsToQuestions([TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS]);
    expect(r.errors).toEqual([]);
    expect(r.questions.map((q) => q.question.type)).toEqual(['mcq', 'tf', 'short', 'order']);
    const mcq = r.questions[0].question;
    if (mcq.type !== 'mcq') throw new Error();
    expect(mcq.options.find((o) => o.id === mcq.correctId)?.text).toBe('الرياض');
  });

  it('reports understandable row errors', () => {
    const r = rowsToQuestions([
      ['النوع', 'السؤال', 'الخيار 1', 'الخيار 2', 'الإجابة الصحيحة'],
      ['اختيار من متعدد', 'سؤال', 'أ', 'ب', '5'],
      ['صح أو خطأ', 'سؤال', '', '', 'ربما'],
      ['', '', '', '', ''],
      ['لغز', 'سؤال', '', '', 'x'],
      ['إجابة قصيرة', '', '', '', 'x'],
    ]);
    expect(r.questions).toHaveLength(0);
    expect(r.skippedEmpty).toBe(1);
    expect(r.errors.map((e) => e.row)).toEqual([2, 3, 5, 6]);
    expect(r.errors[0].message).toContain('لا يطابق');
  });

  it('accepts english headers, answer text and arabic digits', () => {
    const r = rowsToQuestions([
      ['type', 'question', 'option1', 'option2', 'option3', 'answer'],
      ['mcq', '2+2?', '3', '4', '5', '4'],
      ['mcq', 'اختاري', 'قط', 'كلب', '', '٢'],
      ['tf', 'x', '', '', '', 'خطأ'],
    ]);
    expect(r.errors).toEqual([]);
    const [a, b, c] = r.questions.map((q) => q.question);
    if (a.type !== 'mcq' || b.type !== 'mcq' || c.type !== 'tf') throw new Error();
    expect(a.options.find((o) => o.id === a.correctId)?.text).toBe('4');
    expect(b.options.find((o) => o.id === b.correctId)?.text).toBe('كلب');
    expect(c.answer).toBe(false);
  });

  it('round-trips exported questions', () => {
    const doc = scienceSample();
    const r = rowsToQuestions(questionsToRows(doc.questions));
    expect(r.errors).toEqual([]);
    expect(r.questions.map((q) => q.question.prompt)).toEqual(doc.questions.map((q) => q.prompt));
  });
});
