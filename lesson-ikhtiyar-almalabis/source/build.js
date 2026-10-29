// درس «اختيار الملابس» — الصف السادس — المهارات الحياتية والأسرية
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const art = require("./art");
const gi = require("react-icons/gi");
const fa6 = require("react-icons/fa6");
const pi = require("react-icons/pi");
const lu = require("react-icons/lu");

const OUT = process.argv[2] || "deck.pptx";

const THEME = {
  name: "Ikhtiyar Al-Malabis",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: "2B1B33", lt1: "FFFFFF", dk2: "5B2A6E", lt2: "FBF3F7",
    accent1: "E0607E", accent2: "F2A93B", accent3: "2A9D8F", accent4: "7C5CBF",
    accent5: "F7D9E3", accent6: "D5EFEC", hlink: "2A9D8F", folHlink: "7C5CBF",
  },
};
const HX = THEME.colors;
const P = {
  plum: "#5B2A6E", plumDeep: "#3B1A4A", rose: "#E0607E", blush: "#F7D9E3", gold: "#F2A93B",
  teal: "#2A9D8F", mint: "#D5EFEC", ink: "#2B1B33", silver: "#C9B8D3", shadow: "#000000",
  sky: "#BFE3F2", white: "#FFFFFF", lav: "#E6DDF5", violet: "#7C5CBF",
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "اختيار الملابس — الصف السادس";
pres.subject = "المهارات الحياتية والأسرية";
pres.author = "المعلمة";
const C = pres.SchemeColor;
const SH = pres.shapes;
const W = 13.333;

// ---------- helpers ----------
const iconCache = new Map();
async function icon(Comp, hex, size = 256) {
  const key = Comp.name + hex;
  if (iconCache.has(key)) return iconCache.get(key);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  const data = "image/png;base64," + buf.toString("base64");
  iconCache.set(key, data);
  return data;
}
const shadow = () => ({ type: "outer", color: "5B2A6E", opacity: 0.14, blur: 10, offset: 3, angle: 90 });
const AR = { rtlMode: true, lang: "ar-SA" };

function T(slide, text, o) {
  slide.addText(text, { ...AR, align: "right", valign: "top", color: C.text1, fontSize: 18, margin: 0.06, isTextBox: true, ...o });
}
function card(slide, x, y, w, h, fill, o = {}) {
  slide.addShape(SH.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: o.r ?? 0.18, line: o.line || { type: "none" }, shadow: o.flat ? undefined : shadow(), objectName: o.name });
}
async function iconCircle(slide, Comp, x, y, d, bg, fgHex) {
  slide.addShape(SH.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { type: "none" } });
  const pad = d * 0.24;
  slide.addImage({ data: await icon(Comp, fgHex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}
// the deck's motif: a clothing hang-tag carrying the lesson stage and its time
function stageTag(slide, label, color = C.accent1) {
  slide.addText(label, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.25, x: 0.55, y: 0.42, w: 3.6, h: 0.5, fill: { color }, color: C.background1, fontSize: 15, bold: true, align: "center", valign: "middle", margin: 0, objectName: "Stage tag" });
  slide.addShape(SH.OVAL, { x: 0.68, y: 0.6, w: 0.14, h: 0.14, fill: { color: C.background1 }, line: { type: "none" } });
}
// objective / strategy chips under the tag
function chips(slide, items, y = 1.02) {
  let x = 0.55;
  for (const [txt, kind] of items) {
    const w = 0.22 + txt.length * 0.105;
    const fill = kind === "goal" ? C.accent5 : C.accent6;
    const color = kind === "goal" ? C.text2 : C.accent3;
    slide.addText(txt, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x, y, w, h: 0.36, fill: { color: fill }, color, fontSize: 12, bold: true, align: "center", valign: "middle", margin: 0, isTextBox: true });
    x += w + 0.12;
  }
}
function notes(slide, n) {
  const parts = [];
  if (n.time) parts.push("الزمن: " + n.time);
  if (n.goal) parts.push("الهدف المرتبط: " + n.goal);
  if (n.strategy) parts.push("الاستراتيجية: " + n.strategy);
  if (n.say) parts.push("\nما تقوله المعلمة:\n«" + n.say + "»");
  if (n.steps) parts.push("\nطريقة التنفيذ:\n" + n.steps.map((s, i) => `${i + 1}) ${s}`).join("\n"));
  if (n.teacher) parts.push("\nدور المعلمة (ميسّرة): " + n.teacher);
  if (n.student) parts.push("دور الطالبة (محور التعلم): " + n.student);
  if (n.output) parts.push("\nناتج التعلم الملاحظ: " + n.output);
  if (n.answers) parts.push("\nالإجابات المتوقعة: " + n.answers);
  if (n.extra) parts.push("\n" + n.extra);
  slide.addNotes(parts.join("\n"));
}

// ---------- layouts ----------
const FOOT = "اختيار الملابس  •  المهارات الحياتية والأسرية  •  الصف السادس الابتدائي";
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: "FFFFFF" },
  objects: [
    { text: { text: FOOT, options: { ...AR, x: 5.3, y: 7.0, w: 7.5, h: 0.3, fontSize: 10, color: "8A7A92", align: "right", margin: 0 } } },
    { placeholder: { options: { name: "title", type: "title", x: 4.2, y: 0.36, w: 8.6, h: 0.8, fontSize: 32, bold: true, color: C.text2, align: "right", valign: "middle", margin: 0, ...AR }, text: "" } },
  ],
  slideNumber: { x: 0.55, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "8A7A92", align: "left" },
});
pres.defineSlideMaster({
  title: "DARK",
  background: { color: HX.dk2 },
  objects: [],
  slideNumber: { x: 0.55, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "CDB8D8", align: "left" },
});
pres.defineSlideMaster({ title: "FEEDBACK", background: { color: "FFFFFF" }, objects: [] });

// ---------- slide registry (two passes so hyperlinks know slide numbers) ----------
const main = [], fb = [];
const S = (id, section, fn) => main.push({ id, section, fn });
const F = (id, fn) => fb.push({ id, section: "شرائح التغذية الراجعة (مخفية)", fn });
const idx = (id) => {
  const i = main.findIndex((s) => s.id === id);
  if (i >= 0) return i + 1;
  const j = fb.findIndex((s) => s.id === id);
  if (j >= 0) return main.length + j + 1;
  throw new Error("unknown slide " + id);
};
function newSlide(master, sectionTitle) {
  return pres.addSlide({ masterName: master, sectionTitle });
}
function title(slide, t) { slide.addText(t, { placeholder: "title", ...AR }); }

// ================= 1. الغلاف =================
S("cover", "البداية", async (sec) => {
  const s = newSlide("DARK", sec);
  s.addImage({ data: await art.png(art.rackSVG(P), 1400), x: 0.5, y: 1.55, w: 6.2, h: 6.2 * 420 / 900, objectName: "Clothing rack illustration", altText: "رف ملابس عليه معطف وفساتين محتشمة وعباءة" });
  T(s, "المهارات الحياتية والأسرية  •  الصف السادس الابتدائي", { x: 7.0, y: 1.55, w: 5.8, h: 0.45, fontSize: 16, color: C.accent5, bold: true });
  T(s, "اختيار الملابس", { x: 6.6, y: 2.05, w: 6.2, h: 1.3, fontSize: 60, bold: true, color: C.background1, valign: "middle" });
  T(s, "أختارُ بوعي… وأتألّقُ بقيَمي", { x: 7.0, y: 3.4, w: 5.8, h: 0.6, fontSize: 24, color: C.accent2, italic: true });
  card(s, 7.6, 4.55, 5.2, 1.5, "4A2259", { flat: true, r: 0.15 });
  T(s, [
    { text: "الوحدة: ملبسي", options: { bold: true, breakLine: true } },
    { text: "اسم المعلمة: ……………………", options: { breakLine: true } },
    { text: "التاريخ: ……/……/……١٤هـ" },
  ], { x: 7.8, y: 4.65, w: 4.8, h: 1.3, fontSize: 16, color: C.background1, paraSpaceAfter: 4, valign: "middle" });
  notes(s, {
    time: "قبل بدء الحصة",
    say: "مرحبًا بكنّ يا مستشارات الأناقة! اليوم سنكتشف معًا سرًّا نستخدمه كل صباح قبل أن نخرج من البيت.",
    steps: ["تُعرض الشريحة أثناء دخول الطالبات وجلوسهن في المجموعات.", "تكون المواد جاهزة على كل طاولة: بطاقات إشارة المرور، السبورات الصغيرة، الأوراق اللاصقة، ظرف «خزانة المجموعة»."],
    extra: "ملاحظة للمعلمة: محتوى الدرس مأخوذ من درس «اختيار الملابس» في كتاب الطالب (الوحدة: ملبسي). راجعي أرقام الصفحات وصياغة المعايير على طبعتك المعتمدة قبل الحصة.",
  });
});

// ================= 2. قبل أن ننطلق =================
S("roles", "البداية", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "قبل أن ننطلق: فريقي ودوري");
  stageTag(s, "تنظيم بيئة التعلم", C.text2);
  const roles = [
    [lu.LuCrown, "القائدة", "تنظّم الحوار وتوزّع المهام", C.accent1, HX.accent1],
    [lu.LuPencilRuler, "المقرِّرة", "تكتب ناتج المجموعة", C.accent3, HX.accent3],
    [lu.LuTimer, "الميقاتية", "تتابع الوقت وتنبّه الفريق", C.accent2, HX.accent2],
    [pi.PiChatsCircle, "المتحدثة", "تعرض ناتج المجموعة", C.accent4, HX.accent4],
  ];
  for (let i = 0; i < 4; i++) {
    const [ic, name, desc, col] = roles[i];
    const x = W - 0.55 - 2.9 - i * 3.13;
    card(s, x, 1.7, 2.9, 2.55, C.background2);
    await iconCircle(s, ic, x + 0.95, 1.9, 1.0, col, "FFFFFF");
    T(s, name, { x: x + 0.15, y: 3.0, w: 2.6, h: 0.5, fontSize: 22, bold: true, align: "center", color: C.text2 });
    T(s, desc, { x: x + 0.15, y: 3.5, w: 2.6, h: 0.6, fontSize: 16, align: "center" });
  }
  card(s, 0.55, 4.6, 12.23, 2.1, C.accent5, { flat: true });
  await iconCircle(s, lu.LuLightbulb, 11.45, 4.95, 1.15, C.background1, HX.dk2);
  T(s, "قاعدتنا الذهبية اليوم", { x: 5.0, y: 4.85, w: 6.2, h: 0.5, fontSize: 22, bold: true, color: C.text2 });
  T(s, [
    { text: "كل اختيار نقوله يجب أن يتبعه تبرير: «اخترتُ… لأنّ…»", options: { breakLine: true } },
    { text: "نرفع بطاقة إشارة المرور لنُخبر المعلمة بمدى فهمنا في أي لحظة" },
  ], { x: 0.9, y: 5.4, w: 10.3, h: 1.1, fontSize: 18, paraSpaceAfter: 6 });
  notes(s, {
    time: "دقيقة واحدة (ضمن التهيئة)",
    strategy: "التعلم التعاوني — أدوار محددة لكل طالبة",
    say: "كل واحدة منكن لها دور مهم اليوم. انظري إلى بطاقة دورك على الطاولة. وتذكّرن قاعدتنا الذهبية: لا إجابة بلا «لأنّ».",
    steps: ["توزّع المعلمة بطاقات الأدوار مسبقًا (٤–٥ طالبات في كل مجموعة).", "تشرح بطاقات إشارة المرور: الأخضر = فهمت وأستطيع الشرح، الأصفر = فهمت جزئيًا، الأحمر = أحتاج مساعدة."],
    teacher: "تنظّم بيئة التعلم وتوضّح التوقعات بإيجاز.",
    student: "تتعرف على دورها وتلتزم به طوال الحصة.",
    output: "كل طالبة تعرف دورها وتستخدم بطاقات إشارة المرور.",
  });
});

