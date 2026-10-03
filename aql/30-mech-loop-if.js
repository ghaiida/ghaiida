
/* ---------- t1: ten boxes (manual → discover the loop) ---------- */
MECH.boxes = ctx => {
  const N = 10; let opened = 0, manual = 0, phase = 1, busy = false;
  const keyAt = rand(5, 9);
  ctx.host.innerHTML = `<div class="stage"><div class="boxes" id="bx">${Array.from({ length: N }, () => '<div class="box">📦</div>').join('')}</div>
    <div class="two" style="margin-top:10px"><div><span class="lbl">أوامرك</span><div class="cmdlog" id="log"><span style="background:none;color:var(--ink-3)">لا أوامر بعد</span></div></div>
    <div id="ctl"><span class="lbl">الأوامر المتاحة</span><div class="palette"><button class="blk" id="open">📦 افتح صندوقًا</button><button class="blk loop" id="rep" hidden>🔁 كرر</button></div></div></div></div>`;
  const boxes = $$('.box', ctx.host);
  const openBox = i => { const b = boxes[i]; b.classList.add('open'); b.textContent = i === keyAt ? '🔑' : '✨'; sfx.step(); };
  const logAdd = t => { const L = $('#log'); if (!L.querySelector('span[data-c]')) L.innerHTML = ''; L.insertAdjacentHTML('beforeend', `<span data-c>${t}</span>`); L.scrollTop = L.scrollHeight; };
  $('#open').onclick = () => {
    if (busy || phase !== 1 || opened >= N) return;
    openBox(opened); opened++; manual++; logAdd('افتح');
    if (manual === 3) ctx.say('افتح… افتح… افتح… 😮‍💨 أصابعك ستتعب! ألا توجد طريقة أذكى؟', 'think');
    if (manual === 4) { $('#rep').hidden = false; shake($('#rep')); ctx.info('ظهر زر جديد: <b>🔁 كرر</b>. جرّبه!'); }
    if (opened >= N) { ctx.say('فتحتها كلها يدويًا! لكن تخيّل ١٠٠ صندوق… جرّب زر 🔁 كرر في المرة القادمة.', 'wow'); loopPhase(); }
  };
  $('#rep').onclick = () => { if (!busy) loopPhase(); };
  function loopPhase() {
    phase = 2;
    $('#ctl').innerHTML = `<span class="lbl">الطريقة الذكية</span><div class="loopcard"><div class="lh">🔁 كرر <span class="counter"><button id="dn" aria-label="أقل">−</button><b id="n">${ar(N - opened || N)}</b><button id="up" aria-label="أكثر">+</button></span> مرات</div><div class="lb"><span class="blk" style="cursor:default">📦 افتح صندوقًا</span></div></div>
      <div class="row"><button class="btn emerald" id="go">▶ شغّل</button></div>`;
    let n = N - opened || N;
    const setN = v => { n = Math.max(1, Math.min(20, v)); $('#n').textContent = ar(n); };
    $('#dn').onclick = () => setN(n - 1); $('#up').onclick = () => setN(n + 1);
    $('#go').onclick = async () => {
      if (busy) return; busy = true;
      if (opened >= N) { boxes.forEach(b => { b.classList.remove('open'); b.textContent = '📦'; }); opened = 0; }
      $('#log').innerHTML = ''; logAdd(`كرر ${ar(n)} مرات: افتح`);
      for (let i = 0; i < n; i++) {
        if (opened >= N) { ctx.say('لم يبقَ صناديق! 😅 كررت أكثر من اللازم، فالأوامر الزائدة لا تجد ما تفتحه.', 'dizzy'); break; }
        boxes[opened].classList.add('cur'); await wait(220); boxes[opened].classList.remove('cur'); openBox(opened); opened++;
      }
      busy = false;
      if (opened >= N) {
        ctx.ok(`فُتحت الصناديق كلها بأمر واحد يتكرر! والمفتاح 🔑 كان في الصندوق ${ar(keyAt + 1)}.`);
        ctx.say('سطر واحد بدل عشرة أسطر! هذه قوة خارقة 🔁', 'happy'); ctx.reveal(); practice();
      } else ctx.fail(`فتح الروبوت ${ar(n)} فقط وبقي ${ar(N - opened)} مغلقة. عدّل عدد مرات التكرار وشغّل مرة أخرى.`, { noCheck: true });
    };
  }
  function practice() {
    const box = document.createElement('section'); box.className = 'panel';
    const target = rand(4, 9);
    box.innerHTML = `<span class="eyebrow">طبّق الآن: غيّر عدد التكرارات وشاهد النتيجة مباشرة</span>
      <div class="bigq" style="margin-top:6px">الروبوت يريد أن يقفز <b>${ar(target)}</b> قفزات بالضبط على الحبل.</div>
      <div class="loopcard" style="max-width:420px"><div class="lh">🔁 كرر <b id="pv">١</b> مرات</div><div class="lb"><span class="blk" style="cursor:default">🦘 اقفز</span></div></div>
      <input type="range" id="pr" min="1" max="12" value="1" aria-label="عدد التكرار" style="max-width:420px;margin-top:10px">
      <div class="cmdlog" id="jl" style="margin-top:8px"></div><div class="row"><button class="btn emerald" id="pj">▶ شغّل</button></div><div class="pfb"></div>`;
    $('#after').appendChild(box); later(() => box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }), 500);
    const draw = () => { const v = +$('#pr', box).value; $('#pv', box).textContent = ar(v); $('#jl', box).innerHTML = Array.from({ length: v }, (_, i) => `<span>🦘 ${ar(i + 1)}</span>`).join(''); };
    $('#pr', box).oninput = draw; draw();
    $('#pj', box).onclick = () => {
      const v = +$('#pr', box).value;
      if (v === target) { sfx.ok(); fbox($('.pfb', box), `بالضبط! غيّرت رقمًا واحدًا… والبرنامج كله تغيّر.`, 'ok'); ctx.complete(); }
      else { sfx.oops(); fbox($('.pfb', box), v < target ? 'قفزات أقل من المطلوب. زِد عدد التكرار.' : 'قفزات أكثر من المطلوب! قلّل عدد التكرار.', 'bad'); }
    };
  }
};

