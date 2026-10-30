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
pres.title = "اختيار الملابس — المحطة الثانية";
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
const FOOT = "المحطة الثانية  •  اختيار الملابس  •  المهارات الحياتية والأسرية  •  الصف السادس";
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

// ===== المحطة الثانية: محتوى درس «اختيار الملابس» — مقيّد بمحتوى عرض المعلمة =====
const M = (f) => path.join(__dirname, "media", f);
const fs = require("fs");
const b64file = (f, mime) => mime + ";base64," + fs.readFileSync(M(f)).toString("base64");
const imgSize = (f) => { const b = fs.readFileSync(M(f)); return require("child_process").execSync(`python3 -c "from PIL import Image;im=Image.open('${M(f)}');print(im.size[0],im.size[1])"`).toString().trim().split(" ").map(Number); };
// place an image inside a box keeping its aspect ratio (centred)
function fitImage(slide, f, x, y, w, h, o = {}) {
  const [iw, ih] = imgSize(f);
  const s = Math.min(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  slide.addImage({ path: M(f), x: x + (w - dw) / 2, y: y + (h - dh) / 2, w: dw, h: dh, ...o });
}
const SEC1 = "البداية", SEC2 = "مدخل المحتوى", SEC3 = "الأمور الواجب مراعاتها", SEC4 = "المراجعة والواجب";

// ================= 1. الغلاف =================
S("cover", SEC1, async (sec) => {
  const s = newSlide("DARK", sec);
  s.addImage({ data: await art.png(art.rackSVG(P), 1400), x: 0.5, y: 1.55, w: 6.2, h: 6.2 * 420 / 900, objectName: "Clothing rack illustration", altText: "رف ملابس عليه معطف وفساتين محتشمة وعباءة" });
  s.addText("المحطة الثانية", { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.25, x: 9.9, y: 1.1, w: 2.9, h: 0.55, fill: { color: C.accent2 }, color: C.text2, fontSize: 18, bold: true, align: "center", valign: "middle", margin: 0 });
  T(s, "المهارات الحياتية والأسرية  •  الصف السادس الابتدائي", { x: 7.0, y: 1.9, w: 5.8, h: 0.45, fontSize: 16, color: C.accent5, bold: true });
  T(s, "اختيار الملابس", { x: 6.6, y: 2.4, w: 6.2, h: 1.3, fontSize: 60, bold: true, color: C.background1, valign: "middle" });
  card(s, 8.6, 4.1, 4.2, 0.85, "4A2259", { flat: true, r: 0.15 });
  T(s, [{ text: "الوحدة: ", options: { color: C.accent2 } }, { text: "ملبسي" }], { x: 8.75, y: 4.15, w: 3.9, h: 0.75, fontSize: 24, bold: true, color: C.background1, valign: "middle" });
  notes(s, {
    say: "انتقلنا الآن إلى المحطة الثانية من خريطتنا. هنا سنتعرف على محتوى درسنا: اختيار الملابس.",
    extra: "هذا العرض هو المحطة الثانية في الخريطة التفاعلية، ومحتواه مأخوذ من عرض المعلمة الأصلي فقط. التحية وقواعد الصف ومراجعة الدرس السابق والشبكة التربيعية واستنتاج العنوان والأهداف موجودة في الخريطة خارج هذا العرض.",
  });
});

// ================= 2. تعريف الملبس =================
S("def", SEC2, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "تعريف الملبس");
  stageTag(s, "مدخل المحتوى", C.accent1);
  card(s, 6.85, 1.75, 5.93, 3.6, C.text2);
  await iconCircle(s, pi.PiCoatHanger, 11.6, 2.0, 0.95, C.accent2, "FFFFFF");
  T(s, "الملبس:", { x: 7.05, y: 2.05, w: 4.4, h: 0.7, fontSize: 26, bold: true, color: C.accent2, valign: "middle" });
  T(s, "كل أنواع الثياب والزينة التي يرتديها الإنسان في جميع أنحاء العالم.", { x: 7.05, y: 3.0, w: 5.53, h: 2.1, fontSize: 26, bold: true, color: C.background1, valign: "middle" });
  card(s, 0.55, 1.75, 5.95, 3.6, C.background1);
  fitImage(s, "knit.jpg", 0.7, 1.9, 5.65, 3.3, { altText: "ملابس صوفية ملونة" });
  card(s, 0.55, 5.65, 12.23, 1.05, C.accent6, { flat: true });
  await iconCircle(s, pi.PiBrain, 11.75, 5.73, 0.88, C.accent3, "FFFFFF");
  T(s, [{ text: "فكّري: ", options: { bold: true, color: C.accent3 } }, { text: "اذكري ثلاثة أشياء ترتدينها وتنطبق عليها كلمة «الملبس»: ثوبًا… وزينة." }], { x: 0.8, y: 5.72, w: 10.8, h: 0.9, fontSize: 19, valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "الملبس هو كل أنواع الثياب والزينة التي يرتديها الإنسان في جميع أنحاء العالم. لاحظن أن التعريف يشمل الثياب والزينة معًا.",
    steps: ["تقرأ طالبة التعريف بصوت مسموع.", "سؤال سريع: «ما الكلمتان المهمتان في التعريف؟» (الثياب، والزينة).", "تذكر ثلاث طالبات أمثلة مما يرتدينه."],
    answers: "الثياب والزينة؛ أمثلة: فستان، عباءة، حذاء، وشاح…",
  });
});

