// Turns spreadsheet rows (from CSV or Excel) into questions, with row-by-row Arabic errors.
// The same column layout is offered as a downloadable template.
import type { Option, Question, QuestionType } from './schema.ts';
import { newId } from './engine.ts';
import { normalizeAnswer, toWesternDigits } from './text.ts';
import { questionIssues } from './validation.ts';

export const MAX_OPTIONS = 6;

export const TEMPLATE_HEADERS = [
  'النوع',
  'السؤال',
  'الخيار 1',
  'الخيار 2',
  'الخيار 3',
  'الخيار 4',
  'الإجابة الصحيحة',
  'التلميح',
  'التفسير',
  'المفهوم',
];

export const TEMPLATE_EXAMPLE_ROWS: string[][] = [
  ['اختيار من متعدد', 'ما عاصمة المملكة العربية السعودية؟', 'جدة', 'الرياض', 'الدمام', 'أبها', '2', 'تقع في وسط المملكة.', 'الرياض هي عاصمة المملكة العربية السعودية.', 'جغرافيا المملكة'],
  ['صح أو خطأ', 'الشمس نجم.', '', '', '', '', 'صح', '', 'الشمس نجم متوسط الحجم يمدّ الأرض بالضوء والحرارة.', 'الفضاء'],
  ['إجابة قصيرة', 'كم يساوي ٧ × ٨ ؟', '', '', '', '', '56', 'جرّبي ٧ × ٤ ثم ضاعفي الناتج.', '٧ × ٨ = ٥٦', 'جدول الضرب'],
  ['ترتيب', 'رتّبي مراحل دورة حياة الفراشة:', 'البيضة', 'اليرقة', 'العذراء', 'الفراشة', '', '', 'تمر الفراشة بأربع مراحل: بيضة ثم يرقة ثم عذراء ثم فراشة.', 'دورة الحياة'],
];

export const COLUMN_HELP: { column: string; help: string }[] = [
  { column: 'النوع', help: 'اختيار من متعدد، أو صح أو خطأ، أو إجابة قصيرة، أو ترتيب.' },
  { column: 'السؤال', help: 'نص السؤال كما سيظهر للطالبة (إلزامي).' },
  { column: 'الخيار 1 … الخيار 6', help: 'خيارات الإجابة. في أسئلة الترتيب اكتبي العناصر بترتيبها الصحيح. يمكن إضافة عمودي «الخيار 5» و«الخيار 6».' },
  { column: 'الإجابة الصحيحة', help: 'الاختيار من متعدد: رقم الخيار الصحيح (1، 2، …) أو نصه، وإذا كانت الخيارات أرقامًا فاكتبي نص الإجابة نفسه. صح أو خطأ: «صح» أو «خطأ». الإجابة القصيرة: الإجابات المقبولة مفصولة بالعلامة | . الترتيب: اتركيه فارغًا.' },
  { column: 'التلميح، التفسير، المفهوم', help: 'اختيارية. المفهوم يساعدكِ على معرفة المهارات التي تحتاج إلى مراجعة في النتائج.' },
];

export interface ImportError {
  row: number; // spreadsheet row number (1 = header)
  message: string;
}

export interface ImportResult {
  questions: { row: number; question: Question }[];
  errors: ImportError[];
  skippedEmpty: number;
}

type Field = 'type' | 'prompt' | 'answer' | 'hint' | 'explanation' | 'concept' | `option${number}`;

function headerKey(raw: string): string {
  return normalizeAnswer(raw).replace(/\s+/g, '').replace(/^ال/, '');
}

const HEADER_ALIASES: Record<string, Field> = {
  نوع: 'type', type: 'type', نوعالسوال: 'type',
  سوال: 'prompt', question: 'prompt', نصالسوال: 'prompt', prompt: 'prompt',
  اجابهالصحيحه: 'answer', اجابه: 'answer', الاجابهالصحيحه: 'answer', answer: 'answer', correct: 'answer', correctanswer: 'answer',
  تلميح: 'hint', hint: 'hint',
  تفسير: 'explanation', explanation: 'explanation', شرح: 'explanation',
  مفهوم: 'concept', concept: 'concept', مهاره: 'concept', skill: 'concept',
};