// ================= 3. التهيئة: لغز حقيبة جود =================
S("hook", "التهيئة والاستكشاف", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "لغز اليوم: حقيبة جود!");
  stageTag(s, "التهيئة  •  ٣ دقائق", C.accent1);
  chips(s, [["التعلم بالمواقف", "st"], ["إثارة التفكير", "st"]]);
  // scenario (right)
  card(s, 6.9, 1.7, 5.88, 2.6, C.background2);
  T(s, [
    { text: "ستسافر جود مع أسرتها إلى أبها في إجازة الشتاء، وستحضر هناك حفل زواج عمّتها.", options: { breakLine: true } },
    { text: "جهّزت حقيبتها بنفسها، وهذا ما وضعته فيها 👈", options: { bold: true, color: C.accent1 } },
  ], { x: 7.1, y: 1.9, w: 5.5, h: 2.2, fontSize: 21, paraSpaceAfter: 10, valign: "middle" });
  card(s, 6.9, 4.55, 5.88, 2.15, C.text2, { flat: true });
  T(s, [
    { text: "ماذا تلاحظين في حقيبة جود؟", options: { breakLine: true } },
    { text: "لو كنتِ مكانها، ماذا تُخرجين؟ وماذا تُضيفين؟", options: { breakLine: true } },
    { text: "ولماذا؟" },
  ], { x: 7.1, y: 4.7, w: 5.5, h: 1.85, fontSize: 20, color: C.background1, bold: true, paraSpaceAfter: 6, valign: "middle" });
  // suitcase (left)
  s.addShape(SH.OVAL, { x: 1.85, y: 2.2, w: 3.6, h: 3.6, fill: { color: C.accent5 }, line: { type: "none" } });
  s.addImage({ data: await icon(gi.GiRollingSuitcase, HX.dk2), x: 2.55, y: 2.85, w: 2.2, h: 2.2, altText: "حقيبة سفر" });
  const items = [
    [pi.PiTShirt, "ملابس قطنية خفيفة", 0.55, 1.75],
    [gi.GiSandal, "صندل صيفي", 4.45, 1.75],
    [pi.PiSunglasses, "نظارة شمسية", 0.55, 5.55],
    [gi.GiRunningShoe, "حذاء رياضي فقط", 4.45, 5.55],
  ];
  for (const [ic, lbl, x, y] of items) {
    card(s, x, y, 2.3, 1.05, C.background1);
    s.addImage({ data: await icon(ic, HX.accent1), x: x + 1.6, y: y + 0.22, w: 0.6, h: 0.6 });
    T(s, lbl, { x: x + 0.08, y: y + 0.12, w: 1.5, h: 0.8, fontSize: 14, bold: true, valign: "middle", color: C.text2 });
  }
  notes(s, {
    time: "٣ دقائق",
    goal: "تمهيد لجميع الأهداف (إثارة الحاجة إلى معايير الاختيار)",
    strategy: "التعلم بالمواقف + العصف الذهني",
    say: "جود فتاة في عمركن، جهّزت حقيبتها لرحلة شتوية إلى أبها ستحضر فيها حفل زواج. انظرن جيدًا إلى ما وضعته… هل أحسنت الاختيار؟",
    steps: ["تقرأ إحدى الطالبات الموقف بصوت مسموع.", "تفكر كل طالبة بمفردها ٢٠ ثانية، ثم تتبادل الرأي مع جارتها.", "تستقبل المعلمة ٣–٤ إجابات وتطلب التبرير بـ«لأنّ».", "تختم المعلمة بسؤال: «إذن، ما الذي يجعل اختيار الملابس صحيحًا؟ هذا ما سنكتشفه».", "تدوّن إجابات الطالبات في زاوية السبورة لتعود إليها في الختام."],
    teacher: "تطرح الموقف وتستثير التفكير دون أن تعطي الإجابة.",
    student: "تلاحظ وتنقد اختيار جود وتقترح بدائل مع التبرير.",
    output: "قائمة مقترحات الطالبات على السبورة (مثل: تحتاج معطفًا صوفيًا، تحتاج فستانًا للحفل).",
    answers: "الحقيبة تناسب الصيف لا الشتاء؛ أبها باردة شتاءً فتحتاج ملابس صوفية دافئة ومعطفًا. لا يوجد ما يناسب حفل الزواج. الصندل والنظارة الشمسية للصيف.",
  });
});

// ================= 4. الاستكشاف =================
S("explore", "التهيئة والاستكشاف", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "لاحظي… واستنتجي السرّ");
  stageTag(s, "الاستكشاف  •  ٤ دقائق", C.accent3);
  chips(s, [["فكّري – زاوجي – شاركي", "st"], ["الملاحظة والاستنتاج", "st"]]);
  const scenes = [
    [lu.LuCloudSnow, "يوم شتوي بارد", "معطف صوفي داكن ووشاح", C.accent4, HX.accent4],
    [lu.LuLandmark || fa6.FaLandmarkFlag, "احتفال يوم التأسيس", "زيّ تراثي من منطقتي", C.accent2, HX.accent2],
    [fa6.FaPersonRunning, "حصة التربية البدنية", "زيّ رياضي وحذاء رياضي", C.accent3, HX.accent3],
    [fa6.FaMosque, "الصلاة", "لباس واسع ساتر", C.accent1, HX.accent1],
  ];
  for (let i = 0; i < 4; i++) {
    const [ic, place, outfit, col] = scenes[i];
    const x = W - 0.55 - 2.85 - i * 3.13;
    card(s, x, 1.7, 2.85, 3.05, C.background2);
    await iconCircle(s, ic, x + 0.83, 1.9, 1.2, col, "FFFFFF");
    T(s, place, { x: x + 0.1, y: 3.2, w: 2.65, h: 0.5, fontSize: 19, bold: true, align: "center", color: C.text2 });
    T(s, "⬇", { x: x + 0.1, y: 3.65, w: 2.65, h: 0.35, fontSize: 14, align: "center", color: C.accent1 });
    T(s, outfit, { x: x + 0.1, y: 3.95, w: 2.65, h: 0.65, fontSize: 16, align: "center" });
  }
  card(s, 0.55, 5.05, 12.23, 1.65, C.text2, { flat: true });
  await iconCircle(s, pi.PiBrain, 11.4, 5.27, 1.2, C.background1, HX.dk2);
  T(s, [
    { text: "مع زميلتك: ما السرّ وراء كل اختيار؟", options: { bold: true, fontSize: 22, breakLine: true } },
    { text: "اكتبا كلمة واحدة لكل صورة على الورقة اللاصقة، ثم ألصقاها على لوحة «أسرار الاختيار»" },
  ], { x: 0.85, y: 5.2, w: 10.4, h: 1.35, fontSize: 18, color: C.background1, valign: "middle", paraSpaceAfter: 6 });
  notes(s, {
    time: "٤ دقائق",
    goal: "هـ١ (مدخل استقرائي لمعايير الاختيار)",
    strategy: "فكّري – زاوجي – شاركي",
    say: "في كل صورة اختارت فتاةٌ ملابسها بطريقة ذكية. لا أريد أن أخبركن بالسرّ… أنتنّ ستكتشفنه!",
    steps: ["فكّري (٣٠ ثانية): تتأمل كل طالبة الصور الأربع بمفردها.", "زاوجي (دقيقة ونصف): تتفق الطالبة مع زميلتها على كلمة واحدة تفسّر كل اختيار وتكتبانها على أوراق لاصقة.", "شاركي (دقيقتان): تُلصق الأوراق على لوحة «أسرار الاختيار»، وتجمع المعلمة الكلمات المتشابهة وتسأل: «ما العنوان الذي يجمع هذه الأسرار؟»", "تصل الطالبات إلى عنوان الدرس: اختيار الملابس وفق معايير."],
    teacher: "تطرح السؤال، وتتجول، وتجمع الاستنتاجات وتصنّفها دون تصحيح مباشر.",
    student: "تلاحظ وتقارن وتستنتج المعيار بنفسها وتناقشه مع زميلتها.",
    output: "لوحة «أسرار الاختيار» بها كلمات الطالبات (الطقس/الموسم، المناسبة، التراث/العادات، الحشمة/الستر).",
    answers: "١) الموسم (الطقس البارد)  ٢) العادات والتقاليد والمناسبة  ٣) المناسبة (الرياضة)  ٤) مواصفات اللباس الشرعي.",
  });
});

// ================= 5. عنوان الدرس =================
S("big-q", "التهيئة والاستكشاف", async (sec) => {
  const s = newSlide("DARK", sec);
  s.addShape(SH.OVAL, { x: 5.67, y: 0.9, w: 2.0, h: 2.0, fill: { color: "4A2259" }, line: { type: "none" } });
  s.addImage({ data: await icon(pi.PiCoatHanger, HX.accent2), x: 6.07, y: 1.3, w: 1.2, h: 1.2 });
  T(s, "عنوان درسنا", { x: 1.5, y: 3.05, w: 10.33, h: 0.5, fontSize: 20, color: C.accent5, align: "center" });
  T(s, "اختيار الملابس", { x: 1.5, y: 3.5, w: 10.33, h: 1.1, fontSize: 54, bold: true, color: C.background1, align: "center", valign: "middle" });
  card(s, 2.2, 4.95, 8.93, 1.45, "4A2259", { flat: true });
  T(s, [
    { text: "سؤالنا الكبير: ", options: { color: C.accent2, bold: true } },
    { text: "كيف أختار ملابس تناسبني، وتناسب الموقف، وتُرضي ربّي؟", options: { color: C.background1 } },
  ], { x: 2.45, y: 5.05, w: 8.43, h: 1.25, fontSize: 24, align: "center", valign: "middle" });
  notes(s, {
    time: "ضمن الاستكشاف",
    say: "أحسنتنّ! الأسرار التي اكتشفتنّها لها اسم: معايير اختيار الملابس. وسؤالنا الكبير الذي سنجيب عنه في نهاية الحصة: كيف أختار ملابس تناسبني، وتناسب الموقف، وتُرضي ربي؟",
    steps: ["تكتب المعلمة العنوان والسؤال الكبير على السبورة ويبقيان ظاهرين طوال الحصة.", "تُعاد الإجابة عن السؤال الكبير في شريحة الختام لقياس التحول في الفهم."],
    output: "الطالبات يصغن عنوان الدرس بأنفسهن.",
  });
});

// ================= 6. الأهداف =================
S("goals", "الأهداف", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "أهدافي اليوم");
  stageTag(s, "الأهداف  •  دقيقة", C.text2);
  T(s, "في نهاية الدرس أستطيع أن:", { x: 6.0, y: 1.25, w: 6.78, h: 0.45, fontSize: 18, bold: true, color: C.accent1 });
  const goals = [
    ["هـ١", "أعدّد معايير اختيار الملابس.", "تذكّر", lu.LuListChecks],
    ["هـ٢", "أحدّد شروط اللباس الشرعي، وأميّز الملابس التي تحققها.", "فهم", fa6.FaShieldHeart],
    ["هـ٣", "أعلّل اختيار نوع القماش ولونه بحسب فصول السنة.", "فهم وتفسير", lu.LuSunSnow],
    ["هـ٤", "أختار ملابس مناسبة لموقف حياتي، وأبرّر اختياري وفق المعايير.", "تطبيق وتقويم", lu.LuScale],
    ["هـ٥", "أعتزّ باللباس المحتشم وبزيّنا الوطني بوصفهما جزءًا من قيمي وهويتي.", "وجداني", lu.LuHeartHandshake],
  ];
  const cols = [C.accent1, C.accent4, C.accent3, C.accent2, C.text2];
  for (let i = 0; i < goals.length; i++) {
    const [code, txt, lvl, ic] = goals[i];
    const y = 1.8 + i * 1.0;
    card(s, 0.55, y, 12.23, 0.85, i % 2 ? C.background1 : C.background2, { flat: true, r: 0.12 });
    s.addText(code, { ...AR, shape: SH.OVAL, x: 12.0, y: y + 0.1, w: 0.65, h: 0.65, fill: { color: cols[i] }, color: C.background1, bold: true, fontSize: 16, align: "center", valign: "middle", margin: 0 });
    s.addImage({ data: await icon(ic, HX.dk2), x: 11.3, y: y + 0.2, w: 0.45, h: 0.45 });
    T(s, txt, { x: 2.6, y: y + 0.08, w: 8.55, h: 0.7, fontSize: 19, valign: "middle" });
    s.addText(lvl, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: 0.75, y: y + 0.2, w: 1.7, h: 0.45, fill: { color: C.accent6 }, color: C.accent3, fontSize: 13, bold: true, align: "center", valign: "middle", margin: 0 });
  }
  notes(s, {
    time: "دقيقة واحدة",
    say: "هذه أهدافنا. سأطلب منكن في نهاية الحصة أن تحكمن بأنفسكن: هل حققتُها؟ لاحظن أن كل نشاط في الحصة يحمل رمز الهدف الذي يخدمه (هـ١، هـ٢…).",
    steps: ["تقرأ طالبة الأهداف، وتربط المعلمة كل هدف بسرٍّ من أسرار لوحة الاستكشاف.", "تُعلَّق الأهداف على جانب السبورة ليُشار إليها عند كل نشاط."],
    extra: "مستويات الأهداف: تذكّر ← فهم ← تطبيق ← تقويم + هدف وجداني. وكل هدف مقيس بأداة محددة (انظري مصفوفة المواءمة في ملحق المعلمة آخر العرض).",
  });
});

