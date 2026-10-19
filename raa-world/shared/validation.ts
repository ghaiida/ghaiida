// "Ready to publish?" checks. Drafts may be incomplete; publishing requires a playable game.
import type { GameDoc, Question } from './schema.ts';

export interface Issue {
  // Where the teacher should go to fix it.
  section: 'info' | 'template' | 'questions' | 'settings' | 'look';
  questionId?: string;
  message: string;
}

export const MIN_QUESTIONS = 3;

export function questionIssues(q: Question): string[] {
  const out: string[] = [];
  if (!q.prompt.trim()) out.push('نص السؤال فارغ.');
  switch (q.type) {
    case 'mcq': {
      const filled = q.options.filter((o) => o.text.trim());
      if (filled.length < 2) out.push('أضيفي خيارين على الأقل.');
      if (filled.length !== q.options.length) out.push('يوجد خيار فارغ؛ اكتبيه أو احذفيه.');
      const correct = q.options.find((o) => o.id === q.correctId);
      if (!correct || !correct.text.trim()) out.push('حدّدي الإجابة الصحيحة.');
      const texts = filled.map((o) => o.text.trim());
      if (new Set(texts).size !== texts.length) out.push('يوجد خياران متطابقان.');
      break;
    }
    case 'short':
      if (!q.accepted.some((a) => a.trim())) out.push('اكتبي إجابة مقبولة واحدة على الأقل.');
      break;
    case 'order': {
      const filled = q.items.filter((i) => i.text.trim());
      if (filled.length < 3) out.push('أضيفي ثلاثة عناصر على الأقل للترتيب.');
      if (filled.length !== q.items.length) out.push('يوجد عنصر فارغ؛ اكتبيه أو احذفيه.');
      break;
    }
    case 'tf':
      break;
  }
  return out;
}

export function publishIssues(doc: GameDoc): Issue[] {
  const issues: Issue[] = [];
  if (!doc.meta.title.trim()) issues.push({ section: 'info', message: 'اكتبي اسم اللعبة.' });
  if (!doc.meta.subject.trim()) issues.push({ section: 'info', message: 'اختاري المادة الدراسية.' });
  if (!doc.meta.grade.trim()) issues.push({ section: 'info', message: 'اختاري الصف الدراسي.' });
  if (doc.questions.length < MIN_QUESTIONS)
    issues.push({ section: 'questions', message: `تحتاج اللعبة إلى ${MIN_QUESTIONS} أسئلة على الأقل (لديك ${doc.questions.length}).` });
  doc.questions.forEach((q, i) => {
    for (const m of questionIssues(q)) issues.push({ section: 'questions', questionId: q.id, message: `السؤال ${i + 1}: ${m}` });
  });
  const { questionCount } = doc.settings;
  if (questionCount > 0 && questionCount < MIN_QUESTIONS)
    issues.push({ section: 'settings', message: `عدد أسئلة الجولة يجب ألا يقل عن ${MIN_QUESTIONS}.` });
  return issues;
}
