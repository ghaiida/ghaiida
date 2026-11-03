// يحوّل qiraa.html إلى PDF بحجم A4، ويفحص أن لا صفحة يفيض محتواها.
// الاستخدام: node qiraa/pdf.js [--shots DIR]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const root = path.resolve(__dirname, '..');
  const shotsIdx = process.argv.indexOf('--shots');
  const shots = shotsIdx > 0 ? process.argv[shotsIdx + 1] : null;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + path.join(root, 'qiraa.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
    const pb = p.querySelector('.pb'); const r = p.getBoundingClientRect();
    let worst = 0;
    pb.querySelectorAll('*').forEach(e => { const b = e.getBoundingClientRect(); if (b.width) worst = Math.max(worst, b.bottom - (r.bottom - 50), r.left + 18 - b.left, b.right - (r.right - 18)); });
    return worst > 0 ? `page ${i + 1}: overflow ${Math.round(worst)}px` : null;
  }).filter(Boolean));
  console.log(over.length ? over.join('\n') : 'no overflow');
  if (shots) {
    const n = await page.locator('.page').count();
    await page.addStyleTag({ content: '.toolbar{display:none}.page{margin:0!important}' });
    for (let i = 0; i < n; i++) await page.locator('.page').nth(i).screenshot({ path: path.join(shots, `p${String(i + 1).padStart(3, '0')}.png`) });
  }
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.join(root, 'qiraa', 'sullam-alqiraa.pdf'), preferCSSPageSize: true, printBackground: true });
  await browser.close();
})();
