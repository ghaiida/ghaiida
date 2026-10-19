// Arabic-aware text helpers used for grading short answers and for reading imported files.

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g; // harakat + tatweel
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

export function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN_INDIC.indexOf(d));
  });
}

// Normalises the spelling variations students commonly type so that
// "الْأَرْض", "الارض" and "الأرض " are treated as the same answer.
export function normalizeAnswer(input: string): string {
  return toWesternDigits(input)
    .normalize('NFKC')
    .replace(TASHKEEL, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة(?=\s|$)/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٫,]/g, '.') // decimal separators: 0٫5 / 0,5 → 0.5
    .replace(/[.؟?!،؛;:"'«»()\[\]{}\-_]+$/g, '')
    .replace(/^[.؟?!،؛;:"'«»()\[\]{}\-_]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Arabic ordinal numerals for UI labels.
export function arabicNumber(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}