// ================= 7. رحلة الخبيرات =================
S("jigsaw", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "رحلة الخبيرات");
  stageTag(s, "بناء التعلم  •  ٥ دقائق", C.accent4);
  chips(s, [["التعلم التعاوني (الخبيرات)", "st"], ["هـ١", "goal"], ["هـ٢", "goal"], ["هـ٣", "goal"]]);
  const groups = [
    ["١", "اللباس الشرعي", fa6.FaShieldHeart, C.accent1],
    ["٢", "العادات والتقاليد", lu.LuLandmark || fa6.FaLandmarkFlag, C.accent2],
    ["٣", "الموسم", lu.LuSunSnow, C.accent3],
    ["٤", "العمر ولون البشرة", lu.LuPalette, C.accent4],
    ["٥", "القوام والمناسبة", lu.LuRuler, C.text2],
  ];
  for (let i = 0; i < 5; i++) {
    const [n, name, ic, col] = groups[i];
    const x = W - 0.55 - 2.29 - i * 2.485;
    card(s, x, 1.65, 2.29, 2.3, C.background2);
    s.addText("مجموعة " + n, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: x + 0.45, y: 1.8, w: 1.4, h: 0.4, fill: { color: col }, color: C.background1, fontSize: 14, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addImage({ data: await icon(ic, HX.dk2), x: x + 0.82, y: 2.35, w: 0.65, h: 0.65 });
    T(s, name, { x: x + 0.08, y: 3.1, w: 2.13, h: 0.7, fontSize: 17, bold: true, align: "center", valign: "middle", color: C.text2 });
  }
  const steps = [
    ["اقرئي", "بطاقة المعيار من كتابك"],
    ["لخّصي", "المعيار في جملة واحدة"],
    ["اربطي", "بمثال من حياتك اليومية"],
    ["اسألي", "زميلاتك سؤالًا واحدًا"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = W - 0.55 - 2.85 - i * 3.13;
    s.addText(String.fromCharCode(0x661 + i), { ...AR, shape: SH.OVAL, x: x + 2.15, y: 4.35, w: 0.6, h: 0.6, fill: { color: C.accent1 }, color: C.background1, bold: true, fontSize: 18, align: "center", valign: "middle", margin: 0 });
    T(s, steps[i][0], { x: x, y: 4.35, w: 2.05, h: 0.6, fontSize: 22, bold: true, color: C.text2, valign: "middle" });
    T(s, steps[i][1], { x: x, y: 5.0, w: 2.75, h: 0.75, fontSize: 16 });
  }
  card(s, 0.55, 5.95, 12.23, 0.8, C.accent6, { flat: true });
  T(s, "٤ دقائق للتحضير  •  دقيقة واحدة لعرض كل مجموعة  •  الناتج: «بطاقة الخبيرة» تُعلَّق على اللوحة", { x: 0.8, y: 6.0, w: 11.8, h: 0.7, fontSize: 18, bold: true, color: C.accent3, align: "center", valign: "middle" });
  notes(s, {
    time: "٥ دقائق تحضير، ثم تُعرض النتائج مع الشرائح التالية (دقيقة لكل مجموعة)",
    goal: "هـ١، هـ٢، هـ٣",
    strategy: "التعلم التعاوني — استراتيجية الخبيرات (Jigsaw) المبسطة",
    say: "كل مجموعة ستصبح خبيرة في معيار من معايير اختيار الملابس، وستعلّمه لبقية الصف. أنتنّ المعلمات في هذه الدقائق!",
    steps: ["تأخذ كل مجموعة «بطاقة الخبيرة» الخاصة بها، وتقرأ الجزء المحدد من درس «اختيار الملابس» في كتاب الطالب.", "تكتب المقررة: المعيار في جملة + مثالًا من الحياة + سؤالًا للصف.", "الميقاتية تتابع المؤقت الظاهر على الشاشة (يمكن استخدام مؤقت إلكتروني).", "عند عرض كل مجموعة تنتقل المعلمة إلى شريحة المعيار نفسه لتعزيزه وتصحيح أي فهم خاطئ.", "توزيع المعايير: م١ اللباس الشرعي، م٢ العادات والتقاليد، م٣ الموسم، م٤ العمر ولون البشرة، م٥ القوام والمناسبة."],
    teacher: "تتجول بين المجموعات، تطرح أسئلة موجِّهة («ما الدليل من الكتاب؟»)، وتدعم المجموعة المتعثرة دون أن تُنجز عنها.",
    student: "تقرأ وتلخص وتبني المعرفة مع زميلاتها ثم تعلّمها لغيرها.",
    output: "خمس بطاقات خبيرة مكتوبة + عرض شفهي لكل مجموعة.",
  });
});

// ================= 8. خريطة المعايير =================
S("map", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "مفاتيح اختيار ملابسي");
  stageTag(s, "بناء التعلم", C.accent4);
  chips(s, [["خريطة ذهنية", "st"], ["هـ١", "goal"]]);
  const cx = 6.67, cy = 4.25;
  s.addShape(SH.OVAL, { x: cx - 1.25, y: cy - 1.25, w: 2.5, h: 2.5, fill: { color: C.text2 }, line: { type: "none" }, shadow: shadow() });
  s.addImage({ data: await icon(pi.PiCoatHanger, HX.accent2), x: cx - 0.45, y: cy - 0.95, w: 0.9, h: 0.9 });
  T(s, "معايير اختيار الملابس", { x: cx - 1.1, y: cy - 0.05, w: 2.2, h: 0.85, fontSize: 16, bold: true, align: "center", color: C.background1, valign: "middle" });
  const crit = [
    ["مطابقة اللباس الشرعي", fa6.FaShieldHeart, C.accent1],
    ["العادات والتقاليد", lu.LuLandmark || fa6.FaLandmarkFlag, C.accent2],
    ["الموسم", lu.LuSunSnow, C.accent3],
    ["العمر", fa6.FaChildDress, C.accent4],
    ["لون البشرة", lu.LuPalette, C.accent1],
    ["القوام", lu.LuRuler, C.accent3],
    ["المناسبة", lu.LuPartyPopper, C.accent2],
  ];
  const ord = ["١", "٢", "٣", "٤", "٥", "٦", "٧"];
  // explicit positions (RTL order: starts top, moves right then around)
  const pos = [[6.67, 1.95], [9.35, 2.55], [10.25, 4.45], [8.6, 6.0], [4.74, 6.0], [3.09, 4.45], [3.99, 2.55]];
  for (let i = 0; i < 7; i++) {
    const [name, ic, col] = crit[i];
    const [x, y] = pos[i];
    s.addShape(SH.OVAL, { x: x - 0.42, y: y - 0.42, w: 0.84, h: 0.84, fill: { color: col }, line: { color: "FFFFFF", width: 3 } });
    s.addImage({ data: await icon(ic, "FFFFFF"), x: x - 0.24, y: y - 0.24, w: 0.48, h: 0.48 });
    s.addText(ord[i], { ...AR, shape: SH.OVAL, x: x + 0.22, y: y - 0.5, w: 0.34, h: 0.34, fill: { color: C.text2 }, color: C.background1, fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0 });
    const right = x > cx + 0.1, left = x < cx - 0.1;
    const tw = 2.3;
    const tx = right ? x + 0.5 : left ? x - 0.5 - tw : x - tw / 2;
    const ty = right || left ? y - 0.25 : y - 0.25;
    if (!right && !left) {
      T(s, name, { x: x + 0.62, y: y - 0.25, w: 3.2, h: 0.5, fontSize: 18, bold: true, color: C.text2, align: "left", valign: "middle" });
    } else {
      T(s, name, { x: tx, y: ty, w: tw, h: 0.5, fontSize: 18, bold: true, color: C.text2, align: right ? "left" : "right", valign: "middle" });
    }
  }
  notes(s, {
    time: "دقيقة واحدة (تعرض قبل عروض المجموعات وبعدها)",
    goal: "هـ١",
    strategy: "خريطة ذهنية بصرية",
    say: "هذه المفاتيح السبعة التي وردت في درسنا. قارنّها بأسرار لوحتكن: كم سرًّا اكتشفتنّ قبل أن تقرأن؟",
    steps: ["تقارن الطالبات لوحة «أسرار الاختيار» بالخريطة، ويُضاف ما لم يُكتشف.", "تُستخدم الخريطة مرجعًا لكل عروض المجموعات."],
    output: "الطالبات يعددن المعايير السبعة ويقارنّها باستنتاجاتهن الأولى.",
    extra: "ترتيب المعايير وفق كتاب الطالب: أولًا مطابقتها لمواصفات اللباس الشرعي، ثانيًا العادات والتقاليد، ثالثًا الموسم، رابعًا العمر، خامسًا لون البشرة، سادسًا القوام، سابعًا المناسبة. (تحققي من الترتيب في طبعتك).",
  });
});

// ================= 9. اللباس الشرعي =================
S("c1", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "أولًا: مواصفات اللباس الشرعي");
  stageTag(s, "عرض المجموعة ١", C.accent1);
  chips(s, [["هـ٢", "goal"], ["هـ٥", "goal"], ["ربط بالقيم الإسلامية", "st"]]);
  card(s, 7.6, 1.7, 5.18, 4.95, C.text2);
  s.addImage({ data: await icon(lu.LuBookOpen, HX.accent2), x: 9.83, y: 1.95, w: 0.75, h: 0.75 });
  T(s, "﴿يَا بَنِي آدَمَ قَدْ أَنزَلْنَا عَلَيْكُمْ لِبَاسًا يُوَارِي سَوْآتِكُمْ وَرِيشًا ۖ وَلِبَاسُ التَّقْوَىٰ ذَٰلِكَ خَيْرٌ﴾", { x: 7.85, y: 2.8, w: 4.68, h: 2.3, fontSize: 26, color: C.background1, align: "center", valign: "middle", fontFace: "Traditional Arabic", bold: true });
  T(s, "[سورة الأعراف: ٢٦]", { x: 7.85, y: 5.1, w: 4.68, h: 0.45, fontSize: 14, color: C.accent5, align: "center" });
  T(s, "الحشمة فطرة، والستر جمال", { x: 7.85, y: 5.65, w: 4.68, h: 0.6, fontSize: 18, color: C.accent2, align: "center", bold: true });
  const conds = [
    [lu.LuShieldCheck, "ساتر للعورة"],
    [pi.PiDress, "واسع فضفاض غير شفاف"],
    [lu.LuUserCheck, "بعيد عن التشبّه بغير المسلمات"],
    [lu.LuBan, "خالٍ من الصور والكتابات والرسومات المخالفة للشريعة والآداب العامة"],
  ];
  T(s, "شروط اللباس الشرعي:", { x: 0.55, y: 1.65, w: 6.8, h: 0.5, fontSize: 20, bold: true, color: C.accent1 });
  for (let i = 0; i < 4; i++) {
    const [ic, txt] = conds[i];
    const y = 2.25 + i * 1.1;
    card(s, 0.55, y, 6.8, 0.95, C.background2, { flat: true, r: 0.12 });
    await iconCircle(s, ic, 6.5, y + 0.1, 0.75, C.accent1, "FFFFFF");
    T(s, txt, { x: 0.75, y: y + 0.08, w: 5.65, h: 0.8, fontSize: 18, valign: "middle" });
  }
  notes(s, {
    time: "دقيقتان (عرض المجموعة ١ + تعزيز المعلمة)",
    goal: "هـ٢، هـ٥",
    strategy: "تعلّم الأقران + الربط بالقيم الإسلامية",
    say: "شكرًا لخبيرات المجموعة الأولى. يقول الله تعالى في سورة الأعراف: ﴿يا بني آدم قد أنزلنا عليكم لباسًا يواري سوآتكم وريشًا ولباس التقوى ذلك خير﴾. اللباس نعمة من الله: يسترنا ويجمّلنا.",
    steps: ["تعرض متحدثة المجموعة ١ بطاقة الخبيرة (دقيقة).", "تعزّز المعلمة العرض بالشروط الأربعة على الشريحة.", "سؤال تفكير: «لماذا جاء ستر العورة أول الشروط؟» — تُستقبل إجابتان مع التبرير.", "تنتقل المعلمة إلى السؤال السريع (١) للتحقق الفوري."],
    teacher: "تصحح المفاهيم وتربط المعيار بالقيم، وتشيد بدقة عرض المجموعة.",
    student: "تعرض وتشرح وتجيب عن أسئلة زميلاتها.",
    output: "تذكر الطالبة شروط اللباس الشرعي الأربعة.",
    extra: "الشروط كما تناولها الدرس: ساترًا للعورة، فضفاضًا واسعًا غير شفاف، بعيدًا عن التشبّه، خاليًا من الصور أو الكتابات أو الرسومات المنافية للشريعة والآداب العامة.",
  });
});

