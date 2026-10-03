
/* ---------- t5: variables ---------- */
MECH.vars = ctx => {
  let score = 10, got = 0;
  ctx.host.innerHTML = `<div class="two"><div><span class="lbl">اضغط العملات الذهبية 🪙</span><div class="coinfield" id="cf"></div></div>
    <div><span class="lbl">ذاكرة اللعبة</span><div class="vars"><div class="vbox" id="vb"><div class="vn">النقاط</div><div class="vv num" id="vv">${ar(score)}</div></div></div>
    <div class="code" id="vl" style="margin-top:12px"><div class="cl"><span class="vr">النقاط</span> = ١٠</div></div></div></div><div id="ask"></div>`;
  const spawn = () => {
    const f = $('#cf'); if (!f) return; const c = document.createElement('button'); c.className = 'coin'; c.textContent = '+٥'; c.setAttribute('aria-label', 'عملة +٥');
    c.style.left = rand(8, 80) + '%'; c.style.top = rand(10, 60) + '%'; f.appendChild(c);
    c.onclick = () => {
      if (c.classList.contains('got')) return; c.classList.add('got'); later(() => c.remove(), 500);
      const old = score; score += 5; got++; sfx.ok();
      const vb = $('#vb'); vb.classList.remove('pulse'); void vb.offsetWidth; vb.classList.add('pulse'); $('#vv').textContent = ar(score);
      $('#vl').insertAdjacentHTML('beforeend', `<div class="cl hit"><span class="vr">النقاط</span> = <span class="vr">النقاط</span> + ٥ <span style="color:var(--term-dim)">← ${ar(old)} + ٥ = ${ar(score)}</span></div>`);
      if (got < 3) later(spawn, 300); else askWhat();
    };
  };
  spawn();
  function askWhat() {
    ctx.say('النقاط كانت ١٠… ثم ١٥… ثم ٢٠… ثم ٢٥. <b>ماذا حدث؟</b>', 'think');
    $('#ask').innerHTML = `<div class="stage" style="margin-top:14px"><span class="lbl">ماذا حدث في ذاكرة اللعبة؟</span><div class="cards" id="aw">
      <button class="card" data-a="0">ظهر صندوق جديد مع كل عملة</button><button class="card" data-a="1">نفس الصندوق «النقاط» بقي، وقيمته هي التي تغيّرت</button><button class="card" data-a="2">تغيّر اسم الصندوق إلى رقم جديد</button></div></div>`;
    $('#aw').onclick = e => {
      const b = e.target.closest('.card'); if (!b || b.disabled) return;
      if (b.dataset.a === '1') { b.classList.add('ok'); sfx.ok(); ctx.reveal(); phase2(); }
      else { b.classList.add('bad'); b.disabled = true; ctx.fail(b.dataset.a === '0' ? 'انظر جيدًا: صندوق واحد فقط طوال الوقت.' : 'الاسم بقي «النقاط». ما الذي تغيّر إذًا؟', { noCheck: true }); }
    };
  }
  function phase2() {
    const box = document.createElement('section'); box.className = 'panel';
    box.innerHTML = `<span class="eyebrow">غيّر قيم الصناديق… وشاهد اللعبة تتغير مباشرة</span>
      <div class="vars" style="margin-top:12px">
        <div class="vbox"><div class="vn">الاسم</div><input id="vN" value="غيث" maxlength="14" aria-label="الاسم"></div>
        <div class="vbox"><div class="vn">العمر</div><input id="vA" type="number" value="13" min="5" max="99" aria-label="العمر"></div>
        <div class="vbox"><div class="vn">السرعة</div><input id="vS" type="number" value="5" min="1" max="10" aria-label="السرعة"></div>
        <div class="vbox"><div class="vn">النقاط</div><input id="vP" type="number" value="80" min="0" max="999" aria-label="النقاط"></div></div>
      <div class="stage" style="margin-top:14px"><div class="bigq" id="gh"></div><div style="position:relative;height:70px;direction:ltr;border-radius:12px;background:repeating-linear-gradient(90deg,#DCE3F2 0 40px,#E8EDF8 40px 80px)"><div id="car" style="position:absolute;left:0;top:6px;transition:left .1s linear">${robot('happy', 48)}</div><span style="position:absolute;right:8px;top:18px;font-size:1.6rem">🏁</span></div>
      <div class="row"><button class="btn emerald" id="race">▶ ابدأ السباق</button><span class="chip" id="rt"></span></div></div><div class="pfb"></div>`;
    $('#after').appendChild(box); later(() => box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }), 500);
    const upd = () => { $('#gh').textContent = `أهلًا يا ${$('#vN').value || '…'}! عمرك ${ar($('#vA').value || 0)} سنة · نقاطك ${ar($('#vP').value || 0)}`; };
    ['vN', 'vA', 'vP'].forEach(i => $('#' + i).oninput = upd); upd();
    let raced = new Set(), running = false;
    $('#race').onclick = async () => {
      if (running) return; running = true; const sp = Math.max(1, Math.min(10, +$('#vS').value || 1)); const car = $('#car'), W = car.parentElement.clientWidth - 70;
      let x = 0, t = 0; car.style.left = '0px';
      while (x < W) { x += sp * 4; t++; car.style.left = Math.min(x, W) + 'px'; await wait(30); }
      running = false; raced.add(sp); $('#rt').textContent = `السرعة ${ar(sp)} ← ${ar(t)} خطوة`;
      if (raced.size >= 2) {
        fbox($('.pfb', box), 'غيّرت قيمة صندوق واحد (السرعة)… فتغيّرت اللعبة كلها!', 'ok');
        practiceQ(ctx, '<span class="ltr" style="font-family:var(--f-mono)">النقاط = ٢٠<br>النقاط = النقاط − ٥<br>النقاط = النقاط × ٢</span><br>ما قيمة <b>النقاط</b> في النهاية؟', [{ t: '٣٠', ok: true, r: '٢٠ − ٥ = ١٥، ثم ١٥ × ٢ = ٣٠. الصندوق يحفظ آخر قيمة.' }, { t: '٤٠', r: 'لا تنسَ السطر الثاني: نقصت ٥ أولًا.' }, { t: '٢٠', r: 'القيمة تغيّرت مرتين بعد السطر الأول!' }], () => ctx.complete());
      } else fbox($('.pfb', box), 'الآن غيّر قيمة <b>السرعة</b> وأعد السباق.', 'info');
    };
  }
};

