// ملحق المطبوعات — HTML -> PDF (A4)
const React = require("react");
const R = require("react-dom/server");
const { chromium } = require("playwright");
const lu = require("react-icons/lu");
const pi = require("react-icons/pi");
const gi = require("react-icons/gi");
const fa6 = require("react-icons/fa6");

const OUT = process.argv[2] || "printables.pdf";
const ic = (C, color = "#5B2A6E", size = 28) => R.renderToStaticMarkup(React.createElement(C, { color, size: String(size) }));
const stars = (n) => Array.from({ length: n }, () => ic(lu.LuStar, "#F2A93B", 18)).join("");
const line = (n = 1) => Array.from({ length: n }, () => '<div class="ln"></div>').join("");

const css = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: "Noto Sans Arabic", Arial, sans-serif; direction: rtl; color: #2B1B33; margin: 0; font-size: 13pt; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
h1 { color: #5B2A6E; font-size: 20pt; margin: 0 0 2mm; display: flex; align-items: center; gap: 3mm; }
.sub { color: #6B5A75; font-size: 10.5pt; margin: 0 0 5mm; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.card { border: 1.5px dashed #C9B8D3; border-radius: 4mm; padding: 3mm 4mm; background: #FBF3F7; break-inside: avoid; }
.card h2 { margin: 0 0 1mm; font-size: 13pt; color: #5B2A6E; display: flex; align-items: center; gap: 2mm; }
.pill { white-space: nowrap; display: inline-block; background: #5B2A6E; color: #fff; border-radius: 10mm; padding: 0.5mm 3.5mm; font-size: 10pt; font-weight: 700; }
.ln { border-bottom: 1px dotted #9C8AA6; height: 7mm; }
.lbl { font-weight: 700; color: #E0607E; margin-top: 1.5mm; font-size: 11pt; }
.exp .lbl { font-size: 10.5pt; } .exp .ln { height: 6.5mm; }
.closet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
.cl { border: 1.5px dashed #C9B8D3; border-radius: 4mm; padding: 4mm 2mm; text-align: center; background: #fff; break-inside: avoid; min-height: 52mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3mm; }
.cl .t { font-weight: 700; font-size: 12pt; color: #5B2A6E; }
table { width: 100%; border-collapse: collapse; font-size: 11.5pt; }
th { background: #5B2A6E; color: #fff; padding: 2mm; font-weight: 700; }
td { border: 1px solid #DCCBE3; padding: 2mm; height: 10mm; vertical-align: middle; }
table.tall td { height: 16mm; }
td.h { background: #F7D9E3; font-weight: 700; color: #5B2A6E; width: 22%; }
.box { border: 1.5px solid #DCCBE3; border-radius: 4mm; padding: 3mm 4mm; margin-bottom: 3mm; break-inside: avoid; }
.scen { background: #5B2A6E; color: #fff; border-radius: 4mm; padding: 4mm 5mm; font-weight: 700; margin-bottom: 4mm; }
.chk { display: flex; gap: 8mm; flex-wrap: wrap; font-weight: 700; color: #2A9D8F; }
.chk span::before { content: ""; display: inline-block; width: 4mm; height: 4mm; border: 1.5px solid #2A9D8F; border-radius: 1mm; margin-left: 2mm; vertical-align: -0.5mm; }
.ticket { border: 1.5px dashed #9C8AA6; border-radius: 4mm; padding: 3.5mm 4.5mm; height: 128mm; position: relative; break-inside: avoid; font-size: 11pt; }
.ticket .q { font-weight: 700; margin-top: 2mm; }
.ticket .ln { height: 6.5mm; }
.conf { display: flex; gap: 3mm; margin-top: 2mm; font-size: 9.5pt; }
.conf div { flex: 1; text-align: center; }
.dot { width: 7mm; height: 7mm; border-radius: 50%; margin: 0 auto 1mm; border: 2px solid #ccc; }
.names td { height: 7.6mm; padding: 0 2mm; }
.match { display: grid; grid-template-columns: 1fr 30mm 1fr; align-items: center; row-gap: 5mm; }
.match .it { border: 1.5px solid #DCCBE3; border-radius: 3mm; padding: 2.5mm; display: flex; align-items: center; gap: 3mm; font-weight: 700; }
.match .d { text-align: center; color: #C9B8D3; font-size: 18pt; }
.foot { color: #9C8AA6; font-size: 9pt; text-align: center; margin-top: 3mm; }
`;

const experts = [
  ["١", "مواصفات اللباس الشرعي", fa6.FaShieldHeart],
  ["٢", "العادات والتقاليد", lu.LuLandmark],
  ["٣", "الموسم", lu.LuSunSnow],
  ["٤", "العمر — ولون البشرة", lu.LuPalette],
  ["٥", "القوام — والمناسبة", lu.LuRuler],
];
const requests = [
  ["١", "زيارة جدتي في أبها في ليلة شتوية ممطرة", lu.LuCloudRain],
  ["٢", "احتفال مدرستي بيوم التأسيس", lu.LuLandmark],
  ["٣", "نزهة عائلية على الكورنيش في عصر يوم صيفي حار", lu.LuSun],
  ["٤", "صلاة العيد في المصلى صباح يوم شتوي", fa6.FaMosque],
  ["٥", "حضور حفل زواج قريبتي", lu.LuPartyPopper],
];
const closet = [
  [pi.PiCoatHanger, "معطف صوفي داكن", "#3B1A4A"],
  [pi.PiDressFill, "فستان قطني فاتح بأكمام طويلة", "#9ED3EA"],
  [pi.PiDressFill, "فستان أنيق محتشم للمناسبات", "#E0607E"],
  [fa6.FaPersonRunning, "زيّ رياضي", "#2A9D8F"],
  [gi.GiRunningShoe, "حذاء رياضي", "#2A9D8F"],
  [gi.GiSandal, "صندل صيفي", "#F2A93B"],
  [gi.GiHighHeel || gi.GiConverseShoe, "حذاء أنيق مغلق", "#5B2A6E"],
  [gi.GiWinterHat || lu.LuSnowflake, "وشاح وقبعة صوفية", "#7C5CBF"],
  [lu.LuLandmark, "زيّ تراثي من منطقتي", "#F2A93B"],
  [pi.PiDress, "لباس صلاة واسع ساتر", "#5B2A6E"],
  [pi.PiTShirt, "قميص عليه كتابة لا تليق", "#9C8AA6"],
  [lu.LuEye, "فستان ضيّق قماشه شفاف", "#9C8AA6"],
];

const page = (inner) => `<section class="page">${inner}</section>`;
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${css}</style></head><body>
${page(`<h1>${ic(pi.PiCoatHanger, "#E0607E", 30)} بطاقات الخبيرات</h1>
<p class="sub">تُقص وتُعطى كل مجموعة بطاقتها • الزمن: ٤ دقائق للتحضير ودقيقة للعرض • المرجع: درس «اختيار الملابس» في كتاب الطالب</p>
<div class="grid2 exp">${experts.map(([n, t, I]) => `<div class="card"><h2>${ic(I, "#E0607E", 24)} <span class="pill">مجموعة ${n}</span> ${t}</h2>
<div class="lbl">١) اقرئي الجزء الخاص بمعياركن من الكتاب. المعيار في جملة واحدة:</div>${line(1)}
<div class="lbl">٢) مثال من حياتنا اليومية:</div>${line(1)}
<div class="lbl">٣) سؤال نطرحه على زميلاتنا:</div>${line(1)}</div>`).join("")}
<div class="card" style="background:#fff"><h2>${ic(lu.LuUsers, "#2A9D8F", 24)} أدوار المجموعة</h2>
<p style="margin:1mm 0;line-height:2">القائدة: ……………………<br>المقرِّرة: ……………………<br>الميقاتية: ……………………<br>المتحدثة: ……………………</p></div></div>`)}

${page(`<h1>${ic(lu.LuMail, "#E0607E", 30)} طلبات الاستشارة وبطاقات التبرير</h1>
<p class="sub">نشاط «مستشارة الأناقة» • لكل مجموعة طلب واحد وبطاقة تبرير واحدة</p>
${requests.map(([n, t, I]) => `<div class="box" style="display:grid;grid-template-columns:58mm 1fr;gap:4mm;align-items:stretch;padding:2.5mm 3.5mm">
<div class="card" style="display:flex;flex-direction:column;justify-content:center;gap:1.5mm;font-size:12pt"><div style="display:flex;gap:2mm;align-items:center">${ic(I, "#5B2A6E", 22)}<span class="pill">طلب ${n}</span></div><b style="color:#5B2A6E">${t}</b></div>
<div><div class="lbl" style="margin-top:0">اخترنا:</div>${line(1)}<div class="lbl">لأنّ… والمعيار (معياران على الأقل):</div>${line(2)}</div></div>`).join("")}`)}

${page(`<h1>${ic(gi.GiClothes || pi.PiCoatHanger, "#E0607E", 30)} خزانة المجموعة</h1>
<p class="sub">تُطبع نسخة لكل مجموعة وتُقص البطاقات • بعض القطع لا تناسب أي طلب عن قصد: على المجموعة أن تكتشفها وتستبعدها مع التبرير</p>
<div class="closet">${closet.map(([I, t, c]) => `<div class="cl">${ic(I, c, 64)}<div class="t">${t}</div></div>`).join("")}</div>`)}

${page(`<h1>${stars(1)} التحدي: أنطلق</h1>
<p class="sub">الاسم: ……………………………… • صِلي كل قطعة بالموقف المناسب لها</p>
<div class="box"><div class="match">
${[[gi.GiWool, "ملابس صوفية داكنة", "حصة التربية البدنية"], [pi.PiDressFill, "ملابس قطنية فاتحة", "يوم شتوي بارد"], [gi.GiRunningShoe, "زيّ وحذاء رياضي", "حفل زواج"], [lu.LuPartyPopper, "فستان أنيق محتشم", "يوم صيفي حار"]]
  .map(([I, a, b]) => `<div class="it">${ic(I, "#E0607E", 30)} ${a}</div><div class="d">• · · · · •</div><div class="it">${b}</div>`).join("")}
</div></div>
<h1 style="margin-top:8mm">${stars(2)} التحدي: أتقدّم</h1>
<p class="sub">الاسم: ……………………………… • أكملي الجدول</p>
<table><tr><th>الموقف والملبس</th><th>مناسب / غير مناسب</th><th>المعيار</th><th>السبب</th></tr>
${["معطف صوفي داكن ليوم صيفي حار", "فستان قطني فاتح لنزهة صيفية", "حذاء رياضي لحفل زواج", "زيّ تراثي لاحتفال يوم التأسيس"].map((t) => `<tr><td class="h">${t}</td><td></td><td></td><td style="width:32%"></td></tr>`).join("")}
</table>`)}

${page(`<h1>${stars(3)} التحدي: أتألّق — الحقيبة الذكية</h1>
<p class="sub">الاسم: ……………………………… • رحلة عائلية مدتها ٣ أيام إلى منطقة باردة، فيها مناسبة عائلية. اختاري ٦ قطع فقط، وبرّري كل قطعة بمعيارين.</p>
<table class="tall"><tr><th style="width:8%">#</th><th>القطعة</th><th>المعيار الأول وسببه</th><th>المعيار الثاني وسببه</th></tr>
${["١", "٢", "٣", "٤", "٥", "٦"].map((n) => `<tr><td style="text-align:center;font-weight:700">${n}</td><td></td><td></td><td></td></tr>`).join("")}</table>
<div class="box" style="margin-top:5mm"><div class="lbl" style="margin-top:0">لماذا اكتفيتِ بهذه القطع الست؟ (فكّري: كيف تخدم القطعة الواحدة أكثر من موقف؟)</div>${line(3)}</div>`)}

${page(`<h1>${ic(lu.LuMail, "#E0607E", 30)} التقويم الختامي: دعوة لمى</h1>
<p class="sub">الاسم: ……………………………… • عمل فردي</p>
<div class="scen">دُعيت لمى إلى عشاء عائلي في ليلة شتوية باردة، فاختارت: فستانًا قطنيًا خفيفًا بلون فاتح، وحذاءً رياضيًا.</div>
<div class="box"><div class="lbl" style="margin-top:0">١) ما المعياران اللذان لم تراعهما لمى؟</div>${line(2)}
<div class="lbl">٢) اقترحي عليها إطلالة بديلة:</div>${line(3)}
<div class="lbl">٣) برّري اقتراحك بمعيارين على الأقل:</div>${line(4)}</div>
<div class="chk"><span>حدّدتُ المعيارين بدقة</span><span>اقترحتُ بديلًا مناسبًا</span><span>برّرتُ بمعيارين على الأقل</span></div>`)}

${page(`<div style="display:flex;flex-direction:column;gap:6mm">${[1, 2].map(() => `<div class="ticket">
<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#5B2A6E;font-size:13pt">${ic(lu.LuTicket, "#E0607E", 20)} بطاقة الخروج</b><span style="font-size:9.5pt">الاسم: ……………………</span></div>
<div class="q">١. اذكري ثلاثة من معايير اختيار الملابس.</div>${line(1)}
<div class="q">٢. علّلي: نفضّل الملابس القطنية الفاتحة في الصيف.</div>${line(2)}
<div class="q">٣. ماذا ترتدين في حفل اليوم الوطني بالمدرسة؟ برّري بمعيار.</div>${line(2)}
<div class="q">٤. أكملي: أعتزّ بلباسي المحتشم لأنّ…</div>${line(1)}
<div class="q">لوّني دائرة ثقتك:</div>
<div class="conf"><div><div class="dot" style="border-color:#2A9D8F"></div>أستطيع أن أشرح لغيري</div><div><div class="dot" style="border-color:#F2A93B"></div>فهمت وأحتاج تدريبًا</div><div><div class="dot" style="border-color:#E0607E"></div>أحتاج مساعدة</div></div>
</div>`).join("")}</div>`)}

${page(`<div style="display:flex;flex-direction:column;gap:6mm">${[1, 2].map(() => `<div class="ticket">
<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#5B2A6E;font-size:13pt">${ic(lu.LuTicket, "#E0607E", 20)} بطاقة الخروج</b><span style="font-size:9.5pt">الاسم: ……………………</span></div>
<div class="q">١. اذكري ثلاثة من معايير اختيار الملابس.</div>${line(1)}
<div class="q">٢. علّلي: نفضّل الملابس القطنية الفاتحة في الصيف.</div>${line(2)}
<div class="q">٣. ماذا ترتدين في حفل اليوم الوطني بالمدرسة؟ برّري بمعيار.</div>${line(2)}
<div class="q">٤. أكملي: أعتزّ بلباسي المحتشم لأنّ…</div>${line(1)}
<div class="q">لوّني دائرة ثقتك:</div>
<div class="conf"><div><div class="dot" style="border-color:#2A9D8F"></div>أستطيع أن أشرح لغيري</div><div><div class="dot" style="border-color:#F2A93B"></div>فهمت وأحتاج تدريبًا</div><div><div class="dot" style="border-color:#E0607E"></div>أحتاج مساعدة</div></div>
</div>`).join("")}</div>`)}

${page(`<h1>${ic(lu.LuClipboardCheck, "#E0607E", 30)} قائمة رصد المعلمة</h1>
<p class="sub">ضعي ✓ عند تحقق الهدف، و ~ عند تحققه جزئيًا • المصادر: الأسئلة السريعة، السبورات الصغيرة، التقويم الختامي، بطاقة الخروج</p>
<table class="names"><tr><th style="width:6%">#</th><th style="width:34%">اسم الطالبة</th><th>هـ١</th><th>هـ٢</th><th>هـ٣</th><th>هـ٤</th><th>هـ٥</th><th style="width:16%">مستوى التمايز</th></tr>
${Array.from({ length: 26 }, (_, i) => `<tr><td style="text-align:center">${(i + 1).toLocaleString("ar-SA")}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}</table>`)}

${page(`<h1>${ic(lu.LuScale, "#E0607E", 30)} سلّم تقدير نشاط «مستشارة الأناقة»</h1>
<p class="sub">لكل معيار من ١ إلى ٣ • المجموع من ١٢</p>
<table><tr><th>المعيار</th><th>متميزة (٣)</th><th>متمكنة (٢)</th><th>بحاجة إلى دعم (١)</th></tr>
<tr><td class="h">اللباس الشرعي</td><td>كل القطع ساترة وواسعة</td><td>محتشمة مع ملاحظة</td><td>قطعة غير محتشمة</td></tr>
<tr><td class="h">الموسم</td><td>القماش واللون يناسبان الطقس</td><td>تناسب جزئيًا</td><td>لا تناسب الطقس</td></tr>
<tr><td class="h">المناسبة</td><td>تناسب المناسبة تمامًا</td><td>تناسب جزئيًا</td><td>لا تناسب المناسبة</td></tr>
<tr><td class="h">قوة التبرير</td><td>تبرير بمعيارين أو أكثر</td><td>تبرير بمعيار واحد</td><td>اختيار بلا تبرير</td></tr></table>
<table style="margin-top:6mm"><tr><th>المجموعة</th><th>اللباس الشرعي</th><th>الموسم</th><th>المناسبة</th><th>التبرير</th><th>المجموع /١٢</th><th style="width:30%">ملاحظات</th></tr>
${["١", "٢", "٣", "٤", "٥"].map((n) => `<tr><td class="h" style="text-align:center">${n}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}</table>
`)}

${page(`<h1>${ic(lu.LuStar, "#F2A93B", 30)} نجمتان وأمنية (تقويم الأقران)</h1>
<p class="sub">تُقص البطاقات وتكتبها كل مجموعة لمجموعة أخرى بعد عرضها</p>
<div class="grid2">${[1, 2, 3, 4].map(() => `<div class="card" style="background:#fff;min-height:78mm"><b>من مجموعة …… إلى مجموعة ……</b><div class="lbl">${ic(lu.LuStar, "#F2A93B", 14)} نجمة:</div>${line(2)}<div class="lbl">${ic(lu.LuStar, "#F2A93B", 14)} نجمة:</div>${line(2)}<div class="lbl">أمنية:</div>${line(2)}</div>`).join("")}</div>`)}
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage();
  await pg.setContent(html, { waitUntil: "load" });
  await pg.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
  await browser.close();
  require("fs").writeFileSync(OUT.replace(/\.pdf$/, ".html"), html);
  console.log("wrote", OUT);
})();