// ================= 3. ماذا لو لم يكن هناك ملابس؟ =================
S("whatif", SEC2, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "ماذا لو لم يكن هناك ملابس؟");
  stageTag(s, "سؤال تفكير", C.accent4);
  chips(s, [["فكّري – زاوجي – شاركي", "st"]]);
  card(s, 0.55, 1.6, 6.0, 5.1, C.background1);
  fitImage(s, "shirts.jpg", 0.7, 1.75, 5.7, 4.8, { altText: "قمصان ملونة معلقة" });
  const steps = [["فكّري", "بمفردك نصف دقيقة"], ["زاوجي", "ناقشي زميلتك في إجابتك"], ["شاركي", "اعرضي أهم فكرة على الصف"]];
  for (let i = 0; i < 3; i++) {
    const y = 1.6 + i * 1.25;
    card(s, 6.85, y, 5.93, 1.05, i % 2 ? C.background2 : C.accent5, { flat: true, r: 0.14 });
    s.addText(String.fromCharCode(0x661 + i), { ...AR, shape: SH.OVAL, x: 11.95, y: y + 0.2, w: 0.65, h: 0.65, fill: { color: C.accent4 }, color: C.background1, fontSize: 18, bold: true, align: "center", valign: "middle", margin: 0 });
    T(s, [{ text: steps[i][0] + ": ", options: { bold: true, color: C.text2 } }, { text: steps[i][1] }], { x: 7.05, y: y + 0.12, w: 4.75, h: 0.8, fontSize: 20, valign: "middle" });
  }
  card(s, 6.85, 5.4, 5.93, 1.3, C.text2, { flat: true });
  T(s, "ماذا سيحدث لنا؟ وبماذا نشعر؟ ولماذا نحتاج الملابس؟", { x: 7.05, y: 5.45, w: 5.53, h: 1.2, fontSize: 20, bold: true, color: C.background1, valign: "middle", align: "center" });
  notes(s, {
    time: "دقيقتان",
    strategy: "فكّري – زاوجي – شاركي",
    say: "تخيّلن عالمًا بلا ملابس… ماذا سيحدث لنا؟",
    steps: ["تفكر كل طالبة بمفردها نصف دقيقة.", "تتناقش مع زميلتها دقيقة.", "تشارك ثلاث ثنائيات بأهم فكرة، وتربطها المعلمة بالشريحة التالية: أهمية الملابس في حياة الإنسان."],
    answers: "إجابات مفتوحة من تفكير الطالبات، مثل: لن نستتر، سنتأذى من البرد والحر، لن نتجمّل. تقود المعلمة النقاش إلى أهمية الملابس في حياة الإنسان كما في الشريحة التالية.",
  });
});

// ================= 4. الإسلام والملبس =================
S("islam", SEC2, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "ديننا والملبس");
  stageTag(s, "مدخل المحتوى", C.accent1);
  chips(s, [["ربط بالقيم الإسلامية", "st"]]);
  card(s, 6.85, 1.6, 5.93, 5.1, C.text2);
  s.addImage({ data: await icon(lu.LuBookOpen, HX.accent2), x: 9.43, y: 1.85, w: 0.75, h: 0.75 });
  T(s, "أباح الإسلام أن يكون المسلم حسنَ الهيئة، كريمَ المظهر، متمتعًا بما خلق الله له من زينة الثياب.", { x: 7.1, y: 2.75, w: 5.43, h: 2.0, fontSize: 23, bold: true, color: C.background1, align: "center", valign: "middle" });
  card(s, 7.15, 4.95, 5.33, 1.45, "4A2259", { flat: true, r: 0.14 });
  T(s, "ونظرًا لأهمية الملابس في حياة الإنسان، كان لا بد من دراسة هذه الوحدة.", { x: 7.3, y: 5.0, w: 5.03, h: 1.35, fontSize: 18, color: C.accent5, align: "center", valign: "middle" });
  // the teacher's Quran recitation clip
  card(s, 0.55, 1.6, 6.0, 3.52, C.background1);
  const poster = b64file("quran_poster.png", "image/png");
  s.addMedia({ type: "video", path: M("quran.mp4"), cover: poster, x: 0.7, y: 1.75, w: 5.7, h: 5.7 * 360 / 640, objectName: "Quran recitation video" });
  T(s, "استمعي بإنصات… ثم اذكري ما فهمتِه عن اللباس", { x: 0.55, y: 5.35, w: 6.0, h: 0.7, fontSize: 18, bold: true, color: C.text2, align: "center", valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "أباح الإسلام أن يكون المسلم حسن الهيئة كريم المظهر، متمتعًا بما خلق الله له من زينة الثياب. ونظرًا لأهمية الملابس في حياة الإنسان كان لا بد من دراسة هذه الوحدة.",
    steps: ["تشغّل المعلمة مقطع التلاوة (من عرضها الأصلي) في وضع العرض بالضغط على الفيديو.", "تستمع الطالبات بإنصات.", "تقرأ طالبة نص الشريحة، وتسأل المعلمة: «ما الذي أباحه الإسلام للمسلم في مظهره؟»"],
    answers: "أن يكون حسن الهيئة، كريم المظهر، متمتعًا بزينة الثياب.",
    extra: "الفيديو مضمّن داخل الملف (١٩ ثانية) ويعمل في PowerPoint عند الضغط عليه في وضع العرض.",
  });
});