function mapHeader(raw: string): Field | null {
  const key = headerKey(raw);
  if (!key) return null;
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  const opt = key.match(/^(?:خيار|اختيار|option|choice|عنصر|item)(\d)$/);
  if (opt) {
    const n = Number(opt[1]);
    if (n >= 1 && n <= MAX_OPTIONS) return `option${n}`;
  }
  return null;
}

const TYPE_ALIASES: Record<string, QuestionType> = {
  اختيارمنمتعدد: 'mcq', اختيار: 'mcq', متعدد: 'mcq', mcq: 'mcq', multiplechoice: 'mcq', اختيارات: 'mcq',
  صحاوخطا: 'tf', صحوخطا: 'tf', صوابوخطا: 'tf', صواباوخطا: 'tf', tf: 'tf', truefalse: 'tf', 'true/false': 'tf',
  اجابهقصيره: 'short', قصيره: 'short', short: 'short', shortanswer: 'short', اكمال: 'short', اكملي: 'short',
  ترتيب: 'order', رتبي: 'order', order: 'order', ordering: 'order',
};

const TRUE_WORDS = new Set(['صح', 'صحيح', 'صحيحه', 'صواب', 'نعم', 'true', 't', 'yes', '1', '✓', '✔']);
const FALSE_WORDS = new Set(['خطا', 'خاطي', 'خاطيه', 'غيرصحيح', 'لا', 'false', 'f', 'no', '0', '✗', '✘', 'x']);
const LETTERS = ['ا', 'ب', 'ج', 'د', 'ه', 'و'];

