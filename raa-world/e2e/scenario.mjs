// End-to-end acceptance scenario, driven in a real browser against a running server:
//   1. teacher registers, builds a science game (5 hand-written questions, stars template)
//   2. previews and plays it, saves, enables results, publishes, shares the link
//   3. a "student" on another browser context plays from the link → result reaches the teacher
//   4. teacher builds a math game by CSV import with the maze template, publishes, student plays it
//   5. checks the two games never share questions or settings, and that drafts stay unpublished
//   6. plays the gates template in preview
// Usage: BASE_URL=http://localhost:8787 npm run e2e   (screenshots → e2e/out/)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:8787';
const OUT = join(import.meta.dirname, 'out');
mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const log = (...a) => console.log('•', ...a);
const fail = (m) => {
  throw new Error(m);
};

const SCIENCE = [
  { type: 'mcq', prompt: 'ما الجزء الذي يمتص الماء من التربة؟', options: ['الجذر', 'الساق', 'الورقة', 'الزهرة'], correct: 0, hint: 'يختبئ تحت الأرض.', explanation: 'الجذر يمتص الماء والأملاح من التربة.', concept: 'أجزاء النبات' },
  { type: 'tf', prompt: 'تصنع الأوراق غذاء النبات.', answer: true, concept: 'البناء الضوئي' },
  { type: 'mcq', prompt: 'ما الغاز الذي يأخذه النبات من الهواء لصنع غذائه؟', options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين'], correct: 1, concept: 'البناء الضوئي' },
  { type: 'short', prompt: 'ما اسم العملية التي يصنع بها النبات غذاءه؟', accepted: ['البناء الضوئي', 'التمثيل الضوئي'], concept: 'البناء الضوئي' },
  { type: 'order', prompt: 'رتّبي مراحل نمو النبات:', items: ['البذرة', 'البادرة', 'النبات المزهر'], concept: 'دورة حياة النبات' },
];
const MATH_CSV = [
  'النوع,السؤال,الخيار 1,الخيار 2,الخيار 3,الخيار 4,الإجابة الصحيحة,التلميح,التفسير,المفهوم',
  'اختيار من متعدد,أي الكسور يساوي ١/٢ ؟,٢/٤,٢/٣,١/٣,٣/٤,1,اضربي البسط والمقام في ٢,٢/٤ = ١/٢,الكسور المتكافئة',
  'صح أو خطأ,الكسر ٣/٤ أكبر من ٢/٤,,,,,صح,,عند تساوي المقامات نقارن البسط,مقارنة الكسور',
  'إجابة قصيرة,اكتبي ٤/٨ في أبسط صورة,,,,,١/٢ | 0.5,,٤/٨ = ١/٢,تبسيط الكسور',
  'ترتيب,رتّبي من الأصغر إلى الأكبر,١/٨,١/٤,١/٢,,,,,مقارنة الكسور',
  'اختيار من متعدد,سؤال بخطأ مقصود,أ,ب,,,7,,,',
].join('\n');
const MATH_ANSWERS = {
  'أي الكسور يساوي ١/٢ ؟': { type: 'mcq', text: '٢/٤' },
  'الكسر ٣/٤ أكبر من ٢/٤': { type: 'tf', answer: true },
  'اكتبي ٤/٨ في أبسط صورة': { type: 'short', text: '1/2' },
  'رتّبي من الأصغر إلى الأكبر': { type: 'order', items: ['١/٨', '١/٤', '١/٢'] },
};
const scienceAnswers = Object.fromEntries(
  SCIENCE.map((q) => [
    q.prompt,
    q.type === 'mcq' ? { type: 'mcq', text: q.options[q.correct] } : q.type === 'tf' ? { type: 'tf', answer: q.answer } : q.type === 'short' ? { type: 'short', text: 'التمثيل الضوئى' } : { type: 'order', items: q.items },
  ]),
);

async function answerOpenQuestion(page, answers, { wrongFirst = false } = {}) {
  const sheet = page.locator('.qsheet');
  const prompt = (await sheet.locator('#q-prompt').innerText()).trim();
  const a = answers[prompt] ?? fail(`unknown question: ${prompt}`);
  if (wrongFirst && a.type === 'mcq') {
    await sheet.locator('.choice', { hasNotText: a.text }).first().click();
    await sheet.locator('.feedback-box.retry').waitFor();
  }
  if (a.type === 'mcq') await sheet.locator('.choice', { hasText: a.text }).first().click();
  if (a.type === 'tf') await sheet.locator(`.choice.tf-${a.answer}`).click();
  if (a.type === 'short') {
    await sheet.locator('#short-input').fill(a.text);
    await sheet.locator('.short-answer button').click();
  }
  if (a.type === 'order') {
    for (let i = 0; i < a.items.length; i++) {
      for (;;) {
        const texts = await sheet.locator('.order-answer li .choice-text').allInnerTexts();
        const j = texts.findIndex((t) => t.trim() === a.items[i]);
        if (j <= i) break;
        await sheet.getByRole('button', { name: `تقديم «${a.items[i]}»` }).click();
      }
    }
    await sheet.getByRole('button', { name: /تحقّق/ }).click();
  }
  await sheet.locator('.feedback-box.correct').waitFor({ timeout: 4000 });
  await sheet.locator('.continue').click();
  return prompt;
}

async function playToEnd(page, answers, { shot, wrongFirst = false } = {}) {
  const seen = new Set();
  for (let guard = 0; guard < 200; guard++) {
    if (await page.locator('.finish-card').isVisible()) break;
    if (await page.locator('.qsheet').isVisible()) {
      if (shot && !seen.size) {
        await page.waitForTimeout(600); // let the sheet finish its entrance
        await page.screenshot({ path: join(OUT, `${shot}-question.png`) });
      }
      seen.add(await answerOpenQuestion(page, answers, { wrongFirst: wrongFirst && !seen.size }));
      continue;
    }
    const zone = page.locator('.zone.current .zone-node:not([disabled])');
    if (await zone.isVisible().catch(() => false)) {
      if (shot && !seen.size) await page.screenshot({ path: join(OUT, `${shot}-board.png`) });
      await zone.click({ force: true }); // the node gently bobs, so it is never "stable"
      continue;
    }
    const lock = page.locator('.lock.locked:not([disabled])').first();
    if (await lock.isVisible().catch(() => false)) {
      if (shot && !seen.size) await page.screenshot({ path: join(OUT, `${shot}-board.png`) });
      await lock.click({ force: true });
      continue;
    }
    if (shot && !seen.size && (await page.locator('.maze-board').isVisible())) await page.screenshot({ path: join(OUT, `${shot}-board.png`) });
    await page.waitForTimeout(250);
  }
  await page.locator('.finish-card').waitFor({ timeout: 15000 });
  if (shot) {
    await page.waitForTimeout(1200); // star animation
    await page.screenshot({ path: join(OUT, `${shot}-finish.png`) });
  }
  return seen;
}

async function waitSaved(page) {
  await page.getByText('المسودة محفوظة في حسابكِ').waitFor({ timeout: 10000 });
}

async function addQuestion(page, q) {
  await page.getByRole('button', { name: /^إضافة (أول )?سؤال/ }).first().click();
  const modal = page.locator('.modal');
  const typeLabel = { mcq: 'اختيار من متعدد', tf: 'صح أو خطأ', short: 'إجابة قصيرة', order: 'ترتيب عناصر' }[q.type];
  await modal.getByRole('radio', { name: typeLabel }).click();
  await modal.getByLabel('نص السؤال').fill(q.prompt);
  if (q.type === 'mcq') {
    while ((await modal.locator('.option-row').count()) > q.options.length) await modal.getByRole('button', { name: /^حذف الخيار/ }).last().click();
    for (let i = 0; i < q.options.length; i++) await modal.getByLabel(`نص الخيار ${i + 1}`).fill(q.options[i]);
    await modal.getByLabel(`الخيار ${q.correct + 1} هو الإجابة الصحيحة`).check();
  }
  if (q.type === 'tf') await modal.locator('.tf-pick button', { hasText: q.answer ? 'صح' : 'خطأ' }).click();
  if (q.type === 'short')
    for (let i = 0; i < q.accepted.length; i++) {
      if (i > 0) await modal.getByRole('button', { name: 'إضافة صيغة مقبولة' }).click();
      await modal.getByLabel(`الإجابة المقبولة ${i + 1}`).fill(q.accepted[i]);
    }
  if (q.type === 'order') for (let i = 0; i < q.items.length; i++) await modal.getByLabel(`العنصر ${i + 1}`, { exact: true }).fill(q.items[i]);
  if (q.hint || q.explanation || q.concept) {
    if (!(await modal.locator('details.qe-more').getAttribute('open'))) await modal.locator('details.qe-more summary').click();
    if (q.hint) await modal.getByLabel('تلميح').fill(q.hint);
    if (q.explanation) await modal.getByLabel('تفسير الإجابة الصحيحة').fill(q.explanation);
    if (q.concept) await modal.getByLabel('المفهوم أو المهارة').fill(q.concept);
  }
  await modal.getByRole('button', { name: 'حفظ السؤال' }).click();
  await modal.waitFor({ state: 'detached' });
}

const browser = await chromium.launch({ executablePath });
let t;
try {
  // ---------------------------------------------------------------- teacher (desktop)
  const teacherCtx = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'ar-SA', acceptDownloads: true });
  t = await teacherCtx.newPage();
  const pageErrors = [];
  t.on('pageerror', (e) => pageErrors.push(e.message));
  await t.goto(BASE);
  await t.screenshot({ path: join(OUT, '01-landing.png'), fullPage: true });

  const email = `teacher${Date.now()}@school.sa`;
  await t.getByRole('link', { name: 'أنشئي حسابًا' }).first().click();
  await t.getByLabel('الاسم').fill('أ. نورة الحربي');
  await t.getByLabel('البريد الإلكتروني').fill(email);
  await t.getByLabel('كلمة المرور').fill('Classroom2026');
  await t.getByRole('button', { name: 'إنشاء الحساب' }).click();
  await t.waitForURL('**/dashboard');
  log('teacher registered');

  // ---- Science game, blank start
  await t.getByRole('button', { name: 'لعبة جديدة' }).click();
  await t.getByRole('button', { name: /لعبة فارغة/ }).click();
  await t.waitForURL('**/edit/info');
  const scienceId = t.url().split('/games/')[1].split('/')[0];
  await t.getByLabel('اسم اللعبة').fill('مغامرة أجزاء النبات');
  await t.getByLabel('المادة الدراسية').selectOption('العلوم');
  await t.getByLabel('الصف الدراسي').selectOption('الصف الرابع الابتدائي');
  await t.getByLabel('عنوان الدرس أو الوحدة').fill('أجزاء النبات ووظائفها');
  await t.getByLabel('الهدف 1').fill('تتعرّف الطالبة أجزاء النبات ووظائفها.');
  await t.getByLabel('وصف قصير للطالبات').fill('اجمعي النجوم واكتشفي أسرار النبات!');
  await waitSaved(t);
  await t.screenshot({ path: join(OUT, '02-editor-info.png'), fullPage: true });

  await t.getByRole('link', { name: /الأسئلة/ }).first().click();
  for (const q of SCIENCE) await addQuestion(t, q);
  await waitSaved(t);
  const qCount = await t.locator('.question-list .question-item').count();
  if (qCount !== 5) fail(`expected 5 questions, got ${qCount}`);
  await t.screenshot({ path: join(OUT, '03-editor-questions.png'), fullPage: true });
  log('science: 5 questions added and autosaved');

  await t.getByRole('link', { name: /قالب اللعب/ }).click();
  await t.getByRole('radio', { name: /مغامرة جمع النجوم/ }).click();
  await t.getByRole('link', { name: /إعدادات اللعب/ }).click();
  await t.getByRole('switch', { name: 'تسجيل نتائج الطالبات' }).click();
  await waitSaved(t);
  await t.screenshot({ path: join(OUT, '04-editor-settings.png'), fullPage: true });

  // ---- Preview
  await t.getByRole('button', { name: 'معاينة اللعبة' }).first().click();
  await t.locator('.preview-overlay .welcome-card').waitFor();
  await t.screenshot({ path: join(OUT, '05-preview-welcome.png') });
  await t.locator('.preview-overlay').getByRole('button', { name: /ابدئي المغامرة/ }).click();
  const seenPreview = await playToEnd(t, scienceAnswers, { shot: '06-stars', wrongFirst: true });
  if (seenPreview.size !== 5) fail(`preview should ask 5 questions, asked ${seenPreview.size}`);
  await t.locator('.preview-overlay').getByRole('button', { name: 'العودة إلى التعديل' }).last().click();
  log('science preview played end-to-end (stars)');

  // ---- Save + publish
  await t.getByRole('button', { name: 'حفظ المسودة' }).click();
  await waitSaved(t);
  await t.getByRole('link', { name: /النشر والمشاركة/ }).first().click();
  await t.getByRole('button', { name: 'نشر اللعبة' }).click();
  await t.getByText('اللعبة منشورة ومتاحة للطالبات').waitFor();
  const shareLink = await t.getByLabel('رابط اللعبة').inputValue();
  await t.locator('.share-qr img').waitFor();
  await t.screenshot({ path: join(OUT, '07-published.png'), fullPage: true });
  log('science published:', shareLink);

  // ---------------------------------------------------------------- student on a phone
  const studentCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'ar-SA' });
  const s = await studentCtx.newPage();
  s.on('pageerror', (e) => pageErrors.push(e.message));
  await s.goto(shareLink);
  await s.locator('.welcome-card').waitFor();
  await s.getByRole('button', { name: /ابدئي المغامرة/ }).click();
  await s.getByText('اكتبي اسمكِ الأول أو رمزكِ أولًا.').waitFor(); // name required when recording
  await s.getByLabel('اكتبي اسمكِ الأول أو رمزكِ').fill('ريم');
  await s.screenshot({ path: join(OUT, '08-student-welcome-mobile.png') });
  await s.getByRole('button', { name: /ابدئي المغامرة/ }).click();
  await playToEnd(s, scienceAnswers, { shot: '09-student-mobile' });
  await s.getByText('وصلت نتيجتكِ إلى معلمتكِ.').waitFor();
  log('student played from share link on another context; result sent');

  await t.goto(`${BASE}/games/${scienceId}/results`);
  await t.locator('.stat-row').waitFor();
  const attempts = await t.locator('.table tbody tr').count();
  if (attempts !== 1) fail(`expected 1 recorded attempt, got ${attempts}`);
  await t.screenshot({ path: join(OUT, '10-results.png'), fullPage: true });
  log('teacher sees the recorded attempt');

  // ---- Math game via CSV import + maze template
  const csvPath = join(OUT, 'math-questions.csv');
  writeFileSync(csvPath, '﻿' + MATH_CSV);
  await t.goto(`${BASE}/dashboard`);
  await t.getByRole('button', { name: 'لعبة جديدة' }).click();
  await t.getByRole('button', { name: /لعبة فارغة/ }).click();
  await t.waitForURL('**/edit/info');
  const mathId = t.url().split('/games/')[1].split('/')[0];
  await t.getByLabel('اسم اللعبة').fill('متاهة الكسور');
  await t.getByLabel('المادة الدراسية').selectOption('الرياضيات');
  await t.getByLabel('الصف الدراسي').selectOption('الصف الخامس الابتدائي');
  await t.getByRole('link', { name: /قالب اللعب/ }).click();
  await t.getByRole('radio', { name: /المتاهة التعليمية/ }).click();
  await t.getByRole('link', { name: /الأسئلة/ }).first().click();
  await t.getByRole('button', { name: 'استيراد من Excel أو CSV' }).click();
  await t.locator('.file-drop input[type=file]').setInputFiles(csvPath);
  await t.locator('.import-review').waitFor();
  await t.getByText('الصف 6:').waitFor(); // the deliberately broken row is reported
  await t.screenshot({ path: join(OUT, '11-import-review.png') });
  await t.getByRole('button', { name: /إضافة 4 سؤال إلى اللعبة/ }).click();
  await waitSaved(t);
  log('math: 4 questions imported from CSV, bad row reported');
  await t.getByRole('link', { name: /إعدادات اللعب/ }).click();
  await t.getByRole('radio', { name: 'متقدم' }).click();
  await t.getByRole('link', { name: /المظهر والرسائل/ }).click();
  await t.getByRole('radio', { name: /السماء الملكية/ }).click();
  await waitSaved(t);
  await t.getByRole('link', { name: /النشر والمشاركة/ }).first().click();
  await t.getByRole('button', { name: 'نشر اللعبة' }).click();
  const mathLink = await t.getByLabel('رابط اللعبة').inputValue();
  log('math published:', mathLink);

  const s2 = await studentCtx.newPage();
  await s2.goto(mathLink);
  await s2.getByRole('button', { name: /ابدئي المغامرة/ }).click();
  const mathSeen = await playToEnd(s2, MATH_ANSWERS, { shot: '12-maze-mobile' });
  if ([...mathSeen].some((p) => scienceAnswers[p])) fail('math game showed a science question');
  log('student played the maze game');

  // ---- Isolation checks through the API
  const api = async (path) => (await t.request.get(`${BASE}/api${path}`)).json();
  const sci = (await api(`/games/${scienceId}`)).game;
  const math = (await api(`/games/${mathId}`)).game;
  const sciPrompts = sci.draft.questions.map((q) => q.prompt);
  const mathPrompts = math.draft.questions.map((q) => q.prompt);
  if (sciPrompts.length !== 5 || mathPrompts.length !== 4) fail('question counts changed');
  if (sciPrompts.some((p) => mathPrompts.includes(p))) fail('questions leaked between games');
  if (sci.draft.templateId !== 'stars' || math.draft.templateId !== 'maze') fail('templates mixed');
  if (sci.draft.settings.theme !== 'emerald' || math.draft.settings.theme !== 'royal') fail('themes mixed');
  if (sci.draft.settings.difficulty !== 'medium' || math.draft.settings.difficulty !== 'hard') fail('settings mixed');
  log('isolation verified: separate ids, questions, templates and settings');

  // ---- Draft edits stay private until publish; gates template in preview
  await t.goto(`${BASE}/games/${scienceId}/edit/template`);
  await t.getByRole('radio', { name: /افتحي البوابة/ }).click();
  await waitSaved(t);
  const pub = await (await t.request.get(`${BASE}/api/play/${scienceId}`)).json();
  if (pub.doc.templateId !== 'stars') fail('unpublished draft change leaked to students');
  await t.locator('.editor-bar').getByText('منشورة · تعديلات غير منشورة').waitFor().catch(() => t.locator('.status-pill.changed').waitFor());
  log('draft change (gates) not visible to students before publishing');
  await t.getByRole('button', { name: 'معاينة اللعبة' }).first().click();
  await t.locator('.preview-overlay').getByRole('button', { name: /ابدئي المغامرة/ }).click();
  await playToEnd(t, scienceAnswers, { shot: '13-gates' });
  log('gates template played in preview');
  await t.locator('.preview-overlay').getByRole('button', { name: 'العودة إلى التعديل' }).last().click();

  await t.goto(`${BASE}/dashboard`);
  await t.locator('.game-card').nth(1).waitFor();
  await t.screenshot({ path: join(OUT, '14-dashboard.png'), fullPage: true });

  // ---- Unpublish → link stops working
  await t.goto(`${BASE}/games/${mathId}/edit/publish`);
  await t.getByRole('button', { name: 'إلغاء النشر' }).click();
  await t.locator('.modal').getByRole('button', { name: 'إيقاف النشر' }).click();
  await t.getByText('النشر موقوف مؤقتًا').waitFor();
  const s3 = await studentCtx.newPage();
  await s3.goto(mathLink);
  await s3.getByText('أوقفت المعلمة نشرها مؤقتًا').waitFor();
  log('unpublished link shows a clear message');

  if (pageErrors.length) fail(`page errors: ${pageErrors.join(' | ')}`);
  console.log('\nALL SCENARIO STEPS PASSED. Screenshots in', OUT);
} catch (e) {
  await t?.screenshot({ path: join(OUT, 'error.png'), fullPage: true }).catch(() => {});
  throw e;
} finally {
  await browser.close();
}