// ================= 5. تمهّلي يا جميلتي =================
S("pause", SEC2, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "جميلتي الصغيرة… تمهّلي!");
  stageTag(s, "مدخل المحتوى", C.accent1);
  s.addShape(SH.OVAL, { x: 1.2, y: 1.85, w: 4.0, h: 4.0, fill: { color: C.accent5 }, line: { type: "none" } });
  s.addShape(SH.OCTAGON, { x: 2.0, y: 2.65, w: 2.4, h: 2.4, fill: { color: "D64545" }, line: { color: "FFFFFF", width: 6 } });
  s.addImage({ data: await icon(fa6.FaHand, "FFFFFF"), x: 2.6, y: 3.25, w: 1.2, h: 1.2 });
  card(s, 6.2, 1.75, 6.58, 4.6, C.background2);
  T(s, [
    { text: "تجمّلي واختاري ما تشائين من ملابس…", options: { breakLine: true, bold: true, color: C.text2 } },
    { text: "ولكن تمهّلي قليلًا ودعيني أخبرك:", options: { breakLine: true } },
    { text: "نحن كمسلمات لا بد أن نراعي عدة أمور عند اختيار ملابسنا.", options: { breakLine: true, bold: true, color: C.accent1 } },
    { text: "أتعلمين ما هي؟", options: { bold: true, color: C.text2 } },
  ], { x: 6.5, y: 1.95, w: 6.0, h: 4.2, fontSize: 24, paraSpaceAfter: 14, valign: "middle" });
  notes(s, {
    time: "دقيقة",
    say: "جميلتي الصغيرة تجمّلي واختاري ما تشائين من ملابس، ولكن تمهّلي قليلًا ودعيني أخبرك: نحن كمسلمات لا بد أن نراعي عدة أمور عند اختيار ملابسنا. أتعلمين ما هي؟",
    steps: ["تستقبل المعلمة توقعات الطالبات (٢–٣ إجابات) دون تصحيح.", "تنتقل إلى الخريطة الذهنية لتتحقق الطالبات من توقعاتهن."],
  });
});

// ================= 6. الخريطة الذهنية =================
const CRIT = [
  ["مطابقتها لمواصفات اللباس الشرعي", fa6.FaShieldHeart, C.accent1],
  ["العادات والتقاليد", lu.LuLandmark, C.accent2],
  ["المواسم", lu.LuSunSnow, C.accent3],
  ["السن", fa6.FaChildDress, C.accent4],
  ["لون البشرة", lu.LuPalette, C.accent1],
  ["قوام الجسم", lu.LuRuler, C.accent3],
  ["المناسبة", lu.LuPartyPopper, C.accent2],
];
S("map", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "الأمور الواجب مراعاتها عند اختيار الملابس");
  const cx = 6.67, cy = 4.3;
  s.addShape(SH.OVAL, { x: cx - 1.25, y: cy - 1.25, w: 2.5, h: 2.5, fill: { color: C.text2 }, line: { type: "none" }, shadow: shadow() });
  s.addImage({ data: await icon(pi.PiCoatHanger, HX.accent2), x: cx - 0.45, y: cy - 0.95, w: 0.9, h: 0.9 });
  T(s, "اختيار الملابس", { x: cx - 1.1, y: cy - 0.05, w: 2.2, h: 0.85, fontSize: 18, bold: true, align: "center", color: C.background1, valign: "middle" });
  const pos = [[6.67, 1.9], [9.35, 2.55], [10.25, 4.45], [8.6, 6.05], [4.74, 6.05], [3.09, 4.45], [3.99, 2.55]];
  const ord = ["١", "٢", "٣", "٤", "٥", "٦", "٧"];
  for (let i = 0; i < 7; i++) {
    const [name, ic, col] = CRIT[i];
    const [x, y] = pos[i];
    s.addShape(SH.OVAL, { x: x - 0.42, y: y - 0.42, w: 0.84, h: 0.84, fill: { color: col }, line: { color: "FFFFFF", width: 3 } });
    s.addImage({ data: await icon(ic, "FFFFFF"), x: x - 0.24, y: y - 0.24, w: 0.48, h: 0.48 });
    s.addText(ord[i], { ...AR, shape: SH.OVAL, x: x + 0.22, y: y - 0.5, w: 0.34, h: 0.34, fill: { color: C.text2 }, color: C.background1, fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0 });
    const right = x > cx + 0.1, left = x < cx - 0.1;
    if (!right && !left) T(s, name, { x: x + 0.62, y: y - 0.25, w: 4.2, h: 0.5, fontSize: 18, bold: true, color: C.text2, align: "left", valign: "middle" });
    else T(s, name, { x: right ? x + 0.5 : x - 0.5 - 2.6, y: y - 0.25, w: 2.6, h: 0.5, fontSize: 18, bold: true, color: C.text2, align: right ? "left" : "right", valign: "middle" });
  }
  notes(s, {
    time: "دقيقة",
    say: "من خلال الخريطة الذهنية نتعرف على الأمور الواجب مراعاتها عند اختيار الملابس، وهي سبعة أمور. سنتعرف على كل أمر منها بالتفصيل.",
    steps: ["تقارن الطالبات توقعاتهن في الشريحة السابقة بالخريطة.", "تُعرض كل شريحة تالية فرعًا من فروع الخريطة."],
  });
});

