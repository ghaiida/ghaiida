// Records a promo walkthrough of the studio game -> webm
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const FONTS = "/tmp/claude-0/-home-user-ghaiida/8c57392b-5736-570d-9636-fccf5e905874/scratchpad/build/node_modules/@fontsource";
const W = 1280, H = 720;

const fontCSS = [500, 600, 700].map((w) => `@font-face{font-family:"El Messiri";font-weight:${w};src:url(file://${FONTS}/el-messiri/files/el-messiri-arabic-${w}-normal.woff2) format("woff2");}`).join("")
  + [400, 500, 600, 700].map((w) => `@font-face{font-family:"IBM Plex Sans Arabic";font-weight:${w};src:url(file://${FONTS}/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-${w}-normal.woff2) format("woff2");}`).join("");

const overlayCSS = `
${fontCSS}
.stage svg { width: 232px !important; } .app { padding-block: 8px 20px !important; gap: 10px !important; } .stage { min-height: 0 !important; }
#vcur { position: fixed; z-index: 9999; width: 30px; height: 30px; border-radius: 50%; background: rgba(242,169,59,.95); border: 3px solid #fff; box-shadow: 0 4px 14px rgba(0,0,0,.25); left: 800px; top: 450px; transform: translate(-50%,-50%); transition: left .75s cubic-bezier(.4,0,.2,1), top .75s cubic-bezier(.4,0,.2,1); pointer-events: none; }
#vcur.tap::after { content: ""; position: absolute; inset: -14px; border-radius: 50%; border: 3px solid rgba(242,169,59,.9); animation: rip .5s ease-out forwards; }
@keyframes rip { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
#vcap { position: fixed; z-index: 9998; left: 50%; bottom: 22px; transform: translateX(-50%); max-width: 84%; background: rgba(43,27,51,.94); color: #fff; font-family: "El Messiri", serif; font-weight: 700; font-size: 30px; line-height: 1.45; padding: 12px 28px; border-radius: 20px; text-align: center; direction: rtl; opacity: 0; transition: opacity .35s; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
#vcap.on { opacity: 1; }
#vcap b { color: #F2A93B; }
#vmark { position: fixed; z-index: 9997; bottom: 26px; left: 18px; background: rgba(91,42,110,.92); color: #fff; font-family: "IBM Plex Sans Arabic", sans-serif; font-weight: 700; font-size: 18px; padding: 6px 16px; border-radius: 999px; direction: rtl; }
#vcard { pointer-events: none; position: fixed; inset: 0; z-index: 10000; background: #5B2A6E; color: #fff; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 40px; padding: 50px 80px; direction: rtl; opacity: 0; transition: opacity .6s; font-family: "IBM Plex Sans Arabic", sans-serif; }
#vcard.on { opacity: 1; }
#vcard h1 { font-family: "El Messiri", serif; font-size: 74px; line-height: 1.15; margin: 0; color: #fff; }
#vcard .k { display: inline-block; background: #F2A93B; color: #2B1B33; font-weight: 700; font-size: 26px; padding: 6px 22px; border-radius: 999px; margin-bottom: 18px; }
#vcard p { font-size: 28px; color: #EAD8F0; margin: 14px 0 0; }
#vcard ul { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 10px; font-size: 26px; }
#vcard li::before { content: "✓"; color: #F2A93B; font-weight: 700; margin-left: 14px; }
#vcard .rights { margin-top: 30px; font-size: 26px; color: #F2A93B; font-weight: 700; }
#vcard .art svg { width: 100%; max-height: 600px; }
`;