/* ---------- t1b: dancing robot ---------- */
MECH.dance = ctx => {
  const MOVES = { R: ['👉 يمين', 'R'], L: ['👈 يسار', 'L'], J: ['⬆️ قفزة', 'J'], S: ['🌀 دوران', 'S'] };
  const TARGET = ['R', 'L', 'J', 'R', 'L', 'J', 'R', 'L', 'J'];
  let body = [], n = 1, busy = false, tries = 0;
  ctx.host.innerHTML = `<div class="dancefloor" id="df"><div class="spot" style="left:calc(50% - 80px)"></div><div class="tiles"></div><span class="notes">♪ ♫</span><div class="dancer" id="dn">${robot('happy', 84)}</div></div>
    <div class="beatbar" id="bb">${TARGET.map(m => `<i>${MOVES[m][0]}</i>`).join('')}</div>
    <div class="two" style="margin-top:14px"><div><span class="lbl">الحركات</span><div class="palette">${Object.entries(MOVES).map(([k, v]) => `<button class="blk" data-m="${k}">${v[0]}</button>`).join('')}</div>
      <p class="small muted" style="margin-top:8px">الحركات تدخل داخل الحلقة الخضراء. اضغط حركة داخل الحلقة لحذفها.</p></div>
    <div><div class="loopcard"><div class="lh">🔁 كرر <span class="counter"><button id="mn" aria-label="أقل">−</button><b id="nv">١</b><button id="pl" aria-label="أكثر">+</button></span> مرات</div><div class="lb" id="body"></div></div>
      <div class="row"><button class="btn emerald" id="go">▶ ابدأ الرقص</button><span class="chip" id="pc"></span></div></div></div>`;
  const draw = () => {
    $('#nv').textContent = ar(n);
    $('#body').innerHTML = body.map((m, i) => `<button class="blk" data-i="${i}">${MOVES[m][0]}</button>`).join('') || '<span class="muted small">ضع الحركات هنا</span>';
    $('#pc').textContent = `القطع: ${ar(1 + body.length)}`;
  };
  ctx.host.querySelector('.palette').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || busy || body.length >= 4) return; body.push(b.dataset.m); sfx.tap(); draw(); };
  $('#body').onclick = e => { const b = e.target.closest('[data-i]'); if (!b || busy) return; body.splice(+b.dataset.i, 1); draw(); };
  $('#mn').onclick = () => { if (!busy) { n = Math.max(1, n - 1); draw(); } };
  $('#pl').onclick = () => { if (!busy) { n = Math.min(6, n + 1); draw(); } };
  $('#go').onclick = async () => {
    if (busy || !body.length) { if (!body.length) ctx.info('ضع حركة واحدة على الأقل داخل الحلقة.'); return; }
    busy = true; tries++; ctx.clear();
    const seq = []; for (let r = 0; r < n; r++) seq.push(...body);
    const D = $('#dn'), F = $('#df'), beats = $$('#bb i'); beats.forEach(b => b.classList.remove('on', 'ok'));
    let match = seq.length === TARGET.length;
    for (let i = 0; i < seq.length; i++) {
      const m = seq[i]; F.classList.add('beat'); sfx.beat(i);
      D.className = 'dancer ' + m; if (beats[i]) { beats[i].classList.add('on'); }
      $$('#body .blk').forEach((b, j) => b.classList.toggle('on', j === i % body.length));
      await wait(420); D.className = 'dancer'; F.classList.remove('beat');
      if (beats[i]) { beats[i].classList.remove('on'); if (TARGET[i] === m) beats[i].classList.add('ok'); else match = false; } else match = false;
      await wait(120);
    }
    $$('#body .blk').forEach(b => b.classList.remove('on')); busy = false;
    if (match) {
      D.className = 'dancer S'; later(() => D.className = 'dancer', 600);
      ctx.ok(`رقصة كاملة! ${ar(seq.length)} حركات من ${ar(1 + body.length)} قطع فقط. 🎉`); ctx.say('هل رأيت حركاتي؟ 🕺 الحلقة كررت الرقصة كلها ثلاث مرات!', 'happy'); ctx.complete({ stars: tries === 1 ? 3 : tries <= 3 ? 2 : 1 });
    } else {
      ctx.say(seq.length > TARGET.length ? 'رقصت أكثر من اللازم! 🥵 الموسيقى توقفت وأنا ما زلت أرقص.' : 'توقفت الموسيقى… أو تلخبطت الخطوات! 😵‍💫', 'dizzy');
      ctx.fail(seq.length !== TARGET.length ? `نفّذ الروبوت ${ar(seq.length)} حركات، والرقصة ${ar(TARGET.length)}. راجع عدد المرات وما داخل الحلقة.` : 'العدد صحيح لكن الترتيب مختلف. انظر إلى شريط الإيقاع: الحركات الخضراء صحيحة.');
    }
  };
  draw();
};