// helper for the 7 branch slides
function branchHead(s, n, ttl, col) {
  title(s, ttl);
  stageTag(s, `الأمر ${n} من ٧`, col);
}

// ================= 7. اللباس الشرعي =================
S("c1", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "١", "مطابقتها لمواصفات اللباس الشرعي", C.accent1);
  const items = [
    [lu.LuShieldCheck, "ساتر"],
    [pi.PiDress, "فضفاض"],
    [lu.LuUserCheck, "خالٍ من تقليد الكفار"],
    [lu.LuBan, "خالٍ من الصور ذات الأرواح"],
  ];
  for (let i = 0; i < 4; i++) {
    const [ic, txt] = items[i];
    const x = W - 0.55 - 2.85 - i * 3.13;
    card(s, x, 1.65, 2.85, 2.9, C.background2);
    await iconCircle(s, ic, x + 0.83, 1.9, 1.2, C.accent1, "FFFFFF");
    T(s, txt, { x: x + 0.12, y: 3.25, w: 2.61, h: 1.1, fontSize: 21, bold: true, align: "center", valign: "middle", color: C.text2 });
  }
  card(s, 0.55, 4.85, 12.23, 1.85, C.text2, { flat: true });
  await iconCircle(s, lu.LuTriangleAlert, 11.45, 5.2, 1.15, C.accent2, HX.dk2);
  T(s, [
    { text: "احذري الصليب!", options: { bold: true, fontSize: 26, color: C.accent2, breakLine: true } },
    { text: "تأمّلي الرسومات والشعارات على ملابسك قبل أن تشتريها أو ترتديها." },
  ], { x: 0.85, y: 4.95, w: 10.4, h: 1.65, fontSize: 19, color: C.background1, valign: "middle", paraSpaceAfter: 6 });
  notes(s, {
    time: "دقيقتان",
    say: "أول ما نراعيه: أن تكون ملابسنا مطابقة لمواصفات اللباس الشرعي: ساترة، فضفاضة، خالية من تقليد الكفار، وخالية من الصور ذات الأرواح.",
    steps: ["تعدّ الطالبات المواصفات الأربع بأصابعهن مع المعلمة.", "تنبّه المعلمة إلى بطاقة «احذري الصليب!» التي في الخريطة الذهنية الأصلية: بعض الشعارات والأعلام والرسومات على الملابس تحمل الصليب.", "ثم السؤال السريع التالي."],
    extra: "في عرضك الأصلي وُضعت على هذا الفرع صورة «احذر الصليب!» مع شعارات وأعلام؛ اختُصرت هنا في بطاقة تحذير نصية لأن الصورة الأصلية صغيرة جدًا ولا تُقرأ عند تكبيرها.",
  });
});

makeQuestion("q1", SEC3, {
  title: "سؤال سريع (١)",
  goal: "اللباس الشرعي",
  stem: "أيّ مما يلي ليس من مواصفات اللباس الشرعي؟",
  options: [
    [lu.LuShieldCheck, "أن يكون ساترًا"],
    [pi.PiDress, "أن يكون فضفاضًا"],
    [lu.LuImage, "أن تكون عليه صور ذات أرواح"],
  ],
  correct: 2,
  nextId: "c2",
  feedback: [
    { head: "فكّري مرة أخرى…", body: "«ساتر» من مواصفات اللباس الشرعي. ابحثي عن الصفة التي تخالف المواصفات." },
    { head: "فكّري مرة أخرى…", body: "«فضفاض» من مواصفات اللباس الشرعي. ابحثي عن الصفة التي تخالف المواصفات." },
    { head: "أحسنتِ!", body: "اللباس الشرعي يكون خاليًا من الصور ذات الأرواح، فهذه الصفة ليست من مواصفاته." },
  ],
});

