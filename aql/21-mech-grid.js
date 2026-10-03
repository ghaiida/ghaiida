
/* ---------- grid world (robot + battery) ---------- */
const DIRS = { U: [0, -1, '⬆️', 'تقدّم'], D: [0, 1, '⬇️', 'ارجع'], R: [1, 0, '➡️', 'يمين'], L: [-1, 0, '⬅️', 'يسار'] };
const dl = k => `${DIRS[k][2]} ${DIRS[k][3]}`;
function makeGrid(host, L, opt = {}) {
  const walls = new Set((L.walls || []).map(([x, y]) => x + ',' + y)), roads = new Set((L.roads || []).map(([x, y]) => x + ',' + y));
  let cells = '';
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const k = x + ',' + y, w = walls.has(k), g = x === L.goal[0] && y === L.goal[1];
    cells += `<div class="cell${w ? ' wall' : ''}${g ? ' goal' : ''}${roads.has(k) ? ' road' : ''}" data-k="${k}">${w ? (opt.wallIcon || '') : g ? (opt.goalIcon || '🔋') : (L.deco && L.deco[k]) || ''}</div>`;
  }
  host.innerHTML = `<div class="gridwrap"><div class="grid${opt.cls ? ' ' + opt.cls : ''}" style="--w:${L.w};--h:${L.h}" role="img" aria-label="متاهة">${cells}<div class="gbot">${robot('happy', 44)}</div></div></div>`;
  const B = $('.gbot', host); let pos;
  const place = (x, y) => { pos = [x, y]; B.style.setProperty('--x', x); B.style.setProperty('--y', y); };
  const mood = m => { B.innerHTML = robot(m, 44); };
  const trail = (x, y, on) => { const c = $(`.cell[data-k="${x},${y}"]`, host); if (c && !c.classList.contains('goal')) c.classList.toggle('trail', on); };
  function reset() { $$('.cell.trail', host).forEach(c => c.classList.remove('trail')); B.classList.add('nomove'); place(L.start[0], L.start[1]); void B.offsetWidth; B.classList.remove('nomove'); mood('happy'); }
  async function run(cmds, onStep, speed = 400) {
    reset(); await wait(250);
    for (let i = 0; i < cmds.length; i++) {
      onStep && onStep(i);
      const [dx, dy] = DIRS[cmds[i]], nx = pos[0] + dx, ny = pos[1] + dy;
      if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h || walls.has(nx + ',' + ny)) {
        mood('dizzy'); B.classList.remove('bump'); void B.offsetWidth; B.classList.add('bump'); sfx.oops();
        return { ok: false, i, why: nx < 0 || ny < 0 || nx >= L.w || ny >= L.h ? 'edge' : 'wall' };
      }
      trail(pos[0], pos[1], true); place(nx, ny); sfx.step(); await wait(speed);
    }
    const ok = pos[0] === L.goal[0] && pos[1] === L.goal[1]; mood(ok ? 'happy' : 'sad');
    return { ok, i: cmds.length - 1, why: ok ? '' : 'short', pos: [...pos] };
  }
  reset();
  return { run, reset };
}
const gridWhy = r => r.why === 'short' ? 'انتهت الأوامر… والروبوت لم يصل بعد.' : r.why === 'wall' ? `اصطدم الروبوت بجدار عند الأمر رقم <b>${ar(r.i + 1)}</b> 💥` : `خرج الروبوت من حدود المتاهة عند الأمر رقم <b>${ar(r.i + 1)}</b>`;