// ---------- interactive question helper ----------
async function questionSlide(sec, { qid, title: t, stem, options, correct, goal }) {
  const s = newSlide("CONTENT", sec);
  title(s, t);
  stageTag(s, "تقويم بنائي  •  دقيقة", C.accent3);
  chips(s, [[goal, "goal"], ["تغذية راجعة فورية", "st"]]);
  card(s, 0.55, 1.6, 12.23, 1.25, C.accent6, { flat: true });
  await iconCircle(s, pi.PiQuestion, 11.75, 1.75, 0.95, C.accent3, "FFFFFF");
  T(s, stem, { x: 0.8, y: 1.65, w: 10.8, h: 1.15, fontSize: 22, bold: true, valign: "middle", color: C.text1 });
  const letters = ["أ", "ب", "ج"];
  const cols = [C.accent1, C.accent4, C.accent2];
  for (let i = 0; i < options.length; i++) {
    const [ic, txt, icHex] = options[i];
    const x = W - 0.55 - 3.85 - i * 4.19;
    card(s, x, 3.15, 3.85, 3.0, C.background2);
    s.addText(letters[i], { ...AR, shape: SH.OVAL, x: x + 3.05, y: 3.3, w: 0.65, h: 0.65, fill: { color: cols[i] }, color: C.background1, fontSize: 22, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addImage({ data: await icon(ic, icHex || HX.dk2), x: x + 1.42, y: 3.45, w: 1.0, h: 1.0 });
    T(s, txt, { x: x + 0.2, y: 4.6, w: 3.45, h: 1.35, fontSize: 18, align: "center", valign: "middle", bold: true, color: C.text2 });
    s.addShape(SH.RECTANGLE, { x, y: 3.15, w: 3.85, h: 3.0, fill: { color: "FFFFFF", transparency: 100 }, line: { type: "none" }, hyperlink: { slide: idx(`${qid}-${i}`), tooltip: "اضغطي لعرض التغذية الراجعة" }, objectName: `Answer ${letters[i]} link` });
  }
  T(s, "ارفعي بطاقة الحرف ✋ … ثم تضغط المعلمة على الإجابة الأكثر اختيارًا لتظهر التغذية الراجعة", { x: 0.55, y: 6.35, w: 12.23, h: 0.45, fontSize: 15, color: "6B5A75", align: "center" });
  notes(s, {
    time: "دقيقة واحدة",
    goal,
    strategy: "تقويم بنائي تفاعلي بتغذية راجعة فورية (روابط داخل العرض)",
    say: "فكّري بمفردك ٢٠ ثانية… ثم ارفعي بطاقة الحرف الذي تختارينه. لا تنظري إلى زميلتك!",
    steps: ["تقرأ المعلمة السؤال، وتمنح ٢٠ ثانية تفكير.", "ترفع كل طالبة بطاقة الحرف (أ/ب/ج) في الوقت نفسه؛ فتقدّر المعلمة نسبة الإجابات الصحيحة بنظرة سريعة.", "تضغط المعلمة على البطاقة الأكثر اختيارًا في وضع العرض، فتنتقل إلى شريحة تغذية راجعة مخفية: الصحيحة تشرح السبب ثم تعود إلى الدرس، والخاطئة تعطي تلميحًا دون كشف الإجابة ثم تعيد إلى السؤال.", "إن كانت نسبة الإجابات الخاطئة كبيرة: تعيد المعلمة شرح المعيار بمثال آخر قبل المتابعة."],
    teacher: "تقرأ استجابات الصف كله وتتخذ قرارًا فوريًا: تتابع أو تعيد الشرح.",
    student: "تجيب فرديًا، وتبرّر إجابتها عند الطلب، وتصحح فهمها من التلميح.",
    output: "نسبة الإجابات الصحيحة (دليل فوري على تحقق الهدف).",
    answers: "الإجابة الصحيحة: " + ["أ", "ب", "ج"][correct],
    extra: "مهم: الروابط تعمل في وضع العرض (Slide Show) فقط. شرائح التغذية الراجعة مخفية في آخر الملف ولا تظهر عند التنقل العادي.",
  });
  return s;
}
async function feedbackSlide(sec, { ok, head, body, backId, nextId }) {
  const s = newSlide("FEEDBACK", sec);
  s.hidden = !process.env.SHOWFB;
  s.background = { color: ok ? HX.accent3 : HX.accent2 };
  s.addShape(SH.OVAL, { x: 5.67, y: 0.75, w: 2.0, h: 2.0, fill: { color: C.background1 }, line: { type: "none" } });
  s.addImage({ data: await icon(ok ? lu.LuCircleCheckBig : lu.LuLightbulb, ok ? HX.accent3 : HX.accent2), x: 6.07, y: 1.15, w: 1.2, h: 1.2 });
  T(s, head, { x: 1.5, y: 2.95, w: 10.33, h: 0.95, fontSize: 40, bold: true, color: ok ? C.background1 : C.text2, align: "center", valign: "middle" });
  card(s, 1.8, 4.0, 9.73, 1.75, C.background1, { flat: true });
  T(s, body, { x: 2.05, y: 4.1, w: 9.23, h: 1.55, fontSize: 21, align: "center", valign: "middle", color: C.text1 });
  const label = ok ? "متابعة الدرس" : "أعود إلى السؤال";
  s.addText(label, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.3, x: 4.92, y: 6.05, w: 3.5, h: 0.7, fill: { color: C.text2 }, color: C.background1, fontSize: 20, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addShape(SH.RECTANGLE, { x: 4.92, y: 6.05, w: 3.5, h: 0.7, fill: { color: "FFFFFF", transparency: 100 }, line: { type: "none" }, hyperlink: { slide: idx(ok ? nextId : backId), tooltip: label }, objectName: "Navigation link" });
  s.addNotes(ok ? "شريحة مخفية: تظهر فقط عند الضغط على الإجابة الصحيحة. اطلبي من طالبة أن تشرح بصوتها لماذا الإجابة صحيحة قبل المتابعة." : "شريحة مخفية: تظهر عند اختيار إجابة غير صحيحة. لا تذكري الإجابة الصحيحة؛ اطرحي التلميح، وأعطي المجموعات ١٥ ثانية للنقاش، ثم عودي إلى السؤال.");
}
function makeQuestion(qid, sec, q) {
  S(qid, sec, (secName) => questionSlide(secName, { qid, ...q }));
  q.feedback.forEach((f, i) => F(`${qid}-${i}`, (secName) => feedbackSlide(secName, { ...f, ok: i === q.correct, backId: qid, nextId: q.nextId })));
}

// ================= 10. سؤال سريع ١ =================
makeQuestion("q1", "بناء التعلم", {
  title: "سؤال سريع (١)",
  goal: "هـ٢",
  stem: "أيّ هذه الاختيارات يحقق شروط اللباس الشرعي؟",
  options: [
    [pi.PiDress, "فستان طويل واسع، قماشه غير شفاف"],
    [pi.PiTShirt, "قميص عليه كتابة لا تليق بالآداب العامة"],
    [lu.LuEye, "فستان ضيّق وقماشه شفاف"],
  ],
  correct: 0,
  nextId: "c2",
  feedback: [
    { head: "أحسنتِ! اختيار موفّق", body: "الفستان الطويل الواسع غير الشفاف يحقق شروط اللباس الشرعي: يستر، وفضفاض، وخالٍ مما يخالف الآداب." },
    { head: "فكّري مرة أخرى…", body: "تلميح: راجعي الشرط الرابع — هل يخلو هذا القميص من الكتابات المخالفة للآداب العامة؟" },
    { head: "فكّري مرة أخرى…", body: "تلميح: راجعي الشرط الثاني — هل هذا الفستان واسع فضفاض وغير شفاف؟" },
  ],
});

// ================= 11. العادات والتقاليد =================
S("c2", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "ثانيًا: العادات والتقاليد");
  stageTag(s, "عرض المجموعة ٢", C.accent2);
  chips(s, [["هـ١", "goal"], ["هـ٥", "goal"], ["تعزيز الهوية الوطنية", "st"]]);
  card(s, 6.85, 1.7, 5.93, 2.45, C.background2);
  await iconCircle(s, lu.LuGlobe, 11.6, 1.95, 0.95, C.accent2, "FFFFFF");
  T(s, "الملابس تختلف من بلد إلى آخر، ومن منطقة إلى أخرى؛ لذا نراعي عادات مجتمعنا وتقاليده عند اختيار ملابسنا.", { x: 7.05, y: 2.0, w: 4.45, h: 2.0, fontSize: 19, valign: "middle" });
  card(s, 6.85, 4.4, 5.93, 2.3, C.text2);
  await iconCircle(s, lu.LuLandmark || fa6.FaLandmarkFlag, 11.6, 4.65, 0.95, C.accent2, "FFFFFF");
  T(s, [
    { text: "زيّنا الوطني هويتنا", options: { bold: true, fontSize: 22, color: C.accent2, breakLine: true } },
    { text: "نرتديه بفخر في المناسبات الوطنية، مثل يوم التأسيس (٢٢ فبراير) واليوم الوطني (٢٣ سبتمبر)." },
  ], { x: 7.05, y: 4.55, w: 4.45, h: 2.0, fontSize: 18, color: C.background1, valign: "middle", paraSpaceAfter: 6 });
  // talk prompt (left)
  s.addShape(SH.OVAL, { x: 1.25, y: 1.75, w: 4.6, h: 4.6, fill: { color: C.accent5 }, line: { type: "none" } });
  s.addImage({ data: await icon(pi.PiChatsCircle, HX.accent1), x: 2.85, y: 2.15, w: 1.4, h: 1.4 });
  T(s, [
    { text: "حوار دقيقة", options: { bold: true, fontSize: 22, color: C.text2, breakLine: true } },
    { text: "ماذا ترتدي نساء أسرتك في المناسبات التراثية؟ وما الذي يميّزه؟" },
  ], { x: 1.75, y: 3.65, w: 3.6, h: 1.9, fontSize: 18, align: "center", valign: "top", paraSpaceAfter: 6 });
  notes(s, {
    time: "دقيقتان",
    goal: "هـ١، هـ٥",
    strategy: "تعلّم الأقران + حوار موجّه",
    say: "وطننا واسع، ولكل منطقة فيه زيّ تراثي جميل. حين نرتديه في يوم التأسيس أو اليوم الوطني فنحن نعبّر عن اعتزازنا بهويتنا.",
    steps: ["تعرض المجموعة ٢ بطاقة الخبيرة.", "حوار دقيقة: تشارك ٢–٣ طالبات وصف الزي التراثي في أسرهن أو مناطقهن.", "تسأل المعلمة: «هل يمكن أن يكون الزي جميلًا ولكنه لا يناسب عادات مجتمعنا؟ مثّلي»."],
    teacher: "تُدير الحوار وتثمّن تنوع مناطق المملكة، وتربط المعيار بالهوية الوطنية.",
    student: "تشارك من خبرتها الأسرية وتعبّر عن اعتزازها بتراثها.",
    output: "تذكر الطالبة أن الملابس تختلف باختلاف البلدان والمناطق، وتعطي مثالًا من بيئتها.",
  });
});

// ================= 12. الموسم =================
S("c3", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "ثالثًا: الموسم");
  stageTag(s, "عرض المجموعة ٣", C.accent3);
  chips(s, [["هـ٣", "goal"], ["فكّري – زاوجي – شاركي", "st"]]);
  const panels = [
    { x: 6.85, bg: "FFF4DF", ic: lu.LuSun, icHex: HX.accent2, head: "الصيف", fabric: "ملابس قطنية", color: "ألوان فاتحة", art: "summer", tc: C.text1, hc: C.text2 },
    { x: 0.55, bg: "EFE8F7", ic: lu.LuSnowflake, icHex: HX.accent4, head: "الشتاء", fabric: "ملابس صوفية", color: "ألوان داكنة", art: "winter", tc: C.text1, hc: C.accent4 },
  ];
  for (const p of panels) {
    card(s, p.x, 1.6, 5.93, 3.75, p.bg);
    s.addImage({ data: await art.png(art.seasonSVG(p.art, P), 480), x: p.x + 0.25, y: 1.75, w: 2.2, h: 2.2 * 350 / 240 });
    s.addImage({ data: await icon(p.ic, p.icHex), x: p.x + 4.85, y: 1.85, w: 0.8, h: 0.8 });
    T(s, p.head, { x: p.x + 2.6, y: 1.85, w: 2.2, h: 0.8, fontSize: 32, bold: true, color: p.hc, valign: "middle" });
    T(s, [
      { text: "القماش: " + p.fabric, options: { breakLine: true } },
      { text: "اللون: " + p.color },
    ], { x: p.x + 2.5, y: 2.85, w: 3.25, h: 1.3, fontSize: 19, color: p.tc, paraSpaceAfter: 8, bold: true });
  }
  card(s, 0.55, 5.6, 12.23, 1.15, C.accent6, { flat: true });
  await iconCircle(s, pi.PiBrain, 11.75, 5.7, 0.95, C.accent3, "FFFFFF");
  T(s, [
    { text: "علّلي مع زميلتك: ", options: { bold: true, color: C.accent3 } },
    { text: "لماذا نفضّل الملابس القطنية الفاتحة في الصيف؟ ولماذا الصوفية الداكنة في الشتاء؟" },
  ], { x: 0.8, y: 5.68, w: 10.8, h: 1.0, fontSize: 19, valign: "middle" });
  notes(s, {
    time: "٣ دقائق",
    goal: "هـ٣",
    strategy: "فكّري – زاوجي – شاركي",
    say: "خبيرات المجموعة الثالثة أخبرننا ماذا نلبس في كل فصل… والآن السؤال الأهم: لماذا؟",
    steps: ["تعرض المجموعة ٣ بطاقة الخبيرة.", "فكّري (٣٠ ث): تكتب كل طالبة تعليلها على السبورة الصغيرة.", "زاوجي (٤٥ ث): تقارن مع زميلتها وتُحسّنان التعليل.", "شاركي: تعرض ثلاث ثنائيات تعليلها، ثم تنتقل المعلمة إلى شريحة «نتحقق من تعليلنا»."],
    teacher: "تطرح سؤال «لماذا؟» وتؤجل الإجابة حتى تُنتج الطالبات تعليلاتهن.",
    student: "تفسّر وتعلّل وتربط بخبرتها (ماذا تشعر حين تلبس ملابس داكنة تحت الشمس؟).",
    output: "تعليل مكتوب على السبورة الصغيرة لكل طالبة.",
  });
});

