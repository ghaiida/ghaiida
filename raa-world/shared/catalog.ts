// Fixed choices the teacher picks from. Keeping them here (and not in the UI) lets the server,
// the dashboard and the player agree on labels.
import type { Difficulty, QuestionType, TemplateId, ThemeId } from './schema.ts';

export const SUBJECTS = [
  'الرياضيات',
  'العلوم',
  'لغتي',
  'اللغة العربية',
  'اللغة الإنجليزية',
  'المهارات الرقمية',
  'الدراسات الاجتماعية',
  'الدراسات الإسلامية',
  'التفكير الناقد',
  'الكيمياء',
  'الفيزياء',
  'الأحياء',
];

export const GRADES = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول المتوسط',
  'الصف الثاني المتوسط',
  'الصف الثالث المتوسط',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

export const TERMS = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني', 'الفصل الدراسي الثالث'];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'اختيار من متعدد',
  tf: 'صح أو خطأ',
  short: 'إجابة قصيرة',
  order: 'ترتيب عناصر',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'سهل', medium: 'متوسط', hard: 'متقدم' };

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  tagline: string;
  howToPlay: string[];
  bestFor: string;
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  stars: {
    id: 'stars',
    name: 'مغامرة جمع النجوم',
    tagline: 'خريطة مناطق تُفتح بالنجوم',
    howToPlay: [
      'الأسئلة موزعة على مناطق في خريطة المغامرة.',
      'كل إجابة صحيحة تمنح نجومًا: ٣ من المحاولة الأولى، وأقل في المحاولات التالية.',
      'جمع نجوم كافية يفتح المنطقة التالية، وإلا تبدأ جولة تدريب على الأسئلة الفائتة.',
    ],
    bestFor: 'المراجعة الشاملة لوحدة كاملة.',
  },
  maze: {
    id: 'maze',
    name: 'المتاهة التعليمية',
    tagline: 'كل إجابة صحيحة تفتح الممر التالي',
    howToPlay: [
      'تتحرك الطالبة داخل متاهة نحو المخرج.',
      'عند كل نقطة تفتيش تختار الممر الصحيح بالإجابة عن السؤال.',
      'الممر الخاطئ طريق مسدود، والصحيح يقودها خطوة نحو المخرج.',
    ],
    bestFor: 'التدرّج خطوة بخطوة في مهارة واحدة.',
  },
  gates: {
    id: 'gates',
    name: 'افتحي البوابة',
    tagline: 'أقفال وطاقة وبوابات متتالية',
    howToPlay: [
      'لكل بوابة عدة أقفال، وكل قفل سؤال تختاره الطالبة بنفسها.',
      'الإجابة الصحيحة تضع مفتاحًا في القفل، وعند اكتمال المفاتيح تُفتح البوابة.',
      'الإجابة الخاطئة تستهلك قلب طاقة، وإذا نفدت القلوب تُغلق البوابة وتبدأ من جديد.',
    ],
    bestFor: 'التحديات الصفية والتقويم البنائي.',
  },
};

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  primary: string;
  primaryDark: string;
  accent: string;
  soft: string;
  sky: string; // game background (top)
  ground: string; // game background (bottom)
  ink: string;
  surface: string;
  dark: boolean;
}

export const THEMES: Record<ThemeId, ThemeInfo> = {
  emerald: {
    id: 'emerald',
    name: 'واحة الزمرد',
    primary: '#0E9F7A',
    primaryDark: '#06674F',
    accent: '#F2A12E',
    soft: '#DDF6EE',
    sky: '#E4F7EF',
    ground: '#BFE9D8',
    ink: '#0B2A22',
    surface: '#FFFFFF',
    dark: false,
  },
  royal: {
    id: 'royal',
    name: 'السماء الملكية',
    primary: '#1F4FD8',
    primaryDark: '#12308C',
    accent: '#F2A12E',
    soft: '#E7EDFF',
    sky: '#E8EEFF',
    ground: '#C9D6FB',
    ink: '#0E1B3D',
    surface: '#FFFFFF',
    dark: false,
  },
  sand: {
    id: 'sand',
    name: 'الرمال الذهبية',
    primary: '#B86E00',
    primaryDark: '#7A4800',
    accent: '#0E9F7A',
    soft: '#FFF0D6',
    sky: '#FFF6E6',
    ground: '#F6DDAF',
    ink: '#3A2400',
    surface: '#FFFFFF',
    dark: false,
  },
  night: {
    id: 'night',
    name: 'ليلة النجوم',
    primary: '#F2B33D',
    primaryDark: '#C58A12',
    accent: '#45D3A8',
    soft: '#26335F',
    sky: '#121B3A',
    ground: '#1D2A55',
    ink: '#F2F5FF',
    surface: '#1A254C',
    dark: true,
  },
  violet: {
    id: 'violet',
    name: 'حديقة البنفسج',
    primary: '#7247C9',
    primaryDark: '#4B2A93',
    accent: '#F2A12E',
    soft: '#EFE8FC',
    sky: '#F3EEFD',
    ground: '#DDD0F7',
    ink: '#24133F',
    surface: '#FFFFFF',
    dark: false,
  },
};