/* ---------- t2: IF — build the rule by dragging, then test ---------- */
MECH.ifDrag = ctx => {
  const PARTS = [{ k: 'rain', t: '🌧️ الجو ممطر', z: 'c' }, { k: 'umb', t: '☔ خذ المظلة', z: 'a' }, { k: 'hot', t: '🔥 الجو حار', z: 'x' }, { k: 'ice', t: '🍦 كُل آيسكريم', z: 'x' }];
  let filled = { c: null, a: null }, weather = 'sun', tried = new Set(), busy = false;
  ctx.host.innerHTML = `<div class="ruleslot"><span>إذا</span><span class="drop" data-z="c">ضع الشرط هنا</span><span>←</span><span class="drop" data-z="a">ضع النتيجة هنا</span></div>
    <div class="cards" id="parts" style="margin-top:12px">${shuffle(PARTS).map(p => `<button class="card" draggable="true" data-k="${p.k}">${p.t}</button>`).join('')}</div>
    <div id="sim" hidden style="margin-top:16px"><div class="two"><div><span class="lbl">غيّر الطقس</span><div class="toggles"><button class="tgl on" data-w="sun">☀️ مشمس</button><button class="tgl" data-w="rain">🌧️ ممطر</button></div>
      <div class="row"><button class="btn emerald" id="go">🚪 اخرج من الباب</button></div><div id="eval" class="small" style="margin-top:10px"></div></div>
      <div class="street" id="st"><div class="rainfx"></div><span class="sun">☀️</span><div class="ground"></div><span class="door">🏫</span><div class="who" id="who"><span class="itm" hidden>☂️</span>${robot('happy', 64)}</div></div></div></div>`;
  pairPick($('#parts'), $$('.drop', ctx.host), (c, z) => {
    const p = PARTS.find(x => x.k === c.dataset.k);
    if (p.z !== z.dataset.z) { shake(z); ctx.fail(p.z === 'x' ? 'هذه البطاقة لا علاقة لها بالمظلة 🙂' : p.z === 'c' ? 'هذا <b>شرط</b> (سؤال: هل…؟)، ضعه بعد «إذا».' : 'هذه <b>نتيجة</b> (فعل ننفّذه)، ضعها بعد السهم.', { noCheck: true }); return; }
    z.textContent = p.t; z.classList.add('filled'); c.remove(); filled[p.z] = p.k; sfx.ok();
    if (filled.c && filled.a) { $('#sim').hidden = false; ctx.ok('القاعدة جاهزة! الآن جرّب الطقسين واخرج من الباب.'); ctx.say('سأتبع القاعدة حرفيًا. غيّر الطقس وشاهد!', 'happy'); }
  });
  ctx.host.addEventListener('click', e => {
    const t = e.target.closest('[data-w]'); if (!t || busy) return; weather = t.dataset.w;
    $$('[data-w]', ctx.host).forEach(x => x.classList.toggle('on', x === t)); $('#st').classList.toggle('rain', weather === 'rain'); $('#who').classList.remove('go'); $('#who .itm').hidden = true; $('#eval').innerHTML = '';
  });
  ctx.host.addEventListener('click', async e => {
    if (!e.target.closest('#go') || busy) return; busy = true;
    const W = $('#who'); W.style.transition = 'none'; W.classList.remove('go'); void W.offsetWidth; W.style.transition = ''; $('.itm', W).hidden = true;
    const rain = weather === 'rain';
    $('#eval').innerHTML = `هل الجو ممطر؟ ← <b style="color:var(--${rain ? 'emerald' : 'rose'})">${rain ? 'نعم ✓' : 'لا ✗'}</b>`;
    await wait(700);
    if (rain) { $('.itm', W).hidden = false; sfx.ok(); $('#eval').innerHTML += ' ← خذ المظلة ☔'; } else $('#eval').innerHTML += ' ← تخطَّ الأمر';
    await wait(500); W.classList.add('go'); await wait(1500);
    tried.add(weather); busy = false;
    if (tried.size === 1) ctx.info('جرّب الطقس الآخر الآن. ماذا سيتغيّر؟');
    if (tried.size === 2) {
      ctx.say('عندما كان الجو ممطرًا أخذت المظلة، وعندما كان مشمسًا تجاهلتها. أنا لم أفكّر… أنا <b>فحصت شرطًا</b>!', 'wow'); ctx.reveal();
      practiceQ(ctx, '<span class="ltr" style="font-family:var(--f-mono)">إذا البطارية &lt; ٢٠ ← اشحن الهاتف</span><br>البطارية الآن <b>٦٥</b>. ماذا يحدث؟', [{ t: 'يُشحن الهاتف', r: 'هل ٦٥ أصغر من ٢٠؟' }, { t: 'لا شيء، يتخطى الأمر', ok: true, r: 'صحيح! الشرط خطأ، فلا يُنفّذ الأمر.' }], () => ctx.complete());
    }
  });
};