S("c3b", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "نتحقق من تعليلنا");
  stageTag(s, "تعزيز المعلمة", C.accent3);
  chips(s, [["هـ٣", "goal"], ["الربط بالعلوم", "st"]]);
  const rows = [
    [lu.LuDroplets, "الملابس القطنية تمتص العرق", "الصيف", C.accent2],
    [lu.LuWind, "تسمح بتهوية الجسم", "الصيف", C.accent2],
    [lu.LuSun, "الألوان الفاتحة تعكس أشعة الشمس", "الصيف", C.accent2],
    [lu.LuThermometerSnowflake, "الملابس الصوفية تحفظ دفء الجسم", "الشتاء", C.accent4],
    [lu.LuFlame, "الألوان الداكنة تمتص الحرارة", "الشتاء", C.accent4],
  ];
  for (let i = 0; i < rows.length; i++) {
    const [ic, txt, tag, col] = rows[i];
    const y = 1.65 + i * 0.98;
    card(s, 2.6, y, 10.18, 0.82, i < 3 ? "FFF4DF" : "EFE8F7", { flat: true, r: 0.12 });
    await iconCircle(s, ic, 11.95, y + 0.08, 0.66, col, "FFFFFF");
    T(s, txt, { x: 4.4, y: y + 0.06, w: 7.4, h: 0.7, fontSize: 21, valign: "middle", bold: true, color: C.text2 });
    s.addText(tag, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: 2.8, y: y + 0.18, w: 1.3, h: 0.46, fill: { color: col }, color: C.background1, fontSize: 14, bold: true, align: "center", valign: "middle", margin: 0 });
  }
  card(s, 0.55, 1.65, 1.8, 4.75, C.text2, { flat: true });
  s.addImage({ data: await icon(lu.LuThermometerSun, HX.accent2), x: 0.95, y: 2.1, w: 1.0, h: 1.0 });
  T(s, "قارني تعليلك: كم سببًا ذكرتِ؟", { x: 0.65, y: 3.3, w: 1.6, h: 2.8, fontSize: 17, color: C.background1, align: "center", bold: true });
  notes(s, {
    time: "دقيقة واحدة",
    goal: "هـ٣",
    say: "قارني ما كتبتِه على سبورتك بهذه الأسباب. ضعي علامة ✓ على كل سبب ذكرتِه، وأضيفي ما فاتك.",
    steps: ["تقيّم كل طالبة تعليلها ذاتيًا (تقويم ذاتي).", "ترفع الطالبات بطاقات إشارة المرور: أخضر/أصفر/أحمر.", "تعيد المعلمة شرح الفكرة لصاحبات البطاقة الحمراء بسؤال من الحياة: «لماذا نشعر بالحر أكثر بالملابس الداكنة؟»"],
    output: "تقويم ذاتي لتعليل الطالبة + مؤشر إشارة المرور للمعلمة.",
    extra: "ورد في الدرس: الملابس القطنية الفاتحة تمتص العرق وتسمح بتهوية الجسم، والألوان الفاتحة تعكس أشعة الشمس. (السببان الخاصان بالشتاء تعزيز علمي مرتبط بالفكرة نفسها).",
  });
});

// ================= 13. سؤال سريع ٢ =================
makeQuestion("q2", "بناء التعلم", {
  title: "سؤال سريع (٢)",
  goal: "هـ٣",
  stem: "نزهة عائلية في عصر يوم صيفي حار… أيّ الاختيارات أنسب؟",
  options: [
    [pi.PiDressFill, "ملابس قطنية بلون داكن", "3B1A4A"],
    [pi.PiDressFill, "ملابس قطنية بلون فاتح", "9ED3EA"],
    [gi.GiWool, "ملابس صوفية بلون فاتح", "E8B96A"],
  ],
  correct: 1,
  nextId: "c45",
  feedback: [
    { head: "اقتربتِ كثيرًا!", body: "القماش القطني اختيار صحيح… لكن فكّري في اللون: أيّ الألوان يعكس أشعة الشمس؟" },
    { head: "أحسنتِ! تعليل علمي", body: "القطن يمتص العرق ويسمح بتهوية الجسم، واللون الفاتح يعكس أشعة الشمس." },
    { head: "فكّري مرة أخرى…", body: "اللون الفاتح مناسب، لكن هل يناسب الصوفُ يومًا صيفيًا حارًا؟ متى نلبس الصوف؟" },
  ],
});

// ================= 14. العمر ولون البشرة =================
S("c45", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "رابعًا: العمر   •   خامسًا: لون البشرة");
  stageTag(s, "عرض المجموعة ٤", C.accent4);
  chips(s, [["هـ١", "goal"], ["هـ٤", "goal"]]);
  // age (right)
  card(s, 6.85, 1.6, 5.93, 5.1, C.background2);
  T(s, "لكل مرحلة عمرية ملابس تناسبها", { x: 7.05, y: 1.8, w: 5.53, h: 0.6, fontSize: 22, bold: true, color: C.text2 });
  const ages = [[pi.PiBaby, "الطفولة"], [fa6.FaChildDress, "الفتاة"], [fa6.FaPersonDress, "الكبيرة"]];
  for (let i = 0; i < 3; i++) {
    const x = 11.05 - i * 1.75;
    await iconCircle(s, ages[i][0], x, 2.6, 1.3 - i * 0, [C.accent1, C.accent4, C.text2][i], "FFFFFF");
    T(s, ages[i][1], { x: x - 0.2, y: 3.95, w: 1.7, h: 0.45, fontSize: 16, bold: true, align: "center", color: C.text2 });
  }
  card(s, 7.05, 4.65, 5.53, 1.85, C.background1, { flat: true });
  T(s, [
    { text: "ناقشي: ", options: { bold: true, color: C.accent1 } },
    { text: "هل يناسب ما ترتديه جدتي طفلةً في الخامسة؟ وهل يناسبني ما كنت أرتديه في الروضة؟ لماذا؟" },
  ], { x: 7.25, y: 4.75, w: 5.13, h: 1.65, fontSize: 17, valign: "middle" });
  // skin tone (left)
  card(s, 0.55, 1.6, 5.93, 5.1, C.background2);
  T(s, "ألوان تنسجم مع لون بشرتي", { x: 0.75, y: 1.8, w: 5.53, h: 0.6, fontSize: 22, bold: true, color: C.text2 });
  const sw = ["E0607E", "F2A93B", "2A9D8F", "7C5CBF", "5B2A6E", "BFE3F2"];
  for (let i = 0; i < 6; i++) {
    s.addShape(SH.OVAL, { x: 5.25 - i * 0.82, y: 2.65, w: 0.68, h: 0.68, fill: { color: sw[i] }, line: { color: "FFFFFF", width: 2.5 }, shadow: shadow() });
  }
  T(s, "نختار من الألوان ما ينسجم مع لون بشرتنا فيُبرز جمالها.", { x: 0.75, y: 3.55, w: 5.53, h: 0.95, fontSize: 18, valign: "middle" });
  card(s, 0.75, 4.65, 5.53, 1.85, C.text2, { flat: true });
  T(s, "كلُّ لون بشرة جميلٌ خلقه الله… والتناسق هو السرّ", { x: 0.95, y: 4.75, w: 5.13, h: 1.65, fontSize: 19, bold: true, color: C.background1, valign: "middle", align: "center" });
  notes(s, {
    time: "دقيقتان",
    goal: "هـ١، هـ٤",
    strategy: "تعلّم الأقران + نقاش",
    say: "خبيرات المجموعة الرابعة سيحدثننا عن معيارين: العمر، ولون البشرة.",
    steps: ["تعرض المجموعة ٤ بطاقة الخبيرة.", "سؤال النقاش على الشريحة (٣ إجابات مع التبرير).", "تؤكد المعلمة قيمة تقبّل الذات: لا يوجد لون بشرة أجمل من آخر، وإنما نبحث عن التناسق."],
    teacher: "تدير النقاش وتعزز تقدير الذات والرضا بخلق الله.",
    student: "تقارن بين المراحل العمرية وتربط بخبرتها الشخصية.",
    output: "تشرح الطالبة لماذا تختلف الملابس باختلاف العمر.",
    extra: "اقتصرت الشريحة على المبدأ العام. إن تضمّن كتابك أمثلة محددة للألوان المناسبة لكل لون بشرة، فأضيفيها من الكتاب نصًّا.",
  });
});

// ================= 15. القوام =================
S("c6", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "سادسًا: القوام");
  stageTag(s, "عرض المجموعة ٥", C.text2);
  chips(s, [["هـ١", "goal"], ["هـ٤", "goal"]]);
  const figs = [
    ["h", "القوام الطويل النحيف", "تناسبه الخطوط الأفقية", C.accent1],
    ["v", "القوام القصير", "تناسبه الخطوط الطولية ليبدو أطول", C.accent3],
    ["s", "القوام الممتلئ", "تناسبه الخطوط الطولية والنقوش الصغيرة، ويبتعد عن الخطوط الأفقية", C.accent4],
  ];
  for (let i = 0; i < 3; i++) {
    const [k, name, desc, col] = figs[i];
    const x = W - 0.55 - 3.85 - i * 4.19;
    card(s, x, 1.55, 3.85, 4.3, C.background2);
    s.addImage({ data: await art.png(art.figureSVG(k, P), 520), x: x + 0.95, y: 1.7, w: 1.95, h: 1.95 * 340 / 260 });
    T(s, name, { x: x + 0.15, y: 4.3, w: 3.55, h: 0.5, fontSize: 19, bold: true, align: "center", color: col });
    T(s, desc, { x: x + 0.15, y: 4.8, w: 3.55, h: 0.95, fontSize: 16, align: "center" });
  }
  card(s, 0.55, 6.05, 12.23, 0.75, C.text2, { flat: true });
  T(s, "كلُّ قوامٍ جميل… نختار ما يمنحنا التناسق والراحة، لا ما يجعلنا نقارن أنفسنا بغيرنا", { x: 0.8, y: 6.08, w: 11.73, h: 0.7, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle" });
  notes(s, {
    time: "دقيقة ونصف",
    goal: "هـ١، هـ٤",
    say: "الخطوط في القماش تخدع العين! الخطوط الطولية تجعل الجسم يبدو أطول، والأفقية تجعله يبدو أعرض.",
    steps: ["تعرض المجموعة ٥ الجزء الأول من بطاقتها (القوام).", "تشير المعلمة إلى الرسوم الثلاثة وتسأل: «أيّ رسم يبدو أطول؟ ولماذا؟»", "تؤكد قيمة تقبّل الذات والبعد عن السخرية من أشكال الآخرين."],
    teacher: "تقدّم المعيار بلغة إيجابية تحفظ مشاعر الطالبات.",
    student: "تربط نوع الخطوط بالقوام المناسب له.",
    output: "تحدد الطالبة نوع الخطوط المناسب لكل قوام.",
    extra: "يستخدم الكتاب مصطلح «القوام البدين»؛ استُخدم هنا لفظ «الممتلئ» مراعاةً لمشاعر الطالبات، والمعلومة نفسها كما وردت في الكتاب.",
  });
});