/* program editor: plain blocks + optional loop blocks. items: {t:'U'} | {t:'loop', n, body:[{t}]} */
function progEditor(host, { allowLoop = false, max = 24, onChange } = {}) {
  let prog = [], open = -1, locked = false;
  host.innerHTML = `<span class="lbl">الأوامر · اضغط لإضافتها</span><div class="palette">${['U', 'D', 'R', 'L'].map(k => `<button class="blk" data-add="${k}">${dl(k)}</button>`).join('')}${allowLoop ? '<button class="blk loop" data-loop>🔁 كرر</button>' : ''}</div>
    <span class="lbl" style="margin-top:12px">برنامجك <span class="cnt"></span></span><div class="prog"></div>`;
  const P = $('.prog', host);
  const count = () => prog.reduce((s, it) => s + (it.t === 'loop' ? 1 + it.body.length : 1), 0);
  function flat() { const f = []; prog.forEach((it, i) => { if (it.t === 'loop') { for (let r = 0; r < it.n; r++) it.body.forEach((b, j) => f.push({ c: b.t, ref: [i, j], rep: r })); } else f.push({ c: it.t, ref: [i, null] }); }); return f; }
  function draw() {
    $('.cnt', host).textContent = `(${ar(count())} قطعة)`;
    P.innerHTML = prog.map((it, i) => it.t === 'loop'
      ? `<span class="loopgrp" data-i="${i}"><span class="lx">🔁 كرر</span><span class="counter"><button data-dec="${i}" aria-label="أقل">−</button><b>${ar(it.n)}</b><button data-inc="${i}" aria-label="أكثر">+</button></span><span class="lx">مرات:</span>${it.body.map((b, j) => `<button class="blk" data-i="${i}" data-j="${j}">${dl(b.t)}</button>`).join('') || '<span class="ph">ضع الأوامر هنا</span>'}${open === i ? `<button class="btn sm ghost" data-close="${i}">تم ✓</button>` : `<button class="btn sm ghost" data-open="${i}">✎</button>`}<button class="btn sm ghost" data-del="${i}" aria-label="حذف الحلقة">✕</button></span>`
      : `<button class="blk" data-i="${i}">${dl(it.t)}</button>`).join('') || '<span class="ph">برنامجك فارغ… اضغط الأوامر بالأعلى</span>';
    onChange && onChange();
  }
  host.addEventListener('click', e => {
    if (locked) return;
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.add) { if (count() >= max) return; if (open >= 0) prog[open].body.push({ t: d.add }); else prog.push({ t: d.add }); sfx.tap(); }
    else if ('loop' in d) { if (count() >= max) return; prog.push({ t: 'loop', n: 2, body: [] }); open = prog.length - 1; sfx.tap(); }
    else if (d.inc) prog[+d.inc].n = Math.min(12, prog[+d.inc].n + 1);
    else if (d.dec) prog[+d.dec].n = Math.max(1, prog[+d.dec].n - 1);
    else if (d.close) open = -1;
    else if (d.open) open = +d.open;
    else if (d.del) { prog.splice(+d.del, 1); open = -1; }
    else if (d.i !== undefined && t.classList.contains('blk')) { if (d.j !== undefined) prog[+d.i].body.splice(+d.j, 1); else { prog.splice(+d.i, 1); if (open > +d.i) open--; } }
    else return;
    draw();
  });
  draw();
  return {
    get prog() { return prog; }, set prog(p) { prog = p; open = -1; draw(); }, count, flat,
    lock(v) { locked = v; }, clear() { prog = []; open = -1; draw(); },
    mark(ref, cls) { $$('.blk', P).forEach(b => b.classList.remove('on', 'bad')); if (!ref) return; const sel = ref[1] === null ? `.blk[data-i="${ref[0]}"]:not([data-j])` : `.blk[data-i="${ref[0]}"][data-j="${ref[1]}"]`; const el = $(sel, P); if (el) el.classList.add(cls); }
  };
}