// ================= 9. العادات والتقاليد =================
S("c2", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٢", "العادات والتقاليد", C.accent2);
  chips(s, [["تعزيز الهوية الوطنية", "st"]]);
  const regions = ["المنطقة الشمالية", "المنطقة الجنوبية", "المنطقة الوسطى", "المنطقة الشرقية", "المنطقة الغربية"];
  T(s, "لكل منطقة من مناطق وطننا زيّها التراثي:", { x: 4.5, y: 1.55, w: 8.28, h: 0.5, fontSize: 19, bold: true, color: C.text2 });
  for (let i = 0; i < 5; i++) {
    const x = W - 0.55 - 2.29 - i * 2.485;
    s.addText(regions[i], { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y: 2.15, w: 2.29, h: 0.65, fill: { color: C.accent2 }, color: C.text2, fontSize: 18, bold: true, align: "center", valign: "middle", margin: 0 });
  }
  const trad = ["trad_image20-40.jpg", "trad_image24-44.jpg", "trad_image23-43.jpg", "trad_image27-48.jpg"];
  for (let i = 0; i < 4; i++) {
    const x = W - 0.55 - 1.85 - i * 2.0;
    card(s, x, 3.05, 1.85, 2.25, C.background1);
    fitImage(s, trad[i], x + 0.08, 3.13, 1.69, 2.09, { altText: "زي تراثي سعودي" });
  }
  T(s, "من صور الأزياء التراثية في عرضك", { x: 4.85, y: 5.35, w: 7.95, h: 0.4, fontSize: 13, color: "6B5A75", align: "center" });
  // national identity (teacher's flag + Vision 2030 slide)
  card(s, 0.55, 3.05, 4.05, 3.65, C.text2);
  fitImage(s, "flag.jpg", 0.75, 3.2, 3.65, 1.45, { altText: "علم المملكة العربية السعودية" });
  fitImage(s, "vision.jpg", 1.35, 4.75, 2.45, 1.05, { altText: "شعار رؤية المملكة ٢٠٣٠" });
  T(s, "زيّنا التراثي جزء من هويتنا الوطنية", { x: 0.7, y: 5.85, w: 3.75, h: 0.75, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
  card(s, 4.85, 5.85, 7.93, 0.85, C.accent6, { flat: true });
  T(s, [{ text: "حوار: ", options: { bold: true, color: C.accent3 } }, { text: "من أي منطقة أنتِ؟ صفي لزميلاتك الزي التراثي لمنطقتك." }], { x: 5.05, y: 5.88, w: 7.53, h: 0.8, fontSize: 17, valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "نراعي عند اختيار ملابسنا العادات والتقاليد. ووطننا الغالي فيه خمس مناطق: الشمالية والجنوبية والوسطى والشرقية والغربية، ولكل منطقة زيّها التراثي الجميل الذي نعتز به.",
    steps: ["تقرأ الطالبات أسماء المناطق الخمس.", "حوار سريع: تصف ٢–٣ طالبات الزي التراثي في مناطقهن.", "تربط المعلمة بالهوية الوطنية ورؤية المملكة ٢٠٣٠ (من شريحة العلم والرؤية في عرضك)."],
    answers: "المنطقة الشمالية، الجنوبية، الوسطى، الشرقية، الغربية.",
  });
});

// ================= 10. المواسم =================
S("c3", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٣", "المواسم", C.accent3);
  const panels = [
    { x: 6.85, bg: "FFF4DF", ic: lu.LuSun, icHex: HX.accent2, head: "صيف", img: "summer_dress.png", hc: C.text2 },
    { x: 0.55, bg: "EFE8F7", ic: lu.LuSnowflake, icHex: HX.accent4, head: "شتاء", img: "winter_girl.jpg", hc: C.accent4 },
  ];
  for (const p of panels) {
    card(s, p.x, 1.6, 5.93, 4.0, p.bg);
    s.addImage({ data: await icon(p.ic, p.icHex), x: p.x + 4.75, y: 1.85, w: 0.85, h: 0.85 });
    T(s, p.head, { x: p.x + 2.8, y: 1.85, w: 1.85, h: 0.85, fontSize: 36, bold: true, color: p.hc, valign: "middle" });
    card(s, p.x + 0.35, 1.85, 2.3, 3.5, C.background1, { flat: true, r: 0.12 });
    fitImage(s, p.img, p.x + 0.45, 1.95, 2.1, 3.3, { altText: p.head === "صيف" ? "فستان صيفي" : "طفلة بمعطف ووشاح شتوي" });
  }
  card(s, 0.55, 5.85, 12.23, 0.85, C.accent6, { flat: true });
  T(s, [{ text: "لاحظي: ", options: { bold: true, color: C.accent3 } }, { text: "ما الفرق بين ملابس الصورتين؟ ولماذا اختلفتا؟" }], { x: 0.8, y: 5.88, w: 11.73, h: 0.8, fontSize: 19, valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "نراعي المواسم عند اختيار ملابسنا: لملابس الشتاء ما يناسبها، ولملابس الصيف ما يناسبها.",
    steps: ["تقارن الطالبات بين الصورتين (من صور عرضك).", "تستقبل المعلمة ٣ ملاحظات مع «لأنّ»."],
    answers: "ملابس الشتاء أثقل وتغطي أكثر (معطف ووشاح)، وملابس الصيف أخف. اختلفتا لاختلاف الموسم.",
    extra: "التزمت الشريحة بما في عرضك (شتاء/صيف)، دون تفاصيل إضافية عن أنواع الأقمشة.",
  });
});

makeQuestion("q2", SEC3, {
  title: "سؤال سريع (٢)",
  goal: "المواسم",
  stem: "أيّ هذه الملابس يناسب موسم الشتاء؟",
  options: [
    ["summer_dress.png", "فستان صيفي"],
    ["winter_girl.jpg", "معطف ووشاح"],
    ["home.jpg", "ملابس منزل خفيفة"],
  ],
  correct: 1,
  nextId: "c4",
  feedback: [
    { head: "فكّري مرة أخرى…", body: "هذا الفستان يناسب موسم الصيف. أيّ الملابس تدفئنا في الشتاء؟" },
    { head: "أحسنتِ!", body: "المعطف والوشاح يناسبان موسم الشتاء؛ فنحن نراعي المواسم عند اختيار ملابسنا." },
    { head: "فكّري مرة أخرى…", body: "هذه ملابس منزل. انظري إلى الصور مرة أخرى: أيّها يناسب برد الشتاء؟" },
  ],
});