// ================= 16. سؤال سريع ٣ =================
makeQuestion("q3", "بناء التعلم", {
  title: "سؤال سريع (٣)",
  goal: "هـ٤",
  stem: "ريم قوامها طويل نحيف، وتريد ثوبًا جديدًا… أيّ نقشة تنصحينها بها؟",
  options: [
    [lu.LuAlignJustify, "خطوط أفقية"],
    [lu.LuColumns3, "خطوط طولية"],
    [lu.LuShuffle, "لا فرق، كل النقشات متشابهة"],
  ],
  correct: 0,
  nextId: "c7",
  feedback: [
    { head: "أحسنتِ يا مستشارة!", body: "الخطوط الأفقية تناسب القوام الطويل النحيف، وتمنح الجسم مظهرًا متناسقًا." },
    { head: "فكّري مرة أخرى…", body: "تلميح: الخطوط الطولية تجعل الجسم يبدو أطول… هل تحتاج ريم أن تبدو أطول؟" },
    { head: "فكّري مرة أخرى…", body: "تلميح: الخطوط تخدع العين! تذكّري الرسوم الثلاثة في شريحة القوام." },
  ],
});

// ================= 17. المناسبة =================
S("c7", "بناء التعلم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "سابعًا: المناسبة");
  stageTag(s, "عرض المجموعة ٥", C.text2);
  chips(s, [["هـ٤", "goal"], ["لعبة التوصيل", "st"], ["السبورة الصغيرة", "st"]]);
  const occ = [
    ["١", "المدرسة", lu.LuSchool],
    ["٢", "الصلاة", fa6.FaMosque],
    ["٣", "حصة التربية البدنية", fa6.FaPersonRunning],
    ["٤", "حفل زواج", lu.LuPartyPopper],
    ["٥", "النوم", lu.LuMoon],
  ];
  const outf = [
    ["أ", "ملابس نوم قطنية مريحة"],
    ["ب", "الزيّ المدرسي الرسمي"],
    ["ج", "زيّ رياضي وحذاء رياضي"],
    ["د", "فستان أنيق محتشم للمناسبات"],
    ["هـ", "لباس صلاة واسع ساتر"],
  ];
  T(s, "المناسبة", { x: 8.4, y: 1.55, w: 4.38, h: 0.45, fontSize: 18, bold: true, color: C.accent1, align: "center" });
  T(s, "الملبس", { x: 0.55, y: 1.55, w: 4.9, h: 0.45, fontSize: 18, bold: true, color: C.accent3, align: "center" });
  for (let i = 0; i < 5; i++) {
    const y = 2.05 + i * 0.9;
    card(s, 8.4, y, 4.38, 0.75, C.accent5, { flat: true, r: 0.12 });
    s.addText(occ[i][0], { ...AR, shape: SH.OVAL, x: 12.05, y: y + 0.1, w: 0.55, h: 0.55, fill: { color: C.accent1 }, color: C.background1, bold: true, fontSize: 16, align: "center", valign: "middle", margin: 0 });
    s.addImage({ data: await icon(occ[i][2], HX.dk2), x: 11.4, y: y + 0.17, w: 0.42, h: 0.42 });
    T(s, occ[i][1], { x: 8.55, y: y + 0.05, w: 2.75, h: 0.65, fontSize: 18, bold: true, valign: "middle", color: C.text2 });
    card(s, 0.55, y, 4.9, 0.75, C.accent6, { flat: true, r: 0.12 });
    s.addText(outf[i][0], { ...AR, shape: SH.OVAL, x: 4.75, y: y + 0.1, w: 0.55, h: 0.55, fill: { color: C.accent3 }, color: C.background1, bold: true, fontSize: 16, align: "center", valign: "middle", margin: 0 });
    T(s, outf[i][1], { x: 0.7, y: y + 0.05, w: 3.95, h: 0.65, fontSize: 18, valign: "middle" });
  }
  s.addImage({ data: await icon(lu.LuArrowLeftRight, HX.accent1), x: 6.2, y: 3.4, w: 1.4, h: 1.4 });
  T(s, "اكتبي التوصيل على سبورتك الصغيرة (مثال: ١ – ب)… ثم ارفعيها عند الإشارة", { x: 0.55, y: 6.6, w: 12.23, h: 0.4, fontSize: 15, color: "6B5A75", align: "center" });
  notes(s, {
    time: "دقيقتان",
    goal: "هـ٤",
    strategy: "لعبة التوصيل + الاستجابة الجماعية بالسبورة الصغيرة",
    say: "الآن المجموعة الخامسة ستتحدى الصف كله! صِلي كل مناسبة بالملبس المناسب لها… ثلاث، اثنان، واحد… ارفعن السبورات!",
    steps: ["تعرض المجموعة ٥ الجزء الثاني من بطاقتها (المناسبة).", "تكتب كل طالبة التوصيلات الخمسة على سبورتها الصغيرة (٤٥ ثانية).", "ترفع الطالبات السبورات في وقت واحد؛ فتمسح المعلمة الصف بنظرة سريعة وتحدد نسبة الإتقان.", "تُناقش أكثر توصيلة وقع فيها خطأ."],
    teacher: "تقيس فهم جميع الطالبات في لحظة واحدة وتقدّم تغذية راجعة مباشرة.",
    student: "تطبّق معيار المناسبة وتبرّر توصيلها عند الطلب.",
    output: "سبورات الطالبات (دليل فردي على تحقق الهدف).",
    answers: "١–ب، ٢–هـ، ٣–ج، ٤–د، ٥–أ",
  });
});

// ================= 18. النشاط التطبيقي =================
S("apply", "التطبيق والتمايز", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "تحدّي «مستشارة الأناقة»");
  stageTag(s, "نشاط تطبيقي  •  ٧ دقائق", C.accent1);
  chips(s, [["هـ٤", "goal"], ["هـ٢", "goal"], ["حل المشكلات", "st"], ["اتخاذ القرار", "st"]]);
  T(s, "وصلت إلى مكتبكن «طلبات استشارة» من فتيات في عمركن:", { x: 4.5, y: 1.5, w: 8.28, h: 0.5, fontSize: 18, bold: true, color: C.text2 });
  const req = [
    ["١", "زيارة جدتي في أبها في ليلة شتوية ممطرة", lu.LuCloudRain, C.accent4],
    ["٢", "احتفال مدرستي بيوم التأسيس", lu.LuLandmark || fa6.FaLandmarkFlag, C.accent2],
    ["٣", "نزهة عائلية على الكورنيش في عصر يوم صيفي حار", lu.LuSun, C.accent1],
    ["٤", "صلاة العيد في المصلى صباح يوم شتوي", fa6.FaMosque, C.accent3],
    ["٥", "حضور حفل زواج قريبتي", lu.LuPartyPopper, C.text2],
  ];
  for (let i = 0; i < 5; i++) {
    const [n, txt, ic, col] = req[i];
    const x = W - 0.55 - 2.29 - i * 2.485;
    card(s, x, 2.1, 2.29, 2.35, C.background2);
    s.addText("طلب " + n, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: x + 0.15, y: 2.25, w: 1.05, h: 0.38, fill: { color: col }, color: C.background1, fontSize: 13, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addImage({ data: await icon(ic, HX.dk2), x: x + 1.55, y: 2.22, w: 0.5, h: 0.5 });
    T(s, txt, { x: x + 0.1, y: 2.8, w: 2.09, h: 1.55, fontSize: 16, align: "center", valign: "middle", bold: true, color: C.text2 });
  }
  const steps = [
    ["اقرئي", "طلب الاستشارة جيدًا"],
    ["اختاري", "٣ قطع من «خزانة المجموعة»"],
    ["برّري", "بمعيارين على الأقل في بطاقة التبرير"],
    ["اعرضي", "إطلالتكن في ٤٥ ثانية"],
  ];
  for (let i = 0; i < 4; i++) {
    const x = W - 0.55 - 2.85 - i * 3.13;
    card(s, x, 4.75, 2.85, 1.95, C.text2, { flat: true });
    s.addText(String.fromCharCode(0x661 + i), { ...AR, shape: SH.OVAL, x: x + 2.1, y: 4.9, w: 0.55, h: 0.55, fill: { color: C.accent2 }, color: C.text2, bold: true, fontSize: 17, align: "center", valign: "middle", margin: 0 });
    T(s, steps[i][0], { x: x + 0.15, y: 4.9, w: 1.9, h: 0.55, fontSize: 21, bold: true, color: C.background1, valign: "middle" });
    T(s, steps[i][1], { x: x + 0.15, y: 5.55, w: 2.55, h: 1.0, fontSize: 16, color: C.background1 });
  }
  notes(s, {
    time: "٧ دقائق (٤ للعمل + ٣ للعرض والتجوال)",
    goal: "هـ٤ (رئيس)، هـ٢، هـ٣",
    strategy: "حل المشكلات + اتخاذ القرار + التعلم التعاوني",
    say: "أنتنّ الآن «مستشارات أناقة» محترفات! وصل لكل مجموعة طلب استشارة من فتاة تحتار ماذا تلبس. مهمتكن: اختيار إطلالة مناسبة وتبريرها بمعايير صحيحة، كما يفعل المستشار الحقيقي.",
    steps: ["تتسلّم كل مجموعة ظرفًا فيه: طلب الاستشارة + «خزانة المجموعة» (١٢ بطاقة مصورة لقطع ملابس متنوعة؛ بعضها مناسب وبعضها مقصود أنه غير مناسب) + بطاقة التبرير.", "تختار المجموعة ٣ قطع وتلصقها على لوحة «إطلالتنا».", "تكتب المقررة بطاقة التبرير: «اخترنا… لأنّ… والمعيار هو…» بمعيارين على الأقل.", "تعرض المتحدثة في ٤٥ ثانية، وتقيّم المجموعات الأخرى بـ«نجمتان وأمنية».", "تستخدم المعلمة سلّم التقدير (الشريحة التالية) أثناء التجوال."],
    teacher: "ميسّرة: تتجول، تسأل «لماذا استبعدتنّ هذه القطعة؟»، وتوثّق الأداء بسلم التقدير، ولا تتدخل في القرار.",
    student: "تحلل الموقف، وتقارن البدائل، وتتخذ القرار، وتبرّره، وتقيّم عمل زميلاتها.",
    output: "لوحة إطلالة + بطاقة تبرير مكتوبة لكل مجموعة (دليل ملموس قابل للقياس بسلّم التقدير).",
    answers: "١) ملابس صوفية دافئة داكنة ومعطف وحذاء مغلق — الموسم والمناسبة.  ٢) زيّ تراثي محتشم — العادات والتقاليد والهوية.  ٣) ملابس قطنية فاتحة واسعة — الموسم واللباس الشرعي.  ٤) لباس واسع ساتر دافئ — اللباس الشرعي والموسم.  ٥) فستان أنيق محتشم يناسب الموسم — المناسبة واللباس الشرعي.",
  });
});