/* ---------- b3b: maze ---------- */
MECH.maze = ctx => {
  const LV = ctx.cfg.levels; let lv = 0;
  function start() {
    ctx.host.innerHTML = `<span class="tag">${lv ? 'تدريب: متاهة أصعب' : 'المتاهة ١'}</span><div class="two" style="margin-top:10px"><div id="g"></div><div><div id="ed"></div>
      <div class="row"><button class="btn emerald" id="run">▶ تشغيل الخوارزمية</button><button class="btn ghost sm" id="clr">مسح</button></div></div></div>`;
    const g = makeGrid($('#g'), LV[lv]); const ed = progEditor($('#ed'), { max: 24 });
    let busy = false;
    $('#clr').onclick = () => { if (busy) return; ed.clear(); g.reset(); ctx.clear(); };
    $('#run').onclick = async () => {
      if (busy) return; const f = ed.flat(); if (!f.length) { ctx.info('أضف أوامر أولًا، ثم شغّل.'); return; }
      busy = true; ed.lock(true); ctx.clear();
      const r = await g.run(f.map(x => x.c), i => ed.mark(f[i].ref, 'on'));
      busy = false; ed.lock(false);
      if (r.ok) {
        ed.mark(null); ctx.ok('الخوارزمية تعمل! 🎯 وصل الروبوت إلى البطارية.'); ctx.say('بطارية كاملة! ⚡ شكرًا لأنك أعطيتني أوامر دقيقة.', 'happy');
        if (lv === 0) { ctx.reveal(); lv++; later(() => { start(); ctx.info('متاهة جديدة للتدريب. نفس الفكرة… طريق أطول.'); }, 2400); } else ctx.complete();
      } else {
        if (r.why !== 'short') ed.mark(f[r.i].ref, 'bad');
        ctx.fail(`الروبوت لم يصل للهدف 🤖 ${gridWhy(r)}<br>راجع خطواتك… أين أعطيت الروبوت أمرًا غير مناسب؟`, { noCheck: true });
        ctx.say(r.why === 'short' ? 'توقفت في منتصف الطريق… ما زلت أحتاج أوامر!' : 'آخ! 💫 أحد الأوامر لم يكن مناسبًا.', r.why === 'short' ? 'sad' : 'dizzy');
      }
    };
  }
  start();
};

/* ---------- b4: translate algorithm to code ---------- */
MECH.translate = ctx => {
  const ROWS = [
    ['اطلب من الطالب سعر الصنف', ['price = input("السعر؟")', 'print(price)', 'price = 3 + 3'], 0, 'print تعرض شيئًا، لكننا نريد أن <b>نستقبل</b> قيمة.'],
    ['اطلب منه الكمية', ['qty = print("الكمية")', 'qty = input("الكمية؟")', 'input = qty'], 1, 'لاستقبال قيمة من المستخدم نستخدم <span class="ltr">input</span>.'],
    ['احسب الإجمالي = السعر × الكمية', ['total = price + qty', 'print("total")', 'total = price * qty'], 2, 'انتبه للعملية: الضرب في البرمجة نكتبه <span class="ltr">*</span>.'],
    ['اعرض الإجمالي على الشاشة', ['input(total)', 'print(total)', 'total = 0'], 1, 'العرض على الشاشة = <span class="ltr">print</span>.']
  ];
  let r = 0; const chosen = [];
  function show() {
    ctx.host.innerHTML = `<div class="two"><div><span class="lbl">الخوارزمية (بالعربي)</span><ol class="slots">${ROWS.map((x, i) => `<li${i > r ? ' class="empty"' : ''}><span class="card${i < r ? ' ok' : i === r ? ' on' : ''}" style="cursor:default">${x[0]}</span></li>`).join('')}</ol></div>
      <div><span class="lbl">البرنامج (بايثون)</span><div class="code py" id="py">${chosen.map(c => esc(c)).join('\n') || '<span class="c"># سيظهر برنامجك هنا</span>'}</div>
      ${r < ROWS.length ? `<span class="lbl" style="margin-top:12px">أي سطر يطابق: «${ROWS[r][0]}»؟</span><div class="cards" style="flex-direction:column;align-items:stretch">${ROWS[r][1].map((c, i) => `<button class="card" data-i="${i}" style="direction:ltr;text-align:left;font-family:var(--f-mono);font-size:.9rem">${esc(c)}</button>`).join('')}</div>` : ''}</div></div>`;
    const cs = $$('.cards .card', ctx.host);
    cs.forEach(b => b.onclick = () => {
      if (b.disabled) return;
      if (+b.dataset.i === ROWS[r][2]) { sfx.ok(); chosen.push(ROWS[r][1][ROWS[r][2]]); r++; ctx.clear(); if (r < ROWS.length) show(); else runPhase(); }
      else { b.classList.add('bad'); b.disabled = true; ctx.fail(ROWS[r][3], { noCheck: true }); }
    });
  }
  function runPhase() {
    show(); ctx.say('البرنامج مكتوب! الآن جرّبه بنفسك: أنت المستخدم.', 'wow'); ctx.reveal();
    const box = document.createElement('section'); box.className = 'panel';
    box.innerHTML = `<span class="eyebrow">شغّل برنامجك</span><div class="two" style="margin-top:8px"><div><label class="lbl" for="pr">السعر؟</label><input class="field" id="pr" type="number" value="3" min="0"><label class="lbl" for="qt" style="margin-top:8px">الكمية؟</label><input class="field" id="qt" type="number" value="4" min="0"><div class="row"><button class="btn emerald" id="go">▶ شغّل</button></div></div>
      <div><span class="lbl">ماذا يحدث داخل الحاسب</span><div class="code" id="trace"></div><div class="out" id="out" style="margin-top:10px">—</div></div></div>`;
    $('#after').appendChild(box); later(() => box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }), 600);
    let ran = false;
    $('#go', box).onclick = async () => {
      const p = +$('#pr').value || 0, q = +$('#qt').value || 0, T = $('#trace');
      const lines = [`price = ${p}  ← من المستخدم`, `qty = ${q}  ← من المستخدم`, `total = ${p} × ${q} = ${p * q}`, `print(${p * q})`];
      T.innerHTML = ''; $('#out').textContent = '…';
      for (const l of lines) { T.insertAdjacentHTML('beforeend', `<div class="cl on">${esc(l)}</div>`); sfx.step(); await wait(450); T.lastElementChild.classList.remove('on'); }
      $('#out').textContent = `الإجمالي: ${ar(p * q)} ريال`;
      if (!ran) { ran = true; ctx.complete(); }
    };
  }
  show();
};