/* ---------- t6: input → processing → output ---------- */
MECH.io = ctx => {
  const runs = new Set();
  ctx.host.innerHTML = `<div class="machine">
    <div class="mstep"><h4>📥 المدخلات</h4><label class="small" for="iN">ما اسمك؟</label><input class="field" id="iN" value="سارة"><label class="small" for="iA">كم عمرك؟</label><input class="field" id="iA" type="number" value="13" min="1" max="99"></div>
    <div class="marrow">←</div>
    <div class="mstep proc"><h4>⚙️ المعالجة</h4><div class="small" id="pp" style="line-height:1.9">العمر بعد ٥ سنوات = العمر + ٥</div></div>
    <div class="marrow">←</div>
    <div class="mstep"><h4>📤 المخرجات</h4><div class="screen" id="os">…</div></div></div>
    <div class="row c"><button class="btn emerald" id="go">▶ شغّل الآلة</button></div><div id="sortbox"></div>`;
  $('#go').onclick = async () => {
    const n = ($('#iN').value || '').trim() || 'صديقي', a = parseInt($('#iA').value, 10) || 0;
    $('#os').textContent = '…'; $('#pp').innerHTML = `العمر بعد ٥ سنوات = ${ar(a)} + ٥`; sfx.step(); await wait(600);
    $('#pp').innerHTML += `<br><b style="color:var(--amber)">= ${ar(a + 5)}</b>`; sfx.step(); await wait(500);
    $('#os').textContent = `مرحبًا يا ${n}! بعد ٥ سنوات سيكون عمرك ${ar(a + 5)} سنة 🎉`; sfx.ok();
    runs.add(n + '|' + a);
    if (runs.size === 1) ctx.info('غيّر الاسم أو العمر وشغّل الآلة مرة أخرى. ماذا يتغير؟');
    if (runs.size === 2) { ctx.say('عندما تغيّرت <b>المدخلات</b> تغيّرت <b>المخرجات</b>، والمعالجة بقيت نفسها!', 'wow'); ctx.reveal(); sortPhase(); }
  };
  function sortPhase() {
    const ITEMS = shuffle([['🎮 ضغطة زر القفز', 'in'], ['🔊 صوت الفوز', 'out'], ['👆 لمس الشاشة', 'in'], ['📺 النقاط على الشاشة', 'out'], ['📳 اهتزاز الجهاز', 'out'], ['⌨️ كتابة اسمك', 'in']]);
    let i = 0;
    const show = () => {
      if (i >= ITEMS.length) { $('#sortbox').innerHTML = ''; ctx.ok('ممتاز! كل لعبة تسمع منك (Input) ثم ترد عليك (Output).'); ctx.complete(); return; }
      $('#sortbox').innerHTML = `<div class="stage" style="margin-top:14px;text-align:center"><span class="lbl">في لعبة على الجوال: هذا مدخل أم مخرج؟ (${ar(i + 1)}/${ar(ITEMS.length)})</span><div class="bigq" style="font-size:1.5rem">${ITEMS[i][0]}</div>
        <div class="row c"><button class="btn royal" data-a="in">📥 مدخل Input</button><button class="btn emerald" data-a="out">📤 مخرج Output</button></div></div>`;
      $('#sortbox').onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === ITEMS[i][1]) { sfx.ok(); ctx.clear(); i++; show(); } else ctx.fail(ITEMS[i][1] === 'in' ? 'هذا شيء <b>أنت</b> تعطيه للعبة.' : 'هذا شيء <b>اللعبة</b> تعطيه لك.', { noCheck: true }); };
    };
    show();
  }
};