/* ---------- t2b: smart gate (key, then points ≥ 10) ---------- */
MECH.ifGate = ctx => {
  let phase = 1, hasKey = false, pts = 7, busy = false; const seen = new Set();
  function view() {
    ctx.host.innerHTML = `<div class="two"><div>
      <span class="lbl">${phase === 1 ? 'الحالة' : 'نقاط اللاعب'}</span>
      ${phase === 1 ? `<div class="toggles"><button class="tgl${hasKey ? ' on' : ''}" data-key="1">🔑 معه مفتاح</button><button class="tgl${!hasKey ? ' on' : ''}" data-key="0">🚫 بدون مفتاح</button></div>`
        : `<div class="bignum num" id="pv">${ar(pts)}</div><input type="range" id="pr" min="0" max="20" value="${pts}" aria-label="النقاط">`}
      <div class="code" style="margin-top:12px">${phase === 1
        ? '<div class="cl" id="l0"><span class="kw">إذا</span> معه مفتاح:</div><div class="cl ind" id="l1">افتح الباب 🔓</div>'
        : '<div class="cl" id="l0"><span class="kw">إذا</span> <span class="vr">النقاط</span> ≥ ١٠:</div><div class="cl ind" id="l1">افتح المستوى التالي 🔓</div><div class="cl" id="l2"><span class="kw">وإلا</span>:</div><div class="cl ind" id="l3">أعد المحاولة ↻</div>'}</div>
      <div class="row"><button class="btn emerald" id="go">🚶 اقترب من البوابة</button></div></div>
      <div><div class="gatebox" id="gb"><span class="sign">${phase === 1 ? 'تُفتح بمفتاح فقط' : 'المستوى ٢ ← ١٠ نقاط'}</span><div class="wallL"></div><div class="wallR"></div><div class="bars"></div><div class="hero" id="hr">${robot('happy', 60)}</div></div>
      <div class="flowq" style="grid-template-columns:1fr 1fr"><div class="branch yes" id="by"><small>الشرط صحيح</small>تُفتح البوابة</div><div class="branch no" id="bn"><small>الشرط خطأ</small>${phase === 1 ? 'تبقى مغلقة' : 'أعد المحاولة'}</div></div></div></div>`;
    ctx.host.querySelectorAll('[data-key]').forEach(b => b.onclick = () => { if (busy) return; hasKey = b.dataset.key === '1'; view(); });
    const pr = $('#pr'); if (pr) pr.oninput = () => { pts = +pr.value; $('#pv').textContent = ar(pts); };
    $('#go').onclick = approach;
  }
  async function approach() {
    if (busy) return; busy = true; ctx.clear();
    const G = $('#gb'), cond = phase === 1 ? hasKey : pts >= 10;
    $$('.branch', ctx.host).forEach(b => b.classList.remove('lit')); $$('.code .cl', ctx.host).forEach(l => l.classList.remove('hit', 'miss', 'dim', 'on'));
    const H = $('#hr'); H.style.transition = 'none'; G.classList.remove('open', 'pass', 'through'); H.innerHTML = robot('happy', 60); void H.offsetWidth; H.style.transition = '';
    await wait(50); G.classList.add('pass'); $('#l0').classList.add('on'); await wait(1200);
    $('#l0').classList.remove('on');
    $(cond ? '#by' : '#bn').classList.add('lit');
    if (cond) { $('#l1').classList.add('hit'); G.classList.add('open'); sfx.ok(); await wait(700); G.classList.add('through'); $('#hr').innerHTML = robot('happy', 60); }
    else { if (phase === 2) $('#l3').classList.add('miss'); else $('#l1').classList.add('dim'); $('#hr').innerHTML = robot('sad', 60); sfx.oops(); }
    await wait(1200);
    seen.add(phase === 1 ? String(hasKey) : String(cond)); busy = false;
    if (phase === 1) {
      ctx.info(cond ? 'المفتاح موجود ← الشرط <b>صحيح</b> ← البوابة فُتحت.' : 'لا يوجد مفتاح ← الشرط <b>خطأ</b> ← البوابة لم تتحرك.');
      if (seen.size === 2) { later(() => { phase = 2; seen.clear(); view(); ctx.say('الآن البوابة أذكى: تفحص <b>النقاط</b>. حرّك الشريط وجرّب أرقامًا مختلفة… جرّب ١٠ بالضبط!', 'think'); ctx.info('غيّر النقاط وجرّب حالة تُفتح فيها وحالة لا تُفتح.'); }, 1400); }
    } else {
      ctx.info(`${ar(pts)} ≥ ١٠؟ ${cond ? '<b>صحيح</b> ← افتح المستوى' : '<b>خطأ</b> ← أعد المحاولة'}${pts === 10 ? '. لاحظ: ١٠ ≥ ١٠ صحيحة لأن العلامة تشمل «يساوي».' : ''}`);
      if (seen.size === 2) {
        ctx.reveal();
        practiceQ(ctx, 'لاعب معه <b>٩</b> نقاط ومعه مفتاح. البوابة تفحص: <span class="ltr">إذا النقاط ≥ ١٠</span>. هل تُفتح؟', [{ t: 'نعم، لأن معه مفتاح', r: 'البوابة لا تسأل عن المفتاح هنا! تفحص الشرط المكتوب فقط.' }, { t: 'لا، لأن ٩ أقل من ١٠', ok: true, r: 'صحيح! البرنامج يفحص الشرط المكتوب فقط: ٩ ≥ ١٠ خطأ.' }], () => ctx.complete());
      }
    }
  }
  view();
};