/* ---------- b5: testing (boundary case) ---------- */
MECH.tester = ctx => {
  let fixed = false, found = false;
  const prog = () => [['<span class="vr">الدرجة</span> = أدخل()', ''], [`<span class="kw">إذا</span> <span class="vr">الدرجة</span> ${fixed ? '≥' : '>'} ٥٠:`, ''], ['اطبع «ناجح ✅»', 'ind'], ['<span class="kw">وإلا</span>:', ''], ['اطبع «راسب ❌»', 'ind']];
  const run = g => (fixed ? g >= 50 : g > 50) ? 'ناجح ✅' : 'راسب ❌';
  const expect = g => g >= 50 ? 'ناجح ✅' : 'راسب ❌';
  const rows = [];
  ctx.host.innerHTML = `<div class="two"><div><span class="lbl">برنامج زميلك</span><div class="code" id="code"></div>
      <p class="small muted" style="margin-top:8px">المطلوب: الطالب <b>ناجح</b> إذا كانت درجته <b>٥٠ أو أكثر</b>.</p></div>
    <div><span class="lbl">اختر درجة لتجربتها</span><div class="cards" id="vals">${[10, 30, 49, 50, 51, 80, 100].map(v => `<button class="card" data-v="${v}">${ar(v)}</button>`).join('')}</div>
      <div class="row" style="margin-top:10px"><input class="field" id="cv" type="number" min="0" max="100" placeholder="أو اكتب درجة" style="max-width:150px"><button class="btn sm royal" id="try">جرّب</button></div></div></div>
    <div class="tablewrap" style="margin-top:14px"><table class="ttable"><thead><tr><th>الدرجة</th><th>المتوقّع</th><th>ناتج البرنامج</th><th>النتيجة</th></tr></thead><tbody id="tb"><tr><td colspan="4" class="muted">لم تُجرِ أي اختبار بعد</td></tr></tbody></table></div><div id="fix"></div>`;
  const drawCode = () => { $('#code').innerHTML = prog().map(([t, c], i) => `<div class="cl ${c}"><span class="n">${i + 1}</span>${t}</div>`).join(''); };
  drawCode();
  function test(g) {
    if (isNaN(g) || g < 0 || g > 100) { ctx.info('اختر درجة من ٠ إلى ١٠٠.'); return; }
    const out = run(g), ex = expect(g), ok = out === ex;
    rows.unshift(`<tr><td class="num">${ar(g)}</td><td>${ex}</td><td>${out}</td><td class="${ok ? 'ok' : 'bad'}">${ok ? '✓ صحيح' : '✗ خطأ!'}</td></tr>`);
    $('#tb').innerHTML = rows.join(''); ok ? sfx.step() : sfx.oops();
    if (!ok && !found && !fixed) {
      found = true; ctx.bug();
      ctx.say('وجدتها! 😮 الطالب الذي درجته ٥٠ ناجح، لكن البرنامج قال «راسب»!', 'wow');
      fbox(ctx.fbEl, 'اكتشفت <b>حالة حدّية</b> يخطئ فيها البرنامج. الآن: كيف نصلحه؟', 'info', '🐞');
      $('#fix').innerHTML = `<div class="stage" style="margin-top:14px"><span class="lbl">ما الإصلاح الصحيح للسطر ٢؟</span><div class="cards" id="fx">
        <button class="card" data-f="1">غيّر <span class="ltr">&gt;</span> إلى <span class="ltr">≥</span> (أكبر من أو يساوي)</button><button class="card" data-f="0">احذف «وإلا» والسطر الذي بعدها</button><button class="card" data-f="2">غيّر ٥٠ إلى ٦٠</button></div></div>`;
      $('#fx').onclick = async e => {
        const b = e.target.closest('.card'); if (!b || b.disabled) return;
        if (b.dataset.f === '1') {
          fixed = true; drawCode(); $$('#fx .card').forEach(x => x.disabled = true); b.classList.add('ok');
          ctx.ok('تم الإصلاح. لنعِد كل الاختبارات للتأكد…'); rows.length = 0;
          for (const g of [30, 49, 50, 51, 80]) { test(g); await wait(350); }
          ctx.ok('كل الاختبارات صحيحة الآن ✓ البرنامج جاهز فعلًا.'); ctx.complete();
        } else { b.classList.add('bad'); b.disabled = true; ctx.fail(b.dataset.f === '0' ? 'بدون «وإلا» لن يطبع البرنامج شيئًا للراسبين!' : 'هذا يجعل البرنامج يخطئ مع درجات أكثر (٥٠ إلى ٥٩)!', { noCheck: true }); }
      };
    } else if (ok && !found && rows.length >= 3 && rows.length % 3 === 0) ctx.info('كل اختباراتك صحيحة حتى الآن… هل جرّبت درجة <b>على الحدّ</b> تمامًا؟');
  }
  $('#vals').onclick = e => { const b = e.target.closest('.card'); if (b) test(+b.dataset.v); };
  $('#try').onclick = () => test(parseInt($('#cv').value, 10));
};