// ================= 12. السن =================
S("c4", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٤", "السن", C.accent4);
  const stages = [["الطفولة", pi.PiBaby, C.accent1], ["المراهقة", fa6.FaChildDress, C.accent4], ["الرشد", fa6.FaPersonDress, C.accent3], ["كبار السن", lu.LuHeartHandshake, C.text2]];
  T(s, "لكل مرحلة من مراحل العمر ملابس تناسبها:", { x: 4.5, y: 1.55, w: 8.28, h: 0.5, fontSize: 19, bold: true, color: C.text2 });
  for (let i = 0; i < 4; i++) {
    const [name, ic, col] = stages[i];
    const x = W - 0.55 - 2.85 - i * 3.13;
    card(s, x, 2.25, 2.85, 2.7, C.background2);
    await iconCircle(s, ic, x + 0.78, 2.5, 1.3, col, "FFFFFF");
    T(s, name, { x: x + 0.1, y: 3.95, w: 2.65, h: 0.7, fontSize: 24, bold: true, align: "center", color: C.text2, valign: "middle" });
    if (i < 3) s.addImage({ data: await icon(lu.LuChevronLeft, HX.accent1), x: x - 0.33, y: 3.3, w: 0.36, h: 0.36 });
  }
  card(s, 0.55, 5.3, 12.23, 1.4, C.text2, { flat: true });
  T(s, [{ text: "سؤال: ", options: { bold: true, color: C.accent2 } }, { text: "في أي مرحلة أنتِ الآن؟ وهل يناسبك ما كنتِ ترتدينه في مرحلة الطفولة؟ لماذا؟" }], { x: 0.85, y: 5.35, w: 11.63, h: 1.3, fontSize: 20, color: C.background1, valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "نراعي السن عند اختيار ملابسنا، ومراحل السن في خريطتنا أربع: الطفولة، والمراهقة، والرشد، وكبار السن.",
    steps: ["تقرأ الطالبات المراحل بالترتيب.", "تجيب ثلاث طالبات عن سؤال الشريحة مع التبرير."],
    answers: "الطفولة أو بداية المراهقة (بحسب ما تقرره المعلمة)؛ ولا يناسبها ما كانت ترتديه صغيرة، لأن لكل مرحلة ملابس تناسبها.",
  });
});

// ================= 13. لون البشرة =================
S("c5", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٥", "لون البشرة", C.accent1);
  const tones = [["بيضاء", "F3D7C6"], ["حنطية", "D9A87E"], ["سمراء", "8D5A3B"]];
  for (let i = 0; i < 3; i++) {
    const x = W - 0.55 - 3.85 - i * 4.19;
    card(s, x, 1.65, 3.85, 3.6, C.background2);
    s.addShape(SH.OVAL, { x: x + 1.07, y: 1.95, w: 1.7, h: 1.7, fill: { color: tones[i][1] }, line: { color: "FFFFFF", width: 4 }, shadow: shadow() });
    T(s, tones[i][0], { x: x + 0.2, y: 3.95, w: 3.45, h: 0.9, fontSize: 30, bold: true, align: "center", valign: "middle", color: C.text2 });
  }
  card(s, 0.55, 5.55, 12.23, 1.15, C.text2, { flat: true });
  T(s, "نختار من الملابس ما يناسب لون بشرتنا… وكل لون بشرة جميل خلقه الله", { x: 0.85, y: 5.6, w: 11.63, h: 1.05, fontSize: 21, bold: true, color: C.background1, align: "center", valign: "middle" });
  notes(s, {
    time: "دقيقة",
    say: "نراعي لون البشرة عند اختيار ملابسنا. وفي خريطتنا ثلاثة ألوان للبشرة: بيضاء، وحنطية، وسمراء.",
    steps: ["تقرأ الطالبات الألوان الثلاثة.", "تؤكد المعلمة قيمة الرضا بخلق الله: لا لون أجمل من آخر."],
  });
});