/* ---------- t3: IF / ELSE number decision ---------- */
MECH.ifElse = ctx => {
  let v = 3, moved = new Set(), quiz = 0, busy = false;
  ctx.host.innerHTML = `<div class="two"><div><span class="lbl">الرقم الذي يراه الروبوت</span><div class="bignum num" id="nv">${ar(v)}</div><input type="range" id="nr" min="0" max="10" value="${v}" aria-label="الرقم">
    <div class="code" style="margin-top:12px"><div class="cl" id="c0"><span class="kw">إذا</span> الرقم &gt; ٥:</div><div class="cl ind" id="c1">قل «الرقم كبير» 🟢</div><div class="cl" id="c2"><span class="kw">وإلا</span>:</div><div class="cl ind" id="c3">قل «الرقم صغير» 🔵</div></div></div>
    <div><div class="flowq"><div class="branch yes" id="by"><small>IF · نعم</small>🟢 الرقم كبير</div><div class="diamond"><span id="dq">${ar(v)} &gt; ٥ ؟</span></div><div class="branch no" id="bn"><small>ELSE · لا</small>🔵 الرقم صغير</div></div>
    <div class="out" id="out">—</div></div></div><div id="q"></div>`;
  function decide() {
    const big = v > 5; $('#nv').textContent = ar(v); $('#dq').innerHTML = `${ar(v)} &gt; ٥ ؟`;
    $('#by').classList.toggle('lit', big); $('#bn').classList.toggle('lit', !big);
    ['#c1', '#c3'].forEach(s => $(s).classList.remove('hit', 'dim')); $(big ? '#c1' : '#c3').classList.add('hit'); $(big ? '#c3' : '#c1').classList.add('dim');
    $('#out').textContent = big ? '🟢 الرقم كبير' : '🔵 الرقم صغير';
  }
  $('#nr').oninput = () => { v = +$('#nr').value; decide(); moved.add(v > 5); if (v === 5) ctx.info('لاحظ الرقم ٥: هل ٥ أكبر من ٥؟ لا، لذلك ذهب إلى «وإلا».'); if (moved.size === 2 && !quiz) startQuiz(); };
  decide();
  const Q = [8, 5, 6, 0].map(n => ({ n, a: n > 5 }));
  function startQuiz() {
    quiz = 1; ctx.say('رأيت؟ في كل مرة يسلك البرنامج طريقًا <b>واحدًا فقط</b>. الآن أنت المعالج: أين يذهب كل رقم؟', 'wow');
    let i = 0;
    const show = () => {
      const it = Q[i];
      $('#q').innerHTML = `<div class="stage" style="margin-top:14px"><span class="lbl">أنت المعالج · ${ar(i + 1)} من ${ar(Q.length)}</span><div class="bignum num">${ar(it.n)}</div><div class="row c"><button class="btn emerald" data-a="1">🟢 كبير</button><button class="btn royal" data-a="0">🔵 صغير</button></div></div>`;
      $('#q').onclick = e => {
        const b = e.target.closest('[data-a]'); if (!b || busy) return;
        if ((b.dataset.a === '1') === it.a) { sfx.ok(); v = it.n; $('#nr').value = v; decide(); i++; ctx.clear(); if (i < Q.length) show(); else { $('#q').innerHTML = ''; ctx.reveal(); ctx.complete(); } }
        else ctx.fail(it.n === 5 ? '٥ ليس أكبر من ٥، فيذهب إلى «وإلا».' : `هل ${ar(it.n)} أكبر من ٥؟ فكّر مرة أخرى.`, { noCheck: true });
      };
    };
    show();
  }
};