(async () => {
  const outDir = path.join(__dirname, "rec");
  fs.rmSync(outDir, { recursive: true, force: true });
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + fs.readFileSync(path.join(__dirname, "studio.html"), "utf8") + "</body></html>";
  fs.writeFileSync(path.join(__dirname, "rec_page.html"), html);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: outDir, size: { width: W, height: H } } });
  const p = await ctx.newPage();
  await p.goto("file://" + path.join(__dirname, "rec_page.html"), { waitUntil: "load" });
  await p.addStyleTag({ content: overlayCSS });
  await p.evaluate(() => {
    for (const [id, tag] of [["vcur", "div"], ["vcap", "div"], ["vmark", "div"], ["vcard", "div"]]) { const e = document.createElement(tag); e.id = id; document.body.appendChild(e); }
    document.getElementById("vmark").textContent = "© منصة راء";
  });
  await p.evaluate(() => document.fonts.ready);
  const wait = (ms) => p.waitForTimeout(ms);
  const cap = async (html) => { await p.evaluate((h) => { const c = document.getElementById("vcap"); c.classList.remove("on"); setTimeout(() => { c.innerHTML = h; c.classList.add("on"); }, h ? 250 : 0); if (!h) c.innerHTML = ""; }, html); await wait(300); };
  const moveTo = async (sel) => {
    const el = await p.$(sel); await el.scrollIntoViewIfNeeded(); const bb = await el.boundingBox();
    await p.evaluate(([x, y]) => { const c = document.getElementById("vcur"); c.style.left = x + "px"; c.style.top = y + "px"; }, [bb.x + bb.width / 2, bb.y + bb.height / 2]);
    await wait(800);
  };
  const tap = async (sel, after = 700) => {
    await moveTo(sel);
    await p.evaluate(() => { const c = document.getElementById("vcur"); c.classList.remove("tap"); void c.offsetWidth; c.classList.add("tap"); });
    await p.click(sel); await wait(after);
  };
  const typeIn = async (sel, text) => { await moveTo(sel); await p.click(sel); await p.type(sel, text, { delay: 55 }); await wait(400); };
  const card = async (html, ms) => {
    await p.evaluate((h) => { const c = document.getElementById("vcard"); c.innerHTML = h; c.classList.add("on"); }, html);
    await wait(ms);
    await p.evaluate(() => document.getElementById("vcard").classList.remove("on"));
    await wait(650);
  };
  const heroArt = await p.evaluate(() => document.getElementById("heroArt").innerHTML);

  // 1. intro card
  await card(`<div><span class="k">لعبة تفاعلية جديدة</span><h1>استوديو المصممة الصغيرة</h1><p>لدرس «اختيار الملابس» • الصف السادس الابتدائي</p><p style="color:#F2A93B;font-weight:700">من منصة راء</p></div><div class="art">${heroArt}</div>`, 4200);

  // 2. home
  await cap("لعبة تجمع <b>التفكير الإبداعي</b> و<b>التفكير الناقد</b> واتخاذ القرار");
  await moveTo(".hero h2"); await wait(1800);
  await cap("وضعان للعب: صمّمي الإطلالة… والمستشارة الناقدة");
  await moveTo("#goDesign"); await wait(900); await moveTo("#goSpot"); await wait(900);
  await tap("#goDesign", 900);

  // 3. design
  await cap("يصل إلى الاستوديو <b>طلب عميلة</b>: لمى ستزور جدتها في ليلة شتوية");
  await moveTo("#brief .req"); await wait(2600);
  await cap("تلبس الطالبة المانيكان <b>قطعة قطعة</b>");
  await tap("#items .item:nth-child(2)", 900);
  await cap("وتختار اللون والنقش <b>بإبداعها</b>");
  await tap(".sw:nth-child(2)", 600); await tap(".pat:nth-child(2)", 900);
  await tap("#tabs button:nth-child(2)", 400); await tap("#items .item:nth-child(2)", 800);
  await tap("#tabs button:nth-child(3)", 400); await tap("#items .item:nth-child(2)", 800);
  await cap("ماذا لو اختارت <b>صندلًا صيفيًا</b>؟");
  await tap("#tabs button:nth-child(4)", 400); await tap("#items .item:nth-child(2)", 1200);
  await cap("تسمّي إطلالتها وتكتب <b>تبريرها</b>");
  await typeIn("#nameIn", "دفء الجدّة");
  await typeIn("#whyIn", "اخترتُ خطوطًا طولية ولونًا بنفسجيًا يناسب بشرتها الحنطية");
  await tap("#evalBtn", 900);
  await cap("<b>تقرير المستشارة</b> يقيّم الإطلالة بالأمور السبعة من الدرس");
  await moveTo("#report .checks li:nth-child(1)"); await wait(1600);
  await cap("تغذية راجعة فورية: <b>الصندل لا يناسب الشتاء</b>");
  await moveTo("#report .checks li.no"); await wait(2600);
  await cap("تعدّل الطالبة إطلالتها…");
  await tap("#editBtn", 500);
  await tap("#tabs button:nth-child(4)", 400); await tap("#items .item:nth-child(1)", 900);
  await tap("#evalBtn", 600);
  await cap("…وتحصل على <b>النجوم الثلاث!</b>");
  await moveTo("#report .stars"); await wait(2800);

  // 4. spot mode
  await p.evaluate(() => window.scrollTo({ top: 0 }));
  await tap("#homeBtn", 600);
  await tap("#goSpot", 900);
  await cap("<b>المستشارة الناقدة</b>: إطلالة جاهزة فيها أخطاء");
  await moveTo("#spotBrief .req"); await wait(2200);
  await cap("تحدد الطالبة القطع غير المناسبة لطلب العميلة");
  await tap(".piece:nth-child(2)", 500); await tap(".piece:nth-child(3)", 500); await tap(".piece:nth-child(4)", 700);
  await tap("#spotCheck", 900);
  await cap("وتتعرف على <b>سبب كل قطعة</b>");
  await moveTo(".piece:nth-child(2) .why"); await wait(2600);
  await cap("");

  // 5. outro card
  await card(`<div><h1 style="font-size:62px">استوديو المصممة الصغيرة</h1><ul><li>يعمل على السبورة التفاعلية والجوال</li><li>دون تنزيل أو تثبيت</li><li>مبني على محتوى درس «اختيار الملابس»</li><li>جزء من حقيبة درس متكاملة</li></ul><p style="color:#fff;font-weight:700;margin-top:26px">للطلب تواصلي معنا</p><div class="rights">جميع الحقوق محفوظة © منصة راء ٢٠٢٦</div></div><div class="art">${heroArt}</div>`, 5200);

  await ctx.close(); await browser.close();
  const f = fs.readdirSync(outDir).find((x) => x.endsWith(".webm"));
  fs.renameSync(path.join(outDir, f), path.join(__dirname, "promo.webm"));
  console.log("ok");
})();
