// Starting points for a new game: a blank game and two ready lessons (science & math).
import type { GameDoc, GameSettings, Question } from './schema.ts';
import { newId } from './engine.ts';

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  questionCount: 0,
  order: 'fixed',
  shuffleOptions: true,
  triesPerQuestion: 2,
  pointsPerQuestion: 10,
  hints: 'free',
  timerEnabled: false,
  timerMinutes: 10,
  showCorrectAnswer: true,
  showExplanation: true,
  correctMessage: '',
  wrongMessage: '',
  allowReplay: true,
  sound: true,
  theme: 'emerald',
  address: 'f',
  welcomeMessage: 'أهلًا بكِ في مغامرة اليوم! أجيبي عن الأسئلة لتصلي إلى الهدف.',
  completionMessage: 'أحسنتِ! أنهيتِ المغامرة بنجاح.',
  recordResults: false,
  askPlayerName: true,
};

export function blankGame(): GameDoc {
  return {
    schemaVersion: 1,
    templateId: 'stars',
    meta: {
      title: '',
      subject: '',
      grade: '',
      term: '',
      lesson: '',
      objectives: [''],
      description: '',
      teacherName: '',
      schoolName: '',
      logoId: null,
      coverId: null,
    },
    questions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

const blankQ = { imageId: null, hint: '', explanation: '', concept: '' };

function mcq(prompt: string, options: string[], correct: number, extra: Partial<Question> = {}): Question {
  const opts = options.map((text) => ({ id: newId('o'), text }));
  return { id: newId('q'), type: 'mcq', prompt, options: opts, correctId: opts[correct].id, ...blankQ, ...extra } as Question;
}
function tf(prompt: string, answer: boolean, extra: Partial<Question> = {}): Question {
  return { id: newId('q'), type: 'tf', prompt, answer, ...blankQ, ...extra } as Question;
}
function short(prompt: string, accepted: string[], extra: Partial<Question> = {}): Question {
  return { id: newId('q'), type: 'short', prompt, accepted, ...blankQ, ...extra } as Question;
}
function order(prompt: string, items: string[], extra: Partial<Question> = {}): Question {
  return { id: newId('q'), type: 'order', prompt, items: items.map((text) => ({ id: newId('i'), text })), ...blankQ, ...extra } as Question;
}

export function scienceSample(): GameDoc {
  const doc = blankGame();
  doc.templateId = 'stars';
  doc.meta = {
    ...doc.meta,
    title: 'رحلة داخل النبات',
    subject: 'العلوم',
    grade: 'الصف الرابع الابتدائي',
    term: 'الفصل الدراسي الأول',
    lesson: 'أجزاء النبات ووظائفها',
    objectives: ['تتعرّف الطالبة أجزاء النبات الرئيسة.', 'تربط كل جزء بوظيفته.', 'ترتّب مراحل نمو النبات.'],
    description: 'اجمعي النجوم وافتحي مناطق الحديقة باكتشاف أسرار النبات!',
  };
  doc.questions = [
    mcq('ما الجزء الذي يمتص الماء والأملاح من التربة؟', ['الجذر', 'الورقة', 'الزهرة', 'الثمرة'], 0, {
      hint: 'هذا الجزء يختبئ تحت الأرض.',
      explanation: 'الجذر يثبّت النبات ويمتص الماء والأملاح المعدنية من التربة.',
      concept: 'أجزاء النبات',
    }),
    tf('تصنع الأوراق غذاء النبات بمساعدة ضوء الشمس.', true, {
      explanation: 'تقوم الأوراق بعملية البناء الضوئي فتصنع الغذاء باستخدام ضوء الشمس والماء وثاني أكسيد الكربون.',
      concept: 'البناء الضوئي',
    }),
    mcq('ما وظيفة الساق في النبات؟', ['تنقل الماء والغذاء بين أجزاء النبات', 'تصنع البذور', 'تمتص ضوء القمر', 'تجذب الحشرات فقط'], 0, {
      hint: 'فكّري في الساق كأنها طريق داخل النبات.',
      explanation: 'الساق تحمل الأوراق وتنقل الماء من الجذر إلى الأوراق، وتنقل الغذاء إلى بقية الأجزاء.',
      concept: 'أجزاء النبات',
    }),
    short('ما اسم العملية التي يصنع بها النبات غذاءه؟', ['البناء الضوئي', 'التمثيل الضوئي'], {
      hint: 'تبدأ بكلمة «البناء».',
      explanation: 'البناء الضوئي (التمثيل الضوئي) هو صنع الغذاء في الأوراق باستخدام ضوء الشمس.',
      concept: 'البناء الضوئي',
    }),
    order('رتّبي مراحل نمو النبات من البداية:', ['البذرة', 'البادرة', 'النبات الصغير', 'النبات المزهر'], {
      explanation: 'تنبت البذرة فتصبح بادرة، ثم تنمو إلى نبات صغير، ثم إلى نبات مكتمل يزهر.',
      concept: 'دورة حياة النبات',
    }),
    tf('الزهرة هي الجزء المسؤول عن امتصاص الماء.', false, {
      explanation: 'الزهرة مسؤولة عن التكاثر وتكوين البذور، أما امتصاص الماء فوظيفة الجذر.',
      concept: 'أجزاء النبات',
    }),
  ];
  doc.settings = {
    ...doc.settings,
    theme: 'emerald',
    welcomeMessage: 'مرحبًا بكِ في حديقة العلوم! كل إجابة صحيحة تمنحكِ نجومًا تفتح منطقة جديدة.',
    completionMessage: 'رائع! أصبحتِ خبيرة في أجزاء النبات ووظائفها.',
  };
  return doc;
}

export function mathSample(): GameDoc {
  const doc = blankGame();
  doc.templateId = 'maze';
  doc.meta = {
    ...doc.meta,
    title: 'متاهة الكسور',
    subject: 'الرياضيات',
    grade: 'الصف الخامس الابتدائي',
    term: 'الفصل الدراسي الثاني',
    lesson: 'الكسور الاعتيادية والمقارنة بينها',
    objectives: ['تقارن الطالبة بين كسرين.', 'تجد الكسور المتكافئة.', 'تبسّط الكسر إلى أبسط صورة.'],
    description: 'اعبري المتاهة بالإجابة الصحيحة عند كل ممر حتى تصلي إلى المخرج.',
  };
  doc.questions = [
    mcq('أي الكسور الآتية يساوي ١/٢ ؟', ['٢/٤', '٢/٣', '١/٣', '٣/٤'], 0, {
      hint: 'اضربي البسط والمقام في العدد نفسه.',
      explanation: '٢/٤ = (١×٢)/(٢×٢) = ١/٢، فهما كسران متكافئان.',
      concept: 'الكسور المتكافئة',
    }),
    tf('الكسر ٣/٤ أكبر من الكسر ٢/٤.', true, {
      explanation: 'عندما يتساوى المقامان، يكون الكسر ذو البسط الأكبر هو الأكبر: ٣ > ٢.',
      concept: 'مقارنة الكسور',
    }),
    short('اكتبي الكسر ٤/٨ في أبسط صورة:', ['١/٢', '0.5'], {
      hint: 'اقسمي البسط والمقام على ٤.',
      explanation: '٤ ÷ ٤ = ١ و ٨ ÷ ٤ = ٢، إذن ٤/٨ = ١/٢.',
      concept: 'تبسيط الكسور',
    }),
    order('رتّبي الكسور من الأصغر إلى الأكبر:', ['١/٨', '١/٤', '١/٢', '٣/٤'], {
      explanation: 'كلما كبر المقام مع بسط ١ صغر الكسر، و٣/٤ أكبرها لأنه أقرب إلى الواحد.',
      concept: 'مقارنة الكسور',
    }),
    mcq('ما الكسر الذي يمثّل الجزء الملوّن إذا لُوّن ٣ أجزاء من ٥ أجزاء متساوية؟', ['٣/٥', '٥/٣', '٢/٥', '٣/٨'], 0, {
      explanation: 'البسط عدد الأجزاء الملوّنة (٣)، والمقام عدد الأجزاء الكلي (٥).',
      concept: 'مفهوم الكسر',
    }),
    tf('الكسران ٢/٣ و ٤/٦ متكافئان.', true, {
      explanation: '٤/٦ = (٢×٢)/(٣×٢) = ٢/٣.',
      concept: 'الكسور المتكافئة',
    }),
  ];
  doc.settings = {
    ...doc.settings,
    theme: 'royal',
    welcomeMessage: 'أهلًا بكِ في متاهة الكسور! أجيبي عند كل ممر لتجدي طريقكِ إلى المخرج.',
    completionMessage: 'أحسنتِ! خرجتِ من المتاهة وأتقنتِ الكسور.',
  };
  return doc;
}

export const SAMPLES = {
  science: scienceSample,
  math: mathSample,
} as const;
export type SampleId = keyof typeof SAMPLES;