/* ---------- t4: ELSE IF thermometer ---------- */
MECH.elseIf = ctx => {
  let t = 20, busy = false, phase = 1; const seen = new Set();
  const GOOD = [[35, 'حار جدًا 🔥'], [25, 'معتدل ☀️'], [null, 'بارد ❄️']];
  const BAD = [[25, 'معتدل ☀️'], [35, 'حار جدًا 🔥'], [null, 'بارد ❄️']];
  function view() {
    const C = phase === 1 ? GOOD : BAD;
    ctx.host.innerHTML = `${phase === 2 ? '<p class="bigq">🛠️ زميلك قلب ترتيب الشروط! جرّب ٤٠° وشاهد ماذا يحدث، ثم أصلحه.</p>' : ''}
      <div class="thermo"><div><div class="tube"><i id="tf"></i></div><div class="tval num" id="tv">${ar(t)}°</div></div>
      <div><input type="range" id="tr" min="0" max="50" value="${t}" aria-label="درجة الحرارة"><div class="chain" id="ch" style="margin-top:8px">${C.map(([v, o], i) => `<div class="crow"><span class="cc">${v === null ? '<span style="color:var(--amber-d)">وإلا</span>' : `<span style="color:var(--royal)">${i ? 'وإلا إذا' : 'إذا'}</span> الحرارة ≥ ${ar(v)}°`} ← «${o}»</span><span class="cr"></span></div>`).join('')}</div>
      <div class="row"><button class="btn emerald" id="go">▶ افحص</button>${phase === 2 ? '<button class="btn amber" id="fix">⇅ بدّل أول شرطين</button>' : ''}</div><div class="out" id="out">—</div></div></div>`;
    const set = () => { $('#tv').textContent = ar(t) + '°'; $('#tf').style.height = Math.max(6, t / 50 * 96) + '%'; };
    $('#tr').oninput = () => { t = +$('#tr').value; set(); }; set();
    $('#go').onclick = () => check(C);
    if ($('#fix')) $('#fix').onclick = () => { if (busy) return; phase = 3; ctx.ok('بدّلت الترتيب: الشرط الأصعب (≥ ٣٥) صار أولًا. جرّب ٤٠° مرة أخرى.'); viewFixed(); };
  }
  function viewFixed() { phase = 1; view(); phase = 3; $('#go').onclick = () => check(GOOD); }
  async function check(C) {
    if (busy) return; busy = true; ctx.clear();
    const rows = $$('#ch .crow'); rows.forEach(r => { r.className = 'crow'; $('.cr', r).textContent = ''; });
    let out = '';
    for (let i = 0; i < C.length; i++) {
      const [v, o] = C[i]; rows[i].classList.add('chk'); sfx.step(); await wait(600); rows[i].classList.remove('chk');
      const ok = v === null || t >= v; rows[i].classList.add(ok ? 't' : 'f'); $('.cr', rows[i]).textContent = v === null ? 'نُفِّذ' : ok ? 'صحيح ✓' : 'خطأ ✗';
      if (ok) { out = o; for (let j = i + 1; j < rows.length; j++) { rows[j].classList.add('skip'); $('.cr', rows[j]).textContent = 'لم يُفحص'; } break; }
    }
    $('#out').textContent = out; busy = false;
    if (phase === 1) {
      seen.add(out);
      if (seen.size === 1) ctx.info('غيّر الحرارة وجرّب مرة أخرى. حاول أن تحصل على النتائج الثلاث.');
      if (seen.size === 3) { ctx.say('لاحظت؟ أفحص من <b>الأعلى إلى الأسفل</b>، وأتوقف عند أول شرط صحيح.', 'wow'); ctx.reveal(); later(() => { phase = 2; t = 40; view(); }, 1800); }
      else if (seen.size === 2) ctx.info('بقيت نتيجة واحدة لم تظهر بعد!');
    } else if (phase === 2) {
      if (t >= 35) { ctx.bug(); ctx.say('٤٠° وأقول «معتدل»؟! 🥵 الشرط ≥ ٢٥ جاء أولًا وكان صحيحًا، فتوقفت عنده.', 'dizzy'); fbox(ctx.fbEl, 'هذا <b>خطأ منطقي</b>: البرنامج يعمل، لكن النتيجة خاطئة. اضغط «⇅ بدّل أول شرطين».', 'bad'); }
      else ctx.info('جرّب حرارة عالية مثل ٤٠° لترى المشكلة.');
    } else if (phase === 3) {
      if (t >= 35) { ctx.ok('٤٠° ← «حار جدًا 🔥». الترتيب الصحيح أصلح البرنامج!'); ctx.complete(); }
      else ctx.info('جرّب ٤٠° للتأكد من الإصلاح.');
    }
  }
  view();
};
