
/* ---------- final mission: the digital city (all concepts) ---------- */
MECH.final = ctx => {
  const CH = ['الخوارزمية', 'التكرار', 'الشرط IF', 'IF / ELSE', 'المتغير', 'صيد الخطأ', 'التشغيل النهائي'];
  const prog = {};
  let c = 0;
  const head = () => `<div class="chap">${CH.map((_, i) => `<i class="${i < c ? 'done' : i === c ? 'cur' : ''}"></i>`).join('')}</div><span class="eyebrow">الفصل ${ar(c + 1)} من ${ar(CH.length)} · ${CH[c]}</span>`;
  const next = () => { c++; ctx.clear(); sfx.ok(); later(chapter, 500); };
  function chapter() {
    [ch1, ch2, ch3, ch4, ch5, ch6, ch7][c]();
    later(() => ctx.host.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }), 100);
  }

  function ch1() {
    ctx.say('أولًا: خطة المهمة. رتّب خطوات توصيل نواة الطاقة.', 'think');
    const items = [{ id: 0, t: '🔋 التقط نواة الطاقة' }, { id: 1, t: '🚶 تحرّك نحو مركز النظام' }, { id: 2, t: '🔌 ضع النواة في المركز' }, { id: 3, t: '⚡ شغّل النظام' }];
    ctx.host.innerHTML = head() + '<div id="bd" style="margin-top:10px"></div><div class="row"><button class="btn emerald" id="ck" disabled>تحقّق ✓</button></div>';
    let bd = null; bd = orderBuilder($('#bd'), items, (s, p) => { $('#ck').disabled = p.length > 0; });
    $('#ck').onclick = () => {
      bd.unmark(); let ok = true; bd.seq.forEach((it, i) => { bd.mark(i, it.id === i ? 'ok' : 'bad'); if (it.id !== i) ok = false; });
      if (ok) { bd.locked = true; prog.algo = items.map(x => x.t); ctx.ok('خطة واضحة ومرتّبة ✓'); next(); } else ctx.fail('بعض الخطوات في غير مكانها (الحمراء). هل يمكن وضع النواة قبل التقاطها؟', { noCheck: true });
    };
  }
  function ch2() {
    ctx.say('الطريق إلى المركز مستقيم: <b>٦ مربعات</b>. استخدم حلقة بدل ٦ أوامر.', 'happy');
    const W = 7;
    ctx.host.innerHTML = head() + `<div style="margin-top:12px" id="g"></div>
      <div class="loopcard" style="max-width:420px;margin-top:14px"><div class="lh">🔁 كرر <span class="counter"><button id="mn" aria-label="أقل">−</button><b id="nv">١</b><button id="pl" aria-label="أكثر">+</button></span> مرات</div><div class="lb"><span class="blk" style="cursor:default">➡️ يمين</span></div></div>
      <div class="row"><button class="btn emerald" id="go">▶ تحرّك</button></div>`;
    const L = { w: W, h: 1, start: [0, 0], goal: [6, 0], walls: [] };
    const g = makeGrid($('#g'), L, { goalIcon: '🏛️', cls: 'city' });
    let n = 1, busy = false;
    const setN = v => { n = Math.max(1, Math.min(9, v)); $('#nv').textContent = ar(n); };
    $('#mn').onclick = () => setN(n - 1); $('#pl').onclick = () => setN(n + 1);
    $('#go').onclick = async () => {
      if (busy) return; busy = true;
      const r = await g.run(Array(n).fill('R'), null, 260); busy = false;
      if (r.ok) { prog.loop = n; ctx.ok(`وصل! «كرر ${ar(n)} مرات» بدل ${ar(n)} أوامر.`); next(); }
      else ctx.fail(r.why === 'short' ? 'توقف الروبوت قبل المركز. زِد التكرار.' : 'تجاوز الروبوت المدينة! قلّل التكرار.', { noCheck: true });
    };
  }
  function ch3() {
    ctx.say('في الطريق إشارة مرور 🚦. علّمني متى أتوقف!', 'think');
    ctx.host.innerHTML = head() + `<div class="ruleslot" style="margin-top:12px"><span>إذا</span><span class="drop" id="dz">اختر الشرط</span><span>← قف 🛑</span></div>
      <div class="cards" style="margin-top:12px" id="cs"><button class="card" data-k="red">🔴 الإشارة حمراء</button><button class="card" data-k="green">🟢 الإشارة خضراء</button><button class="card" data-k="hungry">🍔 الروبوت جائع</button></div>`;
    $('#cs').onclick = async e => {
      const b = e.target.closest('.card'); if (!b || b.disabled) return;
      if (b.dataset.k === 'red') {
        $('#dz').textContent = '🔴 الإشارة حمراء'; $('#dz').classList.add('filled'); $$('#cs .card').forEach(x => x.disabled = true); b.classList.add('ok');
        prog.if = 'الإشارة حمراء'; ctx.ok('الإشارة الآن حمراء ← الشرط صحيح ← توقّف الروبوت 🛑. وعندما تصبح خضراء سيكمل.'); later(next, 1400);
      } else { b.classList.add('bad'); b.disabled = true; ctx.fail(b.dataset.k === 'green' ? 'نتوقف عند الأخضر؟ ستتعطل المدينة كلها 🚗🚗🚗' : 'هذا لا علاقة له بالمرور 😄', { noCheck: true }); }
    };
  }
  function ch4() {
    ctx.say('وصلت إلى باب المركز. الحارس يطلب <b>بطاقة دخول</b>. ماذا أفعل إن لم تكن معي؟', 'think');
    ctx.host.innerHTML = head() + `<div class="code" style="margin-top:12px"><div class="cl"><span class="kw">إذا</span> معك بطاقة دخول:</div><div class="cl ind">ادخل المركز 🏛️</div><div class="cl"><span class="kw">وإلا</span>:</div><div class="cl ind" id="el"><span class="drop" style="min-width:120px;color:var(--term-dim)">؟</span></div></div>
      <div class="cards" style="margin-top:12px" id="cs"><button class="card" data-k="ask">🪪 اطلب بطاقة من الحارس</button><button class="card" data-k="in">🚪 ادخل المركز</button><button class="card" data-k="break">🔨 اكسر الباب</button></div>`;
    $('#cs').onclick = e => {
      const b = e.target.closest('.card'); if (!b || b.disabled) return;
      if (b.dataset.k === 'ask') { $('#el').textContent = 'اطلب بطاقة من الحارس 🪪'; b.classList.add('ok'); $$('#cs .card').forEach(x => x.disabled = true); prog.ifelse = true; ctx.ok('طريقان واضحان: معي بطاقة ← أدخل، وإلا ← أطلب بطاقة.'); later(next, 1300); }
      else { b.classList.add('bad'); b.disabled = true; ctx.fail(b.dataset.k === 'in' ? 'إذا دخل في الحالتين، فما فائدة الشرط؟ 🤔' : 'الحارس لا يحب هذا الحل أبدًا 😅', { noCheck: true }); }
    };
  }
  function ch5() {
    ctx.say('كل حركة تستهلك <b>وحدة بطارية</b>. الرحلة كلها ٨ حركات. كم يجب أن تكون قيمة البطارية عند البداية؟', 'think');
    ctx.host.innerHTML = head() + `<div class="two" style="margin-top:12px"><div><div class="vars"><div class="vbox" id="vb"><div class="vn">البطارية</div><div class="vv num" id="vv">٣</div></div></div>
      <input type="range" id="br" min="1" max="12" value="3" aria-label="قيمة البطارية" style="margin-top:12px"><div class="row"><button class="btn emerald" id="go">▶ اختبر الرحلة</button></div></div>
      <div><div class="code" id="lg" style="min-height:160px"><div class="cl" style="color:var(--term-dim)">سجل البطارية</div></div></div></div>`;
    let b = 3, busy = false;
    $('#br').oninput = () => { b = +$('#br').value; $('#vv').textContent = ar(b); };
    $('#go').onclick = async () => {
      if (busy) return; busy = true; let v = b; const lg = $('#lg'); lg.innerHTML = `<div class="cl"><span class="vr">البطارية</span> = ${ar(v)}</div>`;
      for (let i = 1; i <= 8; i++) {
        if (v <= 0) { lg.insertAdjacentHTML('beforeend', `<div class="cl miss">الحركة ${ar(i)}: البطارية فارغة 🪫 توقّف الروبوت!</div>`); break; }
        v--; $('#vv').textContent = ar(v); const vb = $('#vb'); vb.classList.remove('pulse'); void vb.offsetWidth; vb.classList.add('pulse');
        lg.insertAdjacentHTML('beforeend', `<div class="cl">الحركة ${ar(i)}: <span class="vr">البطارية</span> = <span class="vr">البطارية</span> − ١ = ${ar(v)}</div>`); sfx.step(); await wait(260);
      }
      busy = false;
      if (b >= 8) { prog.var = b; ctx.ok(`البطارية بدأت بـ ${ar(b)} وانتهت بـ ${ar(b - 8)}. المتغير تغيّر في كل حركة!`); next(); }
      else { $('#vv').textContent = ar(b); ctx.fail(`نفدت البطارية بعد ${ar(b)} حركات. الرحلة تحتاج ٨.`, { noCheck: true }); }
    };
  }
  function ch6() {
    ctx.say('جمعت البرنامج كله… لكن حشرة تسللت إليه! 🐞 اقرأه وجد السطر الخاطئ.', 'wow');
    const lines = [['<span class="vr">البطارية</span> = ' + ar(prog.var || 8), 0], ['التقط نواة الطاقة 🔋', 0], [`<span class="kw">كرر</span> ${ar(prog.loop || 6)} مرات:`, 0], ['⬅️ تحرّك يسارًا', 1], ['<span class="kw">إذا</span> الإشارة حمراء: قف 🛑', 1], ['<span class="kw">إذا</span> معك بطاقة: ادخل المركز، <span class="kw">وإلا</span>: اطلب بطاقة', 0], ['ضع النواة في المركز ثم شغّل النظام ⚡', 0]];
    const BUG = 3;
    ctx.host.innerHTML = head() + `<p class="small muted" style="margin-top:8px">تذكير: المركز يقع <b>يمين</b> نقطة البداية.</p><div class="code" id="cd">${lines.map(([t, ind], i) => `<div class="cl pick${ind ? ' ind' : ''}" data-i="${i}"><span class="n">${ar(i + 1)}</span>${t}</div>`).join('')}</div>`;
    let found = false;
    $('#cd').onclick = e => {
      const l = e.target.closest('.cl'); if (!l || found) return;
      if (+l.dataset.i === BUG) { found = true; ctx.bug(); l.classList.add('hit'); l.innerHTML = `<span class="n">${ar(BUG + 1)}</span>➡️ تحرّك يمينًا`; ctx.ok('لقد وجدت Bug! 🐞 الروبوت كان سيمشي في الاتجاه المعاكس. تم الإصلاح.'); later(next, 1500); }
      else { l.classList.add('miss'); later(() => l.classList.remove('miss'), 700); ctx.fail('هذا السطر سليم ✓', { noCheck: true }); }
    };
  }
  function ch7() {
    ctx.say('كل شيء جاهز. اضغط الزر… وأعد الحياة إلى النظام! ⚡', 'wow');
    const steps = ['البطارية = ' + ar(prog.var || 8) + ' 📦', 'التقط نواة الطاقة 🔋', `كرر ${ar(prog.loop || 6)} مرات: ➡️ تحرّك يمينًا 🔁`, 'إذا الإشارة حمراء: قف 🛑 🤔', 'إذا معك بطاقة: ادخل، وإلا: اطلب بطاقة ⚖️', 'ضع النواة في المركز 🔌', 'شغّل النظام ⚡'];
    ctx.host.innerHTML = head() + `<div class="two" style="margin-top:12px"><div class="code" id="cd">${steps.map((t, i) => `<div class="cl"><span class="n">${ar(i + 1)}</span>${t}</div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div class="core off" id="core"><div class="ring"></div><div class="ring r2"></div><div class="dot"></div></div><div class="bigq" id="cs">النظام متوقف</div></div></div>
      <div class="row c"><button class="btn lg emerald" id="go">⚡ تشغيل البرنامج النهائي</button></div>`;
    $('#go').onclick = async () => {
      $('#go').disabled = true; const ls = $$('#cd .cl');
      for (const l of ls) { l.classList.add('on'); sfx.step(); await wait(520); l.classList.remove('on'); l.classList.add('hit'); }
      $('#core').classList.remove('off'); $('#cs').textContent = 'النظام يعمل ✓'; c = CH.length; $('.chap').outerHTML = `<div class="chap">${CH.map(() => '<i class="done"></i>').join('')}</div>`;
      sfx.win(); burst(); await wait(900); ending();
    };
  }
  function ending() {
    const lines = ['لقد بدأت تفكر مثل المبرمج.', 'المبرمج لا يحفظ الأوامر فقط…', 'المبرمج يعرف كيف يحوّل المشكلة إلى خطوات،', 'والخطوات إلى قرارات،', 'والقرارات إلى برنامج.'];
    const ov = document.createElement('div'); ov.className = 'ending'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'النهاية');
    ov.innerHTML = `<div class="core"><div class="ring"></div><div class="ring r2"></div><div class="dot"></div></div>${lines.map((l, i) => `<div class="line${i === 0 ? ' big' : ''}">${l}</div>`).join('')}<button class="btn amber lg" id="endok" style="opacity:0;transition:opacity .6s">استلم جائزتك 🏆</button>`;
    document.body.appendChild(ov);
    const ls = $$('.line', ov);
    ls.forEach((l, i) => setTimeout(() => l.classList.add('show'), 500 + i * (REDUCE ? 100 : 1300)));
    setTimeout(() => { $('#endok').style.opacity = 1; $('#endok').focus(); }, 600 + ls.length * (REDUCE ? 100 : 1300));
    $('#endok').onclick = () => { ov.remove(); ctx.say('أنا ما حفظت البرمجة… أنا فهمت كيف يفكر البرنامج. 🧠', 'happy'); ctx.complete(); };
  }
  chapter();
};