/* ---------- b6: debug with magnifier ---------- */
MECH.debugGrid = ctx => {
  const { L, good, bugAt, wrong } = ctx.cfg; const prog = [...good]; prog[bugAt] = wrong;
  let ran = false, found = false, busy = false;
  ctx.host.innerHTML = `<div class="two"><div id="g"></div><div><span class="lbl">البرنامج <span id="mode" class="tag am">شغّله أولًا</span></span><div class="code" id="code"></div>
    <div class="row"><button class="btn emerald" id="run">▶ شغّل</button></div><div id="repair"></div></div></div>`;
  const g = makeGrid($('#g'), L);
  const draw = () => { $('#code').innerHTML = prog.map((k, i) => `<div class="cl${ran && !found ? ' pick' : ''}" data-i="${i}"><span class="n">${ar(i + 1)}</span>${dl(k)}</div>`).join(''); };
  draw();
  $('#run').onclick = async () => {
    if (busy) return; busy = true; ctx.clear();
    const lines = () => $$('#code .cl');
    const r = await g.run(prog, i => lines().forEach((l, j) => l.classList.toggle('on', j === i)));
    busy = false; lines().forEach(l => l.classList.remove('on'));
    if (r.ok) { ctx.ok('الروبوت وصل! الإصلاح نجح ✓'); ctx.say('أعمل بشكل ممتاز الآن! 🔋', 'happy'); ctx.complete(); return; }
    if (!ran) { ran = true; $('#mode').textContent = '🔍 العدسة مفعّلة: اضغط على السطر المشبوه'; draw(); }
    else if (found) { draw(); }
    ctx.say('الروبوت لم يصل… 🤖 الخطأ ليس بالضرورة في السطر الذي اصطدم عنده. تتبّع الطريق.', 'think');
    fbox(ctx.fbEl, `${gridWhy(r)} استخدم العدسة 🔍 واضغط على السطر الذي تظنه سبب المشكلة.`, 'bad');
  };
  $('#code').onclick = e => {
    const l = e.target.closest('.cl'); if (!l || !ran || found || busy) return; const i = +l.dataset.i;
    if (i === bugAt) {
      found = true; ctx.bug(); l.classList.add('hit'); $$('#code .cl').forEach(x => x.classList.remove('pick'));
      $('#mode').textContent = '🐞 وجدت الحشرة!'; ctx.say('لقد وجدت Bug! 🐞 الآن اختر الأمر الصحيح لهذا السطر.', 'wow');
      fbox(ctx.fbEl, `السطر <b>${ar(i + 1)}</b> يحرّك الروبوت في الاتجاه الخطأ.`, 'ok', '🐞');
      $('#repair').innerHTML = `<span class="lbl" style="margin-top:12px">بدّل السطر ${ar(i + 1)} بـ:</span><div class="palette">${['U', 'D', 'R', 'L'].map(k => `<button class="blk" data-k="${k}">${dl(k)}</button>`).join('')}</div>`;
      $('#repair').onclick = ev => { const b = ev.target.closest('[data-k]'); if (!b || busy) return; prog[i] = b.dataset.k; draw(); $$('#code .cl')[i].classList.add('hit'); ctx.info('بدّلت السطر. شغّل البرنامج لتتأكد أن الإصلاح يعمل ▶'); };
    } else { l.classList.add('miss'); later(() => l.classList.remove('miss'), 700); ctx.fail(`السطر ${ar(i + 1)} سليم ✓ استمر في البحث.`, { noCheck: true }); }
  };
};