// ================= 14. قوام الجسم =================
S("c6", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٦", "قوام الجسم", C.accent3);
  const types = ["الطويلة النحيفة", "القصيرة", "البدينة"];
  for (let i = 0; i < 3; i++) {
    const y = 1.65 + i * 1.25;
    card(s, 6.85, y, 5.93, 1.05, C.background2, { flat: true, r: 0.14 });
    await iconCircle(s, lu.LuRuler, 11.9, y + 0.15, 0.75, C.accent3, "FFFFFF");
    T(s, types[i], { x: 7.05, y: y + 0.12, w: 4.7, h: 0.8, fontSize: 24, bold: true, color: C.text2, valign: "middle" });
  }
  card(s, 6.85, 5.5, 5.93, 1.2, C.text2, { flat: true });
  T(s, "كل قوام جميل… نختار ما يناسبه دون أن نقارن أنفسنا بغيرنا", { x: 7.05, y: 5.55, w: 5.53, h: 1.1, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle" });
  // teacher's animated GIF «الخطوط الطولية»
  card(s, 0.55, 1.65, 5.95, 5.05, C.background1);
  s.addImage({ path: M("stripes.gif"), x: 1.08, y: 1.8, w: 4.9, h: 4.9, altText: "فتاة ترتدي ملابس بخطوط طولية" });
  notes(s, {
    time: "دقيقتان",
    say: "نراعي قوام الجسم عند اختيار ملابسنا. وفي خريطتنا ثلاثة أنواع: الطويلة النحيفة، والقصيرة، والبدينة. انظرن إلى الصورة: ما نوع الخطوط في هذه الملابس؟",
    steps: ["تقرأ الطالبات أنواع القوام الثلاثة.", "تشير المعلمة إلى الصورة المتحركة «الخطوط الطولية» من عرضها، وتسأل: «ما نوع الخطوط؟»", "تؤكد قيمة تقبّل الذات واحترام الآخرين."],
    answers: "خطوط طولية.",
    extra: "الصورة المتحركة من عرضك الأصلي وتتحرك في وضع العرض.",
  });
});

// ================= 15. المناسبة =================
S("c7", SEC3, async (sec) => {
  const s = newSlide("CONTENT", sec);
  branchHead(s, "٧", "المناسبة", C.accent2);
  const panels = [
    { x: 6.85, head: "ملابس المنزل", img: "home.jpg", ic: lu.LuHouse, col: C.accent1 },
    { x: 0.55, head: "ملابس الخروج", img: "out.jpg", ic: lu.LuDoorOpen, col: C.accent3 },
  ];
  for (const p of panels) {
    card(s, p.x, 1.6, 5.93, 4.05, C.background2);
    await iconCircle(s, p.ic, p.x + 4.85, 1.8, 0.85, p.col, "FFFFFF");
    T(s, p.head, { x: p.x + 2.4, y: 1.8, w: 2.35, h: 0.85, fontSize: 24, bold: true, color: C.text2, valign: "middle" });
    card(s, p.x + 0.35, 1.8, 2.0, 3.65, C.background1, { flat: true, r: 0.12 });
    fitImage(s, p.img, p.x + 0.45, 1.9, 1.8, 3.45, { altText: p.head });
  }
  card(s, 0.55, 5.85, 12.23, 0.85, C.accent6, { flat: true });
  T(s, [{ text: "صنّفي على سبورتك: ", options: { bold: true, color: C.accent3 } }, { text: "بيجامة • عباءة • ملابس زيارة • ملابس نوم ← منزل أم خروج؟" }], { x: 0.8, y: 5.88, w: 11.73, h: 0.8, fontSize: 19, valign: "middle" });
  notes(s, {
    time: "دقيقتان",
    say: "نراعي المناسبة عند اختيار ملابسنا: فهناك ملابس المنزل، وملابس الخروج.",
    steps: ["تكتب كل طالبة التصنيف على سبورتها الصغيرة.", "ترفع الطالبات السبورات معًا، وتقدّم المعلمة تغذية راجعة فورية."],
    answers: "بيجامة: منزل • عباءة: خروج • ملابس زيارة: خروج • ملابس نوم: منزل.",
  });
});

// ================= 16. سؤال ٣: كم عدد الأمور؟ =================
makeQuestion("q3", SEC4, {
  title: "سؤال سريع (٣)",
  goal: "المراجعة",
  stem: "كم عدد الأمور الواجب مراعاتها عند اختيار الملابس في خريطتنا الذهنية؟",
  options: [
    [lu.LuHand, "خمسة أمور"],
    [lu.LuListChecks, "سبعة أمور"],
    [lu.LuGrid3X3, "تسعة أمور"],
  ],
  correct: 1,
  nextId: "review",
  feedback: [
    { head: "فكّري مرة أخرى…", body: "عدّي فروع الخريطة الذهنية بأصابعك: اللباس الشرعي، العادات والتقاليد… أكملي العد." },
    { head: "أحسنتِ!", body: "سبعة أمور: اللباس الشرعي، والعادات والتقاليد، والمواسم، والسن، ولون البشرة، وقوام الجسم، والمناسبة." },
    { head: "فكّري مرة أخرى…", body: "عدّي فروع الخريطة الذهنية بأصابعك مرة أخرى." },
  ],
});

// ================= 17. تحدي الخريطة الذهنية =================
S("review", SEC4, async (sec) => {
  const s = newSlide("CONTENT", sec);
  title(s, "تحدّي الخريطة الذهنية");
  stageTag(s, "مراجعة تعاونية", C.accent4);
  chips(s, [["التعلم التعاوني", "st"]]);
  const cx = 4.0, cy = 4.25;
  const pts = [[4.0, 1.75], [6.15, 2.6], [6.6, 4.25], [6.15, 5.9], [1.85, 5.9], [1.4, 4.25], [1.85, 2.6]];
  for (let i = 0; i < 7; i++) {
    const [x, y] = pts[i];
    s.addShape(SH.LINE, { x: Math.min(x, cx), y: Math.min(y, cy), w: Math.abs(x - cx) || 0.001, h: Math.abs(y - cy) || 0.001, flipH: (x < cx) !== (y < cy), line: { color: "D9C6E0", width: 2 } });
  }
  s.addShape(SH.OVAL, { x: cx - 1.0, y: cy - 1.0, w: 2.0, h: 2.0, fill: { color: C.text2 }, line: { type: "none" } });
  T(s, "اختيار الملابس", { x: cx - 0.95, y: cy - 0.45, w: 1.9, h: 0.9, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
  for (let i = 0; i < 7; i++) {
    const [x, y] = pts[i];
    s.addText("……………", { ...AR, shape: SH.ROUNDED_RECTANGLE, rectRadius: 0.2, x: x - 0.95, y: y - 0.3, w: 1.9, h: 0.6, fill: { color: C.accent5 }, line: { color: "E0607E", width: 1.5, dashType: "dash" }, color: C.text2, fontSize: 14, align: "center", valign: "middle", margin: 0 });
    s.addText(String.fromCharCode(0x661 + i), { ...AR, shape: SH.OVAL, x: x + 0.72, y: y - 0.45, w: 0.36, h: 0.36, fill: { color: C.text2 }, color: C.background1, fontSize: 11, bold: true, align: "center", valign: "middle", margin: 0 });
  }
  // word bank
  card(s, 8.0, 1.6, 4.78, 5.1, C.background2);
  T(s, "بنك الفروع: صِلي كل فرع بأمره", { x: 8.2, y: 1.75, w: 4.38, h: 0.55, fontSize: 18, bold: true, color: C.accent1 });
  const bank = ["ساتر • فضفاض", "المنطقة الشمالية • الغربية", "شتاء • صيف", "الطفولة • المراهقة", "بيضاء • حنطية • سمراء", "القصيرة • البدينة", "ملابس المنزل • الخروج"];
  for (let i = 0; i < bank.length; i++) {
    const y = 2.4 + i * 0.6;
    s.addShape(SH.OVAL, { x: 12.35, y: y + 0.17, w: 0.16, h: 0.16, fill: { color: C.accent4 }, line: { type: "none" } });
    T(s, bank[i], { x: 8.2, y, w: 4.05, h: 0.5, fontSize: 16, valign: "middle" });
  }
  notes(s, {
    time: "٣ دقائق",
    strategy: "التعلم التعاوني",
    say: "تحدٍّ لكل مجموعة: أكملن الخريطة الذهنية بالأمور السبعة، مستعينات ببنك الفروع. أول مجموعة تُكملها صحيحة تفوز!",
    steps: ["ترسم كل مجموعة الخريطة على ورقة أو تستخدم ورقة مطبوعة.", "تكتب المجموعة اسم الأمر في كل فرع، وتستعين ببنك الفروع للربط.", "تعرض أسرع مجموعة خريطتها، وتصحح بقية المجموعات خرائطها."],
    answers: "١ مطابقتها لمواصفات اللباس الشرعي (ساتر، فضفاض…) • ٢ العادات والتقاليد (المناطق) • ٣ المواسم (شتاء، صيف) • ٤ السن (الطفولة، المراهقة، الرشد، كبار السن) • ٥ لون البشرة (بيضاء، حنطية، سمراء) • ٦ قوام الجسم (الطويلة النحيفة، القصيرة، البدينة) • ٧ المناسبة (ملابس المنزل، ملابس الخروج).",
  });
});

// ================= 18. الواجب =================
S("hw", SEC4, async (sec) => {
  const s = newSlide("DARK", sec);
  s.addShape(SH.OVAL, { x: 5.67, y: 0.9, w: 2.0, h: 2.0, fill: { color: "4A2259" }, line: { type: "none" } });
  s.addImage({ data: await icon(lu.LuSearch, HX.accent2), x: 6.12, y: 1.35, w: 1.1, h: 1.1 });
  T(s, "الواجب", { x: 1.5, y: 3.05, w: 10.33, h: 0.9, fontSize: 44, bold: true, color: C.accent2, align: "center", valign: "middle" });
  card(s, 2.2, 4.15, 8.93, 1.9, "4A2259", { flat: true });
  T(s, "ابحثي عن معلومات من مصادر موثوقة عن لباس أهل الجنة", { x: 2.45, y: 4.25, w: 8.43, h: 1.7, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle" });
  notes(s, {
    say: "واجبنا: ابحثي عن معلومات من مصادر موثوقة عن لباس أهل الجنة.",
    steps: ["توضّح المعلمة معنى «مصادر موثوقة» (مثل القرآن الكريم وكتب التفسير والمواقع الموثوقة).", "تُعرض الإجابات في الحصة القادمة."],
  });
});

// ---------- interactive question helper (defined after use is fine: functions are hoisted) ----------
async function questionSlide(sec, { qid, title: t, stem, options, correct, goal }) {
  const s = newSlide("CONTENT", sec);
  title(s, t);
  stageTag(s, "سؤال سريع  •  دقيقة", C.accent3);
  chips(s, [[goal, "st"], ["تغذية راجعة فورية", "st"]]);
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
    if (typeof ic === "string") { card(s, x + 1.02, 3.3, 1.8, 1.25, C.background1, { flat: true, r: 0.1 }); fitImage(s, ic, x + 1.07, 3.33, 1.7, 1.19); }
    else s.addImage({ data: await icon(ic, icHex || HX.dk2), x: x + 1.42, y: 3.45, w: 1.0, h: 1.0 });
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