// ================= 19. بطاقة التبرير وسلم التقدير =================
S("rubric", "التطبيق والتمايز", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "بطاقة التبرير وسلّم التقدير");
  stageTag(s, "معايير النجاح", C.accent1);
  chips(s, [["هـ٤", "goal"], ["تقويم الأقران", "st"]]);
  // justification card (right)
  card(s, 8.6, 1.6, 4.18, 5.1, C.accent5);
  s.addImage({ data: await icon(lu.LuTag, HX.accent1), x: 12.0, y: 1.75, w: 0.55, h: 0.55 });
  T(s, "بطاقة التبرير", { x: 8.8, y: 1.75, w: 3.1, h: 0.55, fontSize: 21, bold: true, color: C.text2, valign: "middle" });
  T(s, [
    { text: "اخترنا:", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "……………………………", options: { breakLine: true } },
    { text: "لأنّ:", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "……………………………", options: { breakLine: true } },
    { text: "المعيار:", options: { bold: true, color: C.accent1, breakLine: true } },
    { text: "……………………………" },
  ], { x: 8.8, y: 2.45, w: 3.78, h: 3.2, fontSize: 18, paraSpaceAfter: 4 });
  card(s, 8.8, 5.75, 3.78, 0.8, C.background1, { flat: true });
  T(s, "نجمتان وأمنية: لتقويم عمل زميلاتك", { x: 8.9, y: 5.8, w: 3.58, h: 0.7, fontSize: 15, bold: true, align: "center", valign: "middle", color: C.text2 });
  // rubric table (left)
  const hdr = (t, fill) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: fill }, align: "center", valign: "middle", ...AR } });
  const cell = (t, o = {}) => ({ text: t, options: { align: "right", valign: "middle", ...AR, ...o } });
  const rows = [
    [hdr("بحاجة إلى دعم (١)", HX.accent1), hdr("متمكنة (٢)", HX.accent2), hdr("متميزة (٣)", HX.accent3), hdr("المعيار", HX.dk2)],
    [cell("قطعة غير محتشمة"), cell("محتشمة مع ملاحظة"), cell("كل القطع ساترة وواسعة"), cell("اللباس الشرعي", { bold: true, fill: { color: HX.lt2 } })],
    [cell("لا تناسب الطقس"), cell("تناسب جزئيًا"), cell("القماش واللون يناسبان الطقس"), cell("الموسم", { bold: true, fill: { color: HX.lt2 } })],
    [cell("لا تناسب المناسبة"), cell("تناسب جزئيًا"), cell("تناسب المناسبة تمامًا"), cell("المناسبة", { bold: true, fill: { color: HX.lt2 } })],
    [cell("اختيار بلا تبرير"), cell("تبرير بمعيار واحد"), cell("تبرير بمعيارين أو أكثر"), cell("قوة التبرير", { bold: true, fill: { color: HX.lt2 } })],
  ];
  s.addTable(rows, { x: 0.55, y: 1.6, w: 7.8, colW: [1.85, 1.85, 2.3, 1.8], rowH: [0.75, 1.0, 1.0, 1.0, 1.0], fontSize: 15, color: HX.dk1, border: { type: "solid", color: "E6D5EC", pt: 1 }, fontFace: "Arial" });
  T(s, "المجموع من ١٢  •  تُقدِّر المعلمة وتُقدِّر المجموعات بعضها بعضًا", { x: 0.55, y: 6.4, w: 7.8, h: 0.35, fontSize: 14, color: "6B5A75", align: "center" });
  notes(s, {
    time: "تُعرض أثناء النشاط التطبيقي",
    goal: "هـ٤",
    strategy: "معايير نجاح معلنة + تقويم الأقران",
    say: "قبل أن تبدأن، هذه معايير نجاحكن. المستشارة المتميزة هي التي تبرّر اختيارها بمعيارين على الأقل.",
    steps: ["تُعرض الشريحة قبل بدء العمل لتعرف الطالبات معايير الحكم مسبقًا.", "بعد العروض: تكتب كل مجموعة لمجموعة أخرى «نجمتين» (نقطتي قوة) و«أمنية» (اقتراح تحسين) على ورقة لاصقة.", "تسجل المعلمة درجة كل مجموعة في سلم التقدير (من ١٢)."],
    output: "درجة كل مجموعة في سلم التقدير + أوراق تقويم الأقران.",
  });
});

// ================= 20. التمايز =================
S("diff", "التطبيق والتمايز", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "اختاري تحدّيك!");
  stageTag(s, "التمايز  •  ٤ دقائق", C.accent2);
  chips(s, [["مراعاة الفروق الفردية", "st"], ["هـ١", "goal"], ["هـ٣", "goal"], ["هـ٤", "goal"]]);
  const lv = [
    ["⭐", "أنطلق", "صِلي كل قطعة ملابس بالفصل أو المناسبة المناسبة لها (بطاقات مصوّرة: ٤ توصيلات).", "تذكّر وفهم", C.accent3, "E7F6F4"],
    ["⭐⭐", "أتقدّم", "أكملي الجدول: القطعة ← مناسبة أو غير مناسبة ← المعيار ← السبب.", "تطبيق وتحليل", C.accent2, "FFF4DF"],
    ["⭐⭐⭐", "أتألّق", "خطّطي «حقيبة ذكية» لرحلة شتوية مدتها ٣ أيام فيها مناسبة عائلية، بـ٦ قطع فقط، وبرّري كل قطعة بمعيارين.", "تقويم وإبداع", C.accent1, "FCE9EE"],
  ];
  for (let i = 0; i < 3; i++) {
    const [st, name, task, lvl, col, bg] = lv[i];
    const x = W - 0.55 - 3.85 - i * 4.19;
    card(s, x, 1.6, 3.85, 4.4, bg);
    T(s, st, { x: x + 0.2, y: 1.75, w: 3.45, h: 0.55, fontSize: 24, align: "center" });
    T(s, name, { x: x + 0.2, y: 2.3, w: 3.45, h: 0.65, fontSize: 28, bold: true, align: "center", color: col });
    T(s, task, { x: x + 0.25, y: 3.05, w: 3.35, h: 2.1, fontSize: 17, align: "right" });
    s.addText(lvl, { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: x + 0.8, y: 5.35, w: 2.25, h: 0.45, fill: { color: col }, color: C.background1, fontSize: 14, bold: true, align: "center", valign: "middle", margin: 0 });
  }
  card(s, 0.55, 6.2, 12.23, 0.6, C.accent6, { flat: true });
  T(s, "ابدئي بالمستوى الذي يناسبك… ومتى أنجزتِه انتقلي إلى التحدي الأعلى", { x: 0.8, y: 6.22, w: 11.73, h: 0.56, fontSize: 18, bold: true, color: C.accent3, align: "center", valign: "middle" });
  notes(s, {
    time: "٤ دقائق",
    goal: "هـ١، هـ٣، هـ٤",
    strategy: "التعليم المتمايز (بحسب الاستعداد مع حرية الاختيار)",
    say: "لكل واحدة منكن تحدٍّ يناسبها. اختاري ورقتك، وإن أنهيتِها مبكرًا فانتقلي إلى التحدي التالي.",
    steps: ["أوراق المستويات الثلاثة بألوان مختلفة على طاولة جانبية.", "توجّه المعلمة بلطف — بناءً على نتائج الأسئلة السريعة وإشارات المرور — بعضَ الطالبات إلى المستوى المناسب، مع ترك حرية الاختيار.", "المستوى ⭐ مدعوم بالصور وبنك كلمات، والمستوى ⭐⭐⭐ مفتوح يتطلب إنتاجًا وتبريرًا.", "تجلس المعلمة دقيقتين مع طالبات المستوى ⭐ لتقديم دعم مباشر."],
    teacher: "تشخّص وتوجّه وتدعم الطالبات المحتاجات، وتتحدى المتميزات.",
    student: "تختار مستوى تحديها، وتعمل باستقلالية، وتتقدّم لمستوى أعلى.",
    output: "ورقة عمل مكتملة لكل طالبة بمستواها (دليل فردي).",
  });
});

// ================= 21. التقويم الختامي =================
S("summative", "التقويم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "موقف ختامي: دعوة لمى");
  stageTag(s, "التقويم الختامي  •  ٤ دقائق", C.text2);
  chips(s, [["هـ٤", "goal"], ["هـ٣", "goal"], ["هـ١", "goal"], ["عمل فردي", "st"]]);
  card(s, 6.85, 1.6, 5.93, 3.0, C.text2);
  await iconCircle(s, lu.LuMail, 11.6, 1.85, 0.95, C.accent2, "FFFFFF");
  T(s, [
    { text: "دُعيت لمى إلى عشاء عائلي في ليلة شتوية باردة.", options: { breakLine: true } },
    { text: "فاختارت: فستانًا قطنيًا خفيفًا بلون فاتح، وحذاءً رياضيًا." },
  ], { x: 7.05, y: 1.85, w: 4.45, h: 2.6, fontSize: 20, color: C.background1, valign: "middle", paraSpaceAfter: 10, bold: true });
  const tasks = [
    ["١", "ما المعياران اللذان لم تراعهما لمى؟"],
    ["٢", "اقترحي عليها إطلالة بديلة."],
    ["٣", "برّري اقتراحك بمعيارين على الأقل."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.0;
    card(s, 0.55, y, 6.05, 0.85, C.background2, { flat: true, r: 0.12 });
    s.addText(tasks[i][0], { ...AR, shape: SH.OVAL, x: 5.85, y: y + 0.12, w: 0.6, h: 0.6, fill: { color: C.accent1 }, color: C.background1, bold: true, fontSize: 17, align: "center", valign: "middle", margin: 0 });
    T(s, tasks[i][1], { x: 0.75, y: y + 0.08, w: 5.0, h: 0.7, fontSize: 19, valign: "middle" });
  }
  card(s, 0.55, 4.85, 12.23, 1.9, C.accent6, { flat: true });
  T(s, "أتحقق من نجاحي:", { x: 9.3, y: 4.95, w: 3.28, h: 0.5, fontSize: 19, bold: true, color: C.accent3 });
  const crit = ["حدّدتُ المعيارين بدقة", "اقترحتُ بديلًا مناسبًا", "برّرتُ بمعيارين على الأقل"];
  for (let i = 0; i < 3; i++) {
    const x = W - 0.75 - 3.9 - i * 3.95;
    s.addImage({ data: await icon(lu.LuSquareCheckBig, HX.accent3), x: x + 3.3, y: 5.6, w: 0.5, h: 0.5 });
    T(s, crit[i], { x, y: 5.5, w: 3.2, h: 0.7, fontSize: 17, valign: "middle", bold: true, color: C.text2 });
  }
  notes(s, {
    time: "٤ دقائق",
    goal: "هـ٤ (رئيس)، هـ٣، هـ١",
    strategy: "تقويم أدائي فردي قائم على موقف حياتي",
    say: "الآن كل واحدة منكن مستشارة بمفردها. لمى تحتاج مساعدتك! أجيبي في ورقة التقويم الختامي.",
    steps: ["تعمل كل طالبة بمفردها على ورقة التقويم الختامي (٣ دقائق).", "تتحقق الطالبة من نجاحها بقائمة «أتحقق من نجاحي» (تقويم ذاتي).", "تعرض طالبتان إجابتيهما، وتصحح المعلمة عبر قائمة رصد سريعة.", "تجمع المعلمة الأوراق لتحليلها بعد الحصة."],
    teacher: "تراقب الأداء الفردي، وترصد في قائمة الرصد مستوى كل طالبة في هـ٤.",
    student: "توظّف ما تعلّمته في موقف جديد: تحلل، وتقترح، وتبرّر.",
    output: "ورقة تقويم ختامي فردية لكل طالبة.",
    answers: "١) الموسم (القطن الخفيف لا يناسب ليلة شتوية باردة) والمناسبة (الحذاء الرياضي لا يناسب العشاء العائلي).  ٢) فستان محتشم من قماش دافئ بلون داكن، مع معطف أو جاكيت وحذاء أنيق مغلق.  ٣) الصوف والألوان الداكنة تحفظ دفء الجسم (الموسم)، والإطلالة الأنيقة تناسب العشاء العائلي (المناسبة)، والفستان ساتر واسع (اللباس الشرعي).",
  });
});

// ================= 22. بطاقة الخروج =================
S("exit", "التقويم", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "بطاقة الخروج");
  stageTag(s, "بطاقة الخروج  •  ٣ دقائق", C.accent1);
  chips(s, [["هـ١", "goal"], ["هـ٣", "goal"], ["هـ٤", "goal"], ["هـ٥", "goal"]]);
  // ticket body
  card(s, 3.2, 1.55, 9.58, 5.2, C.background2);
  s.addShape(SH.OVAL, { x: 12.3, y: 1.8, w: 0.28, h: 0.28, fill: { color: C.background1 }, line: { color: "E6D5EC", width: 1 } });
  const qs = [
    ["هـ١", "اذكري ثلاثة من معايير اختيار الملابس."],
    ["هـ٣", "علّلي: نفضّل الملابس القطنية الفاتحة في الصيف."],
    ["هـ٤", "اختاري ما ترتدينه في حفل اليوم الوطني بالمدرسة، وبرّري اختيارك بمعيار."],
    ["هـ٥", "أكملي: أعتزّ بلباسي المحتشم لأنّ…"],
  ];
  for (let i = 0; i < 4; i++) {
    const y = 1.85 + i * 1.18;
    s.addText(qs[i][0], { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.15, x: 11.35, y: y + 0.1, w: 0.85, h: 0.42, fill: { color: C.accent5 }, color: C.text2, fontSize: 13, bold: true, align: "center", valign: "middle", margin: 0 });
    T(s, (i + 1).toLocaleString("ar-SA") + ". " + qs[i][1], { x: 3.45, y, w: 7.8, h: 0.6, fontSize: 19, bold: true, color: C.text2, valign: "middle" });
    s.addShape(SH.LINE, { x: 3.6, y: y + 0.95, w: 7.6, h: 0, line: { color: "D9C6E0", width: 1, dashType: "dash" } });
  }
  // confidence (left)
  card(s, 0.55, 1.55, 2.4, 5.2, C.text2);
  T(s, "مدى ثقتي:", { x: 0.65, y: 1.7, w: 2.2, h: 0.5, fontSize: 18, bold: true, color: C.background1, align: "center" });
  const conf = [["2A9D8F", "أستطيع أن أشرح لغيري"], ["F2A93B", "فهمت وأحتاج تدريبًا"], ["E0607E", "أحتاج مساعدة"]];
  for (let i = 0; i < 3; i++) {
    const y = 2.35 + i * 1.45;
    s.addShape(SH.OVAL, { x: 1.4, y, w: 0.7, h: 0.7, fill: { color: conf[i][0] }, line: { color: "FFFFFF", width: 2 } });
    T(s, conf[i][1], { x: 0.65, y: y + 0.72, w: 2.2, h: 0.62, fontSize: 14, color: C.background1, align: "center", bold: true });
  }
  notes(s, {
    time: "٣ دقائق",
    goal: "هـ١، هـ٣، هـ٤، هـ٥",
    strategy: "بطاقة الخروج (Exit Ticket) + التقويم الذاتي",
    say: "قبل أن تغادرن، أريد أن أعرف ماذا تعلمت كل واحدة منكن. أجيبي عن بطاقة الخروج، ولوّني دائرة ثقتك بصدق، فهذا يساعدني على مساعدتك.",
    steps: ["توزَّع بطاقة خروج مطبوعة بحجم ربع ورقة (أو تُعرض عبر نموذج إلكتروني على منصة مدرستي إن توفرت الأجهزة).", "تجيب الطالبة فرديًا وتلوّن دائرة ثقتها.", "تسلّم الطالبة البطاقة عند الباب في أحد ثلاثة صناديق ملونة (أخضر/أصفر/أحمر) بحسب ثقتها.", "بعد الحصة: تفرز المعلمة البطاقات لتحديد جوانب القوة والاحتياج، وتخطط لبداية الحصة القادمة (إثراء للأخضر، تدريب للأصفر، دعم فردي للأحمر)."],
    teacher: "تحلل البطاقات وتستخدم نتائجها في التخطيط العلاجي والإثرائي.",
    student: "تقيّم تعلّمها ذاتيًا وتحدد احتياجها بصدق.",
    output: "بطاقة خروج لكل طالبة تقيس ٤ أهداف + مؤشر ثقة ذاتي.",
    answers: "١) أي ثلاثة من: اللباس الشرعي، العادات والتقاليد، الموسم، العمر، لون البشرة، القوام، المناسبة.  ٢) القطن يمتص العرق ويسمح بتهوية الجسم، واللون الفاتح يعكس أشعة الشمس.  ٣) زيّ تراثي/وطني محتشم — معيار العادات والتقاليد أو المناسبة.  ٤) إجابة مفتوحة تعبّر عن قيمة (طاعة لله، ستر وجمال، هوية).",
  });
});