export function rowsToQuestions(rows: unknown[][]): ImportResult {
  const result: ImportResult = { questions: [], errors: [], skippedEmpty: 0 };
  const cells = rows.map((r) => r.map((c) => (c == null ? '' : String(c)).trim()));
  const headerIndex = cells.findIndex((r) => r.some((c) => c));
  if (headerIndex < 0) {
    result.errors.push({ row: 1, message: 'الملف فارغ.' });
    return result;
  }
  const columns = cells[headerIndex].map(mapHeader);
  if (!columns.includes('prompt')) {
    result.errors.push({
      row: headerIndex + 1,
      message: 'لم نجد عمود «السؤال» في الصف الأول. استخدمي النموذج الجاهز ولا تغيّري أسماء الأعمدة.',
    });
    return result;
  }

  for (let r = headerIndex + 1; r < cells.length; r++) {
    const rowNo = r + 1;
    const raw = cells[r];
    if (raw.every((c) => !c)) {
      result.skippedEmpty++;
      continue;
    }
    const get = (f: Field) => raw[columns.indexOf(f)] ?? '';
    const options: string[] = [];
    for (let n = 1; n <= MAX_OPTIONS; n++) {
      const v = columns.includes(`option${n}`) ? get(`option${n}`) : '';
      if (v) options.push(v);
    }
    const prompt = get('prompt');
    const answer = get('answer');
    const rowErrors: string[] = [];
    if (!prompt) rowErrors.push('نص السؤال فارغ.');

    let type: QuestionType | null = null;
    const typeRaw = get('type');
    if (typeRaw) {
      type = TYPE_ALIASES[headerKey(typeRaw)] ?? TYPE_ALIASES[normalizeAnswer(typeRaw).replace(/\s+/g, '')] ?? null;
      if (!type) rowErrors.push(`نوع السؤال «${typeRaw}» غير معروف. استخدمي: اختيار من متعدد، صح أو خطأ، إجابة قصيرة، ترتيب.`);
    } else if (options.length >= 2 && answer) type = 'mcq';
    else if (options.length >= 3) type = 'order';
    else if (TRUE_WORDS.has(headerKey(answer)) || FALSE_WORDS.has(headerKey(answer))) type = 'tf';
    else if (answer) type = 'short';
    else rowErrors.push('حدّدي نوع السؤال في عمود «النوع».');

    const base = {
      id: newId('q'),
      prompt,
      imageId: null,
      hint: get('hint').slice(0, 300),
      explanation: get('explanation').slice(0, 600),
      concept: get('concept').slice(0, 60),
    };
    let question: Question | null = null;

    if (type === 'mcq') {
      const opts: Option[] = options.map((text) => ({ id: newId('o'), text: text.slice(0, 200) }));
      if (opts.length < 2) rowErrors.push('سؤال الاختيار من متعدد يحتاج إلى خيارين على الأقل.');
      let correctIndex = -1;
      const a = toWesternDigits(answer).trim();
      if (!a) rowErrors.push('اكتبي رقم الخيار الصحيح في عمود «الإجابة الصحيحة».');
      else {
        const byText = opts.findIndex((o) => normalizeAnswer(o.text) === normalizeAnswer(a));
        const byNumber = /^\d+$/.test(a) ? Number(a) - 1 : -1;
        const byLetter = headerKey(a).length === 1 ? LETTERS.indexOf(headerKey(a)) : -1;
        // A number is read as the option's position unless it is literally one of the options.
        correctIndex = byText >= 0 ? byText : byNumber >= 0 && byNumber < opts.length ? byNumber : byLetter >= 0 && byLetter < opts.length ? byLetter : -1;
        if (correctIndex < 0)
          rowErrors.push(
            byNumber >= 0
              ? `رقم الإجابة الصحيحة (${a}) لا يطابق أي خيار؛ عدد الخيارات ${opts.length}.`
              : `الإجابة الصحيحة «${answer}» لا تطابق أيًّا من الخيارات.`,
          );
      }
      if (opts.length >= 2 && correctIndex >= 0)
        question = { ...base, type: 'mcq', options: opts, correctId: opts[correctIndex].id };
    } else if (type === 'tf') {
      const k = headerKey(answer);
      if (TRUE_WORDS.has(k)) question = { ...base, type: 'tf', answer: true };
      else if (FALSE_WORDS.has(k)) question = { ...base, type: 'tf', answer: false };
      else rowErrors.push('في أسئلة صح أو خطأ اكتبي «صح» أو «خطأ» في عمود الإجابة الصحيحة.');
    } else if (type === 'short') {
      const accepted = answer
        .split(/[|؛;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      if (!accepted.length) rowErrors.push('اكتبي الإجابة المقبولة في عمود «الإجابة الصحيحة».');
      else question = { ...base, type: 'short', accepted: accepted.map((s) => s.slice(0, 120)) };
    } else if (type === 'order') {
      if (options.length < 3) rowErrors.push('سؤال الترتيب يحتاج إلى ثلاثة عناصر على الأقل في أعمدة الخيارات.');
      else question = { ...base, type: 'order', items: options.map((text) => ({ id: newId('i'), text: text.slice(0, 200) })) };
    }

    if (question) for (const m of questionIssues(question)) if (!rowErrors.includes(m)) rowErrors.push(m);
    if (rowErrors.length || !question) {
      for (const m of rowErrors.length ? rowErrors : ['تعذّر قراءة هذا الصف.']) result.errors.push({ row: rowNo, message: m });
    } else {
      result.questions.push({ row: rowNo, question });
    }
  }
  if (!result.questions.length && !result.errors.length) result.errors.push({ row: headerIndex + 2, message: 'لا توجد أسئلة تحت صف العناوين.' });
  return result;
}

// Escapes a CSV cell (RFC 4180).
export function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  // The BOM makes Excel open Arabic UTF-8 text correctly.
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export function questionsToRows(questions: Question[]): string[][] {
  const maxOpts = Math.max(4, ...questions.map((q) => (q.type === 'mcq' ? q.options.length : q.type === 'order' ? q.items.length : 0)));
  const header = [...TEMPLATE_HEADERS.slice(0, 2)];
  for (let i = 1; i <= Math.min(maxOpts, MAX_OPTIONS); i++) header.push(`الخيار ${i}`);
  header.push('الإجابة الصحيحة', 'التلميح', 'التفسير', 'المفهوم');
  const rows = [header];
  const typeName = { mcq: 'اختيار من متعدد', tf: 'صح أو خطأ', short: 'إجابة قصيرة', order: 'ترتيب' } as const;
  for (const q of questions) {
    const opts: string[] = q.type === 'mcq' ? q.options.map((o) => o.text) : q.type === 'order' ? q.items.map((o) => o.text) : [];
    const padded = Array.from({ length: Math.min(maxOpts, MAX_OPTIONS) }, (_, i) => opts[i] ?? '');
    const answer =
      q.type === 'mcq'
        ? String(q.options.findIndex((o) => o.id === q.correctId) + 1)
        : q.type === 'tf'
          ? q.answer ? 'صح' : 'خطأ'
          : q.type === 'short'
            ? q.accepted.join(' | ')
            : '';
    rows.push([typeName[q.type], q.prompt, ...padded, answer, q.hint, q.explanation, q.concept]);
  }
  return rows;
}