/* ---------- t7: bug hunt (number, condition, order) ---------- */
function squareSVG(sides) {
  const pts = [[30, 110], [110, 110], [110, 30], [30, 30], [30, 110]].slice(0, sides + 1);
  return `<svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="رسم"><rect x="0" y="0" width="140" height="140" rx="14" fill="#F7FAFF"/><polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#1F4FD8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
MECH.bugHunt = ctx => {
  const P = [
    { goal: 'ارسم <b>مربعًا</b> مغلقًا', lines: ['<span class="kw">كرر</span> ٣ مرات:', 'ارسم ضلعًا', 'استدر ٩٠°'], ind: [0, 1, 1], bug: 0,
      run: f => f ? squareSVG(4) : squareSVG(3), fix: ['غيّر ٣ إلى ٤', 'غيّر ٩٠° إلى ٤٥°', 'احذف «استدر»'], ok: 0, why: 'المربع له ٤ أضلاع، والحلقة تكررت ٣ مرات فقط. خطأ في <b>رقم</b>.' },
    { goal: 'شغّل المكيّف عندما يكون الجو <b>حارًا</b> (الحرارة ٣٨°)', lines: ['<span class="vr">الحرارة</span> = ٣٨', '<span class="kw">إذا</span> <span class="vr">الحرارة</span> &lt; ٣٠:', 'شغّل المكيّف ❄️'], ind: [0, 0, 1], bug: 1,
      run: f => `<div class="out">${f ? 'المكيّف يعمل ❄️😌' : 'المكيّف مطفأ… والجو ٣٨° 🥵'}</div>`, fix: ['غيّر &lt; إلى &gt;', 'غيّر ٣٨ إلى ٢٠', 'احذف السطر الأول'], ok: 0, why: 'الشرط معكوس! «أصغر من ٣٠» بدل «أكبر من ٣٠». خطأ في <b>علامة المقارنة</b>.' },
    { goal: 'اطبع مجموع ١٠ و ٢٠ (يجب أن يظهر <b>٣٠</b>)', lines: ['<span class="vr">المجموع</span> = ٠', 'اطبع <span class="vr">المجموع</span>', '<span class="vr">المجموع</span> = ١٠ + ٢٠'], ind: [0, 0, 0], bug: 1,
      run: f => `<div class="out">${f ? '٣٠ ✅' : '٠ ❓'}</div>`, fix: ['انقل «اطبع» إلى آخر البرنامج', 'غيّر ٠ إلى ٣٠', 'احذف السطر الثالث'], ok: 0, why: 'البرنامج طبع قبل أن يحسب! خطأ في <b>الترتيب</b>.' }
  ];
  let k = 0;
  function show() {
    const p = P[k]; let ran = false, found = false, fixed = false;
    ctx.host.innerHTML = `<div class="sorthead" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><span class="tag am">الحشرة ${ar(k + 1)} من ${ar(P.length)}</span><span class="chip">🐞 اصطدت: ${ar(k)}</span></div>
      <p class="bigq" style="margin-top:8px">🎯 المطلوب: ${p.goal}</p>
      <div class="two"><div><span class="lbl" id="md">١. شغّل البرنامج</span><div class="code" id="cd"></div><div class="row"><button class="btn emerald" id="run">▶ شغّل</button></div><div id="fx"></div></div>
      <div><span class="lbl">الناتج</span><div class="stage" id="res" style="display:grid;place-items:center;min-height:160px"><span class="muted">لم يُشغَّل بعد</span></div></div></div>`;
    const draw = () => {
      let L = p.lines.map((t, i) => [t, p.ind[i], i]);
      if (fixed && k === 2) L = [L[0], L[2], L[1]];
      if (fixed && k === 0) L[0][0] = '<span class="kw">كرر</span> ٤ مرات:';
      if (fixed && k === 1) L[1][0] = '<span class="kw">إذا</span> <span class="vr">الحرارة</span> &gt; ٣٠:';
      $('#cd').innerHTML = L.map(([t, ind, i], n) => `<div class="cl${ind ? ' ind' : ''}${ran && !found ? ' pick' : ''}" data-i="${i}"><span class="n">${ar(n + 1)}</span>${t}</div>`).join('');
    };
    draw();
    $('#run').onclick = async () => {
      $('#res').innerHTML = '<span class="muted">…</span>'; for (const l of $$('#cd .cl')) { l.classList.add('on'); sfx.step(); await wait(300); l.classList.remove('on'); }
      $('#res').innerHTML = p.run(fixed);
      if (fixed) { ctx.ok('البرنامج يعمل كما هو مطلوب ✓'); k++; if (k < P.length) later(() => { ctx.clear(); show(); }, 1500); else { ctx.reveal(); ctx.complete(); } return; }
      if (!ran) { ran = true; $('#md').textContent = '٢. 🔍 اضغط على السطر المسبب للخطأ'; draw(); ctx.say('النتيجة ليست كما طلبنا! 🤔 قارن المطلوب بالناتج… ثم ابحث.', 'think'); }
    };
    $('#cd').onclick = e => {
      const l = e.target.closest('.cl'); if (!l || !ran || found) return; const i = +l.dataset.i;
      if (i === p.bug) {
        found = true; ctx.bug(); draw(); $$('#cd .cl').find(x => +x.dataset.i === i).classList.add('hit');
        ctx.say('لقد وجدت Bug! 🐞', 'wow'); fbox(ctx.fbEl, p.why, 'ok', '🐞'); $('#md').textContent = '٣. أصلح الخطأ ثم شغّل مرة أخرى';
        $('#fx').innerHTML = `<div class="cards" style="margin-top:12px;flex-direction:column;align-items:stretch">${p.fix.map((f, j) => `<button class="card" data-j="${j}">${f}</button>`).join('')}</div>`;
        $('#fx').onclick = ev => { const b = ev.target.closest('.card'); if (!b || b.disabled) return; if (+b.dataset.j === p.ok) { fixed = true; draw(); $('#fx').innerHTML = ''; ctx.info('أصلحته! الآن شغّل البرنامج للتأكد ▶'); } else { b.classList.add('bad'); b.disabled = true; ctx.fail('هذا التغيير لا يحل المشكلة، وقد يصنع مشكلة جديدة!', { noCheck: true }); } };
      } else { l.classList.add('miss'); later(() => l.classList.remove('miss'), 700); ctx.fail(`السطر ${l.querySelector('.n').textContent} سليم ✓ ابحث في سطر آخر.`, { noCheck: true }); }
    };
  }
  show();
};