// ================= 23. الختام =================
S("close", "الختام", async (sec) => {
  const s = newSlide("DARK", sec);
  T(s, "نعود إلى سؤالنا الكبير", { x: 1.0, y: 0.55, w: 11.33, h: 0.5, fontSize: 18, color: C.accent5, align: "center" });
  T(s, "كيف أختار ملابس تناسبني، وتناسب الموقف، وتُرضي ربّي؟", { x: 0.8, y: 1.0, w: 11.73, h: 0.9, fontSize: 28, bold: true, color: C.background1, align: "center", valign: "middle" });
  const keys = ["اللباس الشرعي", "العادات والتقاليد", "الموسم", "العمر", "لون البشرة", "القوام", "المناسبة"];
  const cw = 1.6, gap = 0.12;
  let x = W / 2 + (keys.length * cw + (keys.length - 1) * gap) / 2;
  for (let i = 0; i < keys.length; i++) {
    x -= cw;
    s.addText(keys[i], { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y: 2.2, w: cw, h: 0.5, fill: { color: "4A2259" }, color: C.accent2, fontSize: 15, bold: true, align: "center", valign: "middle", margin: 0 });
    x -= gap;
  }
  card(s, 6.85, 3.0, 5.93, 3.35, "4A2259", { flat: true });
  s.addImage({ data: await icon(lu.LuHeart, HX.accent1), x: 9.47, y: 3.2, w: 0.7, h: 0.7 });
  T(s, "«إنّ الله جميلٌ يحبُّ الجمال»", { x: 7.05, y: 4.0, w: 5.53, h: 0.9, fontSize: 28, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: "Traditional Arabic" });
  T(s, "رواه مسلم", { x: 7.05, y: 4.9, w: 5.53, h: 0.4, fontSize: 14, color: C.accent5, align: "center" });
  T(s, "جمالُ المظهر يكتمل بالحشمة والذوق والاعتدال", { x: 7.05, y: 5.4, w: 5.53, h: 0.7, fontSize: 17, color: C.accent2, align: "center" });
  card(s, 0.55, 3.0, 5.93, 3.35, C.background1);
  await iconCircle(s, lu.LuHouse, 5.4, 3.2, 0.85, C.accent3, "FFFFFF");
  T(s, "مهمتي مع أسرتي", { x: 0.75, y: 3.25, w: 4.5, h: 0.6, fontSize: 22, bold: true, color: C.text2, valign: "middle" });
  T(s, "أرتّب مع والدتي ركنًا من خزانتي بحسب المواسم والمناسبات، وأشارك صورته مع جملة تبرير في منصة مدرستي.", { x: 0.75, y: 4.05, w: 5.53, h: 2.1, fontSize: 18 });
  notes(s, {
    time: "دقيقة واحدة",
    goal: "هـ٥ + تلخيص جميع الأهداف",
    say: "لنُجب الآن عن سؤالنا الكبير… (تستقبل المعلمة ٢–٣ إجابات). قال رسول الله ﷺ: «إن الله جميل يحب الجمال». فالجمال الحقيقي أن نختار بوعي، ونلتزم بقيمنا، ونعتز بهويتنا.",
    steps: ["تجيب طالبتان عن السؤال الكبير بجملة تجمع ٣ معايير على الأقل (دليل على التحول في الفهم مقارنة بإجاباتهن في التهيئة).", "تعود المعلمة إلى ملاحظات حقيبة جود على السبورة: «ماذا نضيف إلى حقيبتها الآن؟»", "تشرح المهمة الأسرية (توظيف منصة مدرستي لنشر الناتج)."],
    teacher: "تلخّص بمشاركة الطالبات وتربط التعلم بالحياة والقيم.",
    student: "تُجيب عن السؤال الكبير وتنقل التعلم إلى بيتها.",
    output: "إجابات الطالبات عن السؤال الكبير + صور المهمة الأسرية لاحقًا.",
    extra: "الحديث: «إن الله جميل يحب الجمال» — أخرجه مسلم في صحيحه.",
  });
});

// ================= 24. ملحق: مصفوفة المواءمة =================
S("matrix", "ملحق المعلمة", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "مصفوفة المواءمة");
  stageTag(s, "ملحق المعلمة", C.text2);
  const h = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HX.dk2 }, align: "center", valign: "middle", ...AR } });
  const c = (t, o = {}) => ({ text: t, options: { align: "right", valign: "middle", ...AR, ...o } });
  const g = (t) => c(t, { bold: true, color: HX.dk2, fill: { color: HX.accent5 } });
  const rows = [
    [h("الدليل الملموس"), h("أداة التقويم"), h("النشاط"), h("الهدف")],
    [c("لوحة «أسرار الاختيار» • بطاقة الخروج س١"), c("ملاحظة • بطاقة الخروج"), c("الاستكشاف • رحلة الخبيرات • خريطة المعايير"), g("هـ١ أعدّد معايير اختيار الملابس")],
    [c("نسبة الإجابات الصحيحة في السؤال ١"), c("سؤال تفاعلي بتغذية راجعة فورية"), c("عرض المجموعة ١ • الآية الكريمة"), g("هـ٢ أحدّد شروط اللباس الشرعي")],
    [c("السبورات الصغيرة • السؤال ٢ • بطاقة الخروج س٢"), c("تقويم ذاتي • إشارة المرور • سؤال تفاعلي"), c("فكّري – زاوجي – شاركي (الموسم)"), g("هـ٣ أعلّل اختيار القماش واللون")],
    [c("بطاقات التبرير • ورقة الموقف الختامي • التمايز"), c("سلّم تقدير • تقويم الأقران • قائمة رصد"), c("مستشارة الأناقة • التوصيل • التمايز • موقف لمى"), g("هـ٤ أختار وأبرّر وفق المعايير")],
    [c("إجابات الحوار • بطاقة الخروج س٤ • المهمة الأسرية"), c("ملاحظة • سؤال مفتوح"), c("حوار الزي الوطني • الآية والحديث"), g("هـ٥ أعتزّ باللباس المحتشم والزي الوطني")],
  ];
  s.addTable(rows, { x: 0.55, y: 1.55, w: 12.23, colW: [3.3, 3.0, 3.0, 2.93], rowH: [0.55, 0.88, 0.88, 0.88, 0.88, 0.88], fontSize: 15, color: HX.dk1, border: { type: "solid", color: "E6D5EC", pt: 1 }, fontFace: "Arial" });
  T(s, "كل هدف له نشاط يحققه وأداة تقيسه ودليل يمكن للزائرة الاطلاع عليه", { x: 0.55, y: 6.55, w: 12.23, h: 0.4, fontSize: 15, color: "6B5A75", align: "center" });
  notes(s, {
    extra: "شريحة مرجعية للمعلمة والمقوّمة الخارجية (تُعرض عند الطلب، ويُفضّل طباعتها ضمن ملف تحضير الدرس). تُظهر اتساق الأهداف والأنشطة والتقويم، وتحدد الدليل الملموس على تعلّم الطالبات لكل هدف.",
  });
});

// ================= 25. ملحق: الخطة الزمنية =================
S("timeline", "ملحق المعلمة", async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "خطة الحصة الزمنية (٤٥ دقيقة)");
  stageTag(s, "ملحق المعلمة", C.text2);
  const st = [
    ["التهيئة", 3, C.accent1], ["الاستكشاف", 4, C.accent3], ["الأهداف", 1, C.text2],
    ["بناء التعلم", 18, C.accent4], ["التطبيق", 7, C.accent1], ["التمايز", 4, C.accent2],
    ["الختامي", 4, C.text2], ["الخروج", 3, C.accent1], ["الغلق", 1, C.accent3],
  ];
  const n = st.length, gap = 0.1, cw = (12.23 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const [name, m, col] = st[i];
    const x = W - 0.55 - cw - i * (cw + gap);
    card(s, x, 1.55, cw, 1.45, col, { flat: true, r: 0.12 });
    T(s, m.toLocaleString("ar-SA"), { x, y: 1.6, w: cw, h: 0.7, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
    T(s, name, { x, y: 2.3, w: cw, h: 0.55, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
  }
  T(s, "الأرقام بالدقائق  •  المجموع ٤٥ دقيقة", { x: 0.55, y: 3.05, w: 12.23, h: 0.35, fontSize: 13, color: "6B5A75", align: "center" });
  const roles = [
    ["المعلمة ميسّرة", ["تصمّم المواقف وتطرح الأسئلة المثيرة للتفكير", "تتجول وتوجّه وتدعم دون أن تُنجز عن الطالبات", "تجمع أدلة التعلم وتقدّم تغذية راجعة فورية", "تحلل بطاقات الخروج لتخطط لما بعد الحصة"], C.text2, lu.LuCompass],
    ["الطالبة محور التعلم", ["تستكشف وتستنتج المعايير بنفسها", "تعلّم زميلاتها في رحلة الخبيرات", "تتخذ القرار وتبرّره في مواقف حياتية", "تقيّم نفسها وزميلاتها بمعايير واضحة"], C.accent1, lu.LuSparkles],
  ];
  for (let i = 0; i < 2; i++) {
    const [head, items, col, ic] = roles[i];
    const x = i === 0 ? 6.85 : 0.55;
    card(s, x, 3.5, 5.93, 3.25, C.background2);
    await iconCircle(s, ic, x + 4.95, 3.65, 0.75, col, "FFFFFF");
    T(s, head, { x: x + 0.2, y: 3.67, w: 4.6, h: 0.6, fontSize: 21, bold: true, color: col, valign: "middle" });
    for (let j = 0; j < items.length; j++) {
      const y = 4.45 + j * 0.55;
      s.addShape(SH.OVAL, { x: x + 5.5, y: y + 0.17, w: 0.14, h: 0.14, fill: { color: col }, line: { type: "none" } });
      T(s, items[j], { x: x + 0.2, y, w: 5.2, h: 0.48, fontSize: 16, valign: "middle" });
    }
  }
  notes(s, { extra: "توزيع الزمن إرشادي. بناء التعلم (١٨ دقيقة) يشمل: تحضير الخبيرات ٥ د، عروض المجموعات الخمس مع التعزيز نحو ١٠ د، الأسئلة السريعة الثلاثة ٣ د. إن ضاق الوقت: يُختصر التمايز إلى المستويين ⭐⭐ و⭐⭐⭐ أو يُنقل إلى بداية الحصة القادمة، ولا يُحذف التقويم الختامي ولا بطاقة الخروج." });
});

// ---------- build ----------
(async () => {
  let current = null;
  for (const item of [...main, ...fb]) {
    if (item.section !== current) {
      pres.addSection({ title: item.section });
      current = item.section;
    }
    await item.fn(item.section);
  }
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT, "slides:", main.length + fb.length, "(hidden:", fb.length + ")");
})();