/* ---------- b7: optimize with a loop ---------- */
MECH.optimize = ctx => {
  const { L, long, max } = ctx.cfg;
  ctx.host.innerHTML = `<div class="two"><div id="g"></div><div><span class="lbl">البرنامج الحالي (${ar(long.length)} أوامر) ✓ يعمل</span><div class="prog" style="border-style:solid">${long.map(k => `<span class="blk" style="cursor:default">${dl(k)}</span>`).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" id="demo">▶ شاهده يعمل</button></div>
    <div id="ed" style="margin-top:14px"></div><div class="row"><button class="btn emerald" id="run">▶ شغّل نسختك</button><button class="btn ghost sm" id="clr">مسح</button></div></div></div>`;
  const g = makeGrid($('#g'), L); const ed = progEditor($('#ed'), { allowLoop: true, max: 12 });
  let busy = false;
  $('#demo').onclick = async () => { if (busy) return; busy = true; await g.run(long, null, 230); busy = false; };
  $('#clr').onclick = () => { if (busy) return; ed.clear(); g.reset(); ctx.clear(); };
  $('#run').onclick = async () => {
    if (busy) return; const f = ed.flat(); if (!f.length) { ctx.info('ابنِ نسختك أولًا.'); return; }
    busy = true; ed.lock(true); ctx.clear();
    const r = await g.run(f.map(x => x.c), i => ed.mark(f[i].ref, 'on'), 300);
    busy = false; ed.lock(false); ed.mark(null);
    if (!r.ok) { if (r.why !== 'short') ed.mark(f[r.i].ref, 'bad'); ctx.fail(gridWhy(r) + ' هل وضعت الأوامر داخل الحلقة؟ وهل عدد المرات صحيح؟'); return; }
    const n = ed.count();
    if (n > max) { ctx.info(`يعمل! 👍 لكن نسختك ${ar(n)} قطع. هل تستطيع الوصول إلى ${ar(max)} قطع أو أقل؟`); ctx.say('أقصر قليلًا… أنا متأكد أنك تستطيع!', 'think'); return; }
    ctx.ok(`رائع! من ${ar(long.length)} أوامر إلى ${ar(n)} قطع فقط، ونفس النتيجة تمامًا.`); ctx.say('برنامج أقصر = أسهل في القراءة وأسهل في الإصلاح ✨', 'happy'); ctx.complete();
  };
};
