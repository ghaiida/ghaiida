
/* ---------- shared: tap (or drag) a card, then a zone ---------- */
function pairPick(cardsHost, zones, onDrop) {
  let sel = null;
  const clear = () => { $$('.card', cardsHost).forEach(c => c.classList.remove('sel')); zones.forEach(z => z.classList.remove('ready')); };
  cardsHost.addEventListener('click', e => {
    const c = e.target.closest('.card'); if (!c || c.disabled) return;
    clear(); sel = c; c.classList.add('sel'); zones.forEach(z => z.classList.add('ready')); sfx.tap();
  });
  cardsHost.addEventListener('dragstart', e => { const c = e.target.closest('.card'); if (!c) return; sel = c; e.dataTransfer.setData('text/plain', c.dataset.k || ''); zones.forEach(z => z.classList.add('ready')); });
  zones.forEach(z => {
    const act = () => { if (!sel) return false; const c = sel; sel = null; clear(); onDrop(c, z); return true; };
    z.addEventListener('click', () => { if (!act()) shake(z); });
    z.addEventListener('dragover', e => e.preventDefault());
    z.addEventListener('drop', e => { e.preventDefault(); act(); });
    z.setAttribute('tabindex', '0'); z.setAttribute('role', 'button');
    z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  });
}
/* ordered builder: tap pool cards to append; tap a placed card to return it */
function orderBuilder(host, items, onChange) {
  let pool = shuffle(items), seq = [];
  host.innerHTML = `<div class="two"><div><span class="lbl">البطاقات</span><div class="cards b-pool"></div></div><div><span class="lbl">خوارزميتك</span><ol class="slots b-seq"></ol></div></div>`;
  const P = $('.b-pool', host), Q = $('.b-seq', host);
  const api = { locked: false, get seq() { return seq; }, mark(i, c) { const el = Q.children[i]?.querySelector('.card'); if (el) el.classList.add(c); }, unmark() { $$('.card', Q).forEach(c => c.classList.remove('on', 'ok', 'bad')); } };
  const draw = () => {
    P.innerHTML = pool.map(it => `<button class="card" data-id="${it.id}">${it.t}</button>`).join('') || '<span class="muted small">كل البطاقات في مكانها ✓</span>';
    Q.innerHTML = seq.map(it => `<li><button class="card" data-id="${it.id}">${it.t}</button></li>`).join('') + (pool.length ? `<li class="empty">${seq.length ? 'الخطوة التالية…' : 'اضغط بطاقة لتضعها هنا'}</li>` : '');
    onChange && onChange(seq, pool);
  };
  P.onclick = e => { const b = e.target.closest('[data-id]'); if (!b || api.locked) return; const i = pool.findIndex(x => String(x.id) === b.dataset.id); seq.push(pool.splice(i, 1)[0]); sfx.tap(); draw(); };
  Q.onclick = e => { const b = e.target.closest('[data-id]'); if (!b || api.locked) return; const i = seq.findIndex(x => String(x.id) === b.dataset.id); pool.push(seq.splice(i, 1)[0]); draw(); };
  draw(); return api;
}
/* a quick practice question inside a mission */
function practiceQ(ctx, html, opts, onRight) {
  const box = document.createElement('section'); box.className = 'panel';
  box.innerHTML = `<span class="eyebrow">طبّق الآن</span><div class="bigq" style="margin-top:4px">${html}</div><div class="cards">${opts.map((o, i) => `<button class="card" data-i="${i}">${o.t}</button>`).join('')}</div><div class="pfb"></div>`;
  $('#after').appendChild(box);
  later(() => box.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }), 500);
  let done = false;
  $('.cards', box).onclick = e => {
    const b = e.target.closest('.card'); if (!b || done || b.disabled) return; const o = opts[+b.dataset.i];
    if (o.ok) { done = true; b.classList.add('ok'); sfx.ok(); fbox($('.pfb', box), o.r || 'صحيح!', 'ok'); $$('.card', box).forEach(x => x.disabled = true); later(onRight, 700); }
    else { b.classList.add('bad'); b.disabled = true; sfx.oops(); fbox($('.pfb', box), o.r || 'ليس تمامًا… جرّب خيارًا آخر.', 'bad'); }
  };
}

/* ---------- b1: pick the real request ---------- */
MECH.pickSentence = ctx => {
  const ROUNDS = [
    { from: 'مسؤول المقصف', s: [
      ['مرحبًا أيها النظام! 👋', 'هذه تحية فقط.'],
      ['أنا مسؤول المقصف، وأعمل هنا منذ عشر سنوات.', 'معلومة عن الكاتب، لا تخبرنا ماذا يريد.'],
      ['الطلاب يحبون عصير البرتقال كثيرًا، وفطيرة الجبن أيضًا.', 'معلومة لطيفة، لكنها ليست طلبًا.'],
      ['كل يوم يتكوّن طابور طويل، ونتأخر في حساب سعر كل طلب.', 'قريب جدًا! هذا <b>سبب</b> المشكلة، لكن أين الطلب نفسه؟'],
      ['نريد برنامجًا يحسب السعر الإجمالي لطلب كل طالب بسرعة.', null],
      ['بالمناسبة، لون المقصف الجديد أزرق 💙', 'لا علاقة له بالبرنامج إطلاقًا 😄']] },
    { from: 'أمينة المكتبة', s: [
      ['السلام عليكم، أنا أمينة مكتبة المدرسة.', 'تعريف بالكاتبة.'],
      ['عندنا أكثر من ألفي كتاب، وأغلبها قصص.', 'معلومة عن المكتبة فقط.'],
      ['نحتاج تطبيقًا يذكّر الطالب بموعد إرجاع الكتاب قبل يوم.', null],
      ['بعض الطلاب ينسون الكتب في البيت أسابيع!', 'هذا سبب المشكلة، وليس المطلوب.']] }
  ];
  let r = 0;
  function show() {
    const R = ROUNDS[r];
    ctx.host.innerHTML = `${r ? '<span class="tag em">تدريب: رسالة جديدة</span>' : ''}
      <div class="stage" style="margin-top:8px"><div class="small muted" style="margin-bottom:8px">📩 رسالة من: <b>${R.from}</b></div>
      <div class="cards" style="flex-direction:column;align-items:stretch">${R.s.map((x, i) => `<button class="card" data-i="${i}" style="font-weight:500">${x[0]}</button>`).join('')}</div></div>`;
    $('.cards', ctx.host).onclick = e => {
      const b = e.target.closest('.card'); if (!b || b.disabled) return; const [, why] = R.s[+b.dataset.i];
      if (why === null) {
        b.classList.add('ok'); $$('.card', ctx.host).forEach(x => x.disabled = true);
        if (r === 0) { ctx.ok('هذا هو! «<b>برنامج يحسب السعر الإجمالي</b>». كل الباقي تفاصيل.'); ctx.say('رائع! الآن أعرف ماذا أبني. وانتبه: الطابور الطويل هو <b>السبب</b>، والبرنامج هو <b>الحل المطلوب</b>.', 'happy'); ctx.reveal(); later(() => { r++; show(); ctx.clear(); }, 2200); }
        else { ctx.ok('ممتاز! المطلوب: تطبيق يذكّر بموعد الإرجاع.'); ctx.complete(); }
      } else { b.classList.add('bad'); b.disabled = true; ctx.fail(why, { noCheck: true }); }
    };
  }
  show();
};

/* ---------- b2: inputs / outputs ---------- */
MECH.sortBins = ctx => {
  const ITEMS = shuffle([
    ['سعر الصنف', 'in', 'نعم، البرنامج يحتاجه ليحسب.'], ['الكمية المطلوبة', 'in', 'صحيح! ٣ عصائر تختلف عن عصير واحد.'], ['نوع الصنف (عصير أو فطيرة)', 'in', 'صحيح، منه نعرف السعر.'],
    ['السعر الإجمالي', 'out', 'بالضبط! هذا ما ينتظره الطالب على الشاشة.'], ['رسالة «طلبك جاهز ✅»', 'out', 'صحيح! يعرضها البرنامج في النهاية.'],
    ['لون المقصف', 'no', 'صحيح، اللون لا يغيّر السعر 😄'], ['عمر مسؤول المقصف', 'no', 'صحيح، لا علاقة له بالحساب.'], ['حالة الطقس', 'no', 'صحيح، الطقس لا يغيّر الفاتورة.']
  ]).map((x, i) => ({ t: x[0], b: x[1], r: x[2], i }));
  const HINT = { in: 'هل يحتاج البرنامج هذه المعلومة <b>ليبدأ</b> الحساب؟', out: 'هل هذا شيء نعطيه للبرنامج، أم شيء <b>ننتظره منه</b>؟', no: 'هل تغيّر هذه المعلومة الفاتورة فعلًا؟' };
  ctx.host.innerHTML = `<div class="cards" id="pool">${ITEMS.map(x => `<button class="card" draggable="true" data-i="${x.i}">${x.t}</button>`).join('')}</div>
    <div class="two" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:14px" id="zones">
      ${[['in', '📥 مدخلات', 'ما نعطيه للبرنامج'], ['out', '📤 مخرجات', 'ما يعطينا إياه'], ['no', '🗑️ لا تهمنا', 'لا تؤثر في الحل']].map(([k, t, s]) => `<div class="drop" data-z="${k}" style="flex-direction:column;align-items:stretch;min-height:150px;justify-content:flex-start;padding:10px"><b style="color:var(--ink)">${t}</b><small>${s}</small><div class="cards zin" style="margin-top:8px;min-height:0"></div></div>`).join('')}</div>`;
  const zones = $$('.drop', ctx.host);
  if (innerWidth < 560) $('#zones').style.gridTemplateColumns = '1fr';
  let placed = 0;
  pairPick($('#pool'), zones, (c, z) => {
    const it = ITEMS[+c.dataset.i];
    if (it.b === z.dataset.z) {
      c.remove(); $('.zin', z).insertAdjacentHTML('beforeend', `<span class="card ok" style="cursor:default;font-size:.85rem;padding:6px 10px">${it.t}</span>`);
      ctx.ok(it.r); placed++;
      if (placed === ITEMS.length) {
        ctx.say('الآن صار عندي «مخطط الآلة»: أعرف ماذا يدخل وماذا يخرج.', 'happy'); ctx.reveal();
        practiceQ(ctx, 'دخلت للبرنامج: <b>سعر العصير ٣ ريال</b> و<b>الكمية ٢</b>. ماذا سيخرج؟', [{ t: '٥ ريال', r: 'جمعت بدل أن تضرب! السعر × الكمية.' }, { t: '٦ ريال', ok: true, r: '٣ × ٢ = ٦. مدخلات ← معالجة ← مخرجات!' }, { t: '٣٢ ريال', r: 'هذا لصق للرقمين، لا حساب 😄' }], () => ctx.complete());
      }
    } else { shake(z); ctx.fail('ليس هنا. ' + HINT[it.b], { noCheck: true }); }
  });
};

/* ---------- b3: juice robot (sequence + funny execution) ---------- */
MECH.juice = ctx => {
  const CARDS = [{ id: 'or', t: '🍊 أحضر البرتقال' }, { id: 'cut', t: '🔪 اقطع البرتقال' }, { id: 'cup', t: '🥤 أحضر الكوب' }, { id: 'sq', t: '🧃 اعصر البرتقال' }, { id: 'sug', t: '🥄 أضف السكر' }, { id: 'pour', t: '🫗 اسكب العصير في الكوب' }];
  ctx.host.innerHTML = `<div id="bd"></div>
    <div class="stage" style="margin-top:14px"><div id="bub"></div><div class="scene">
      <div class="prop"><span class="e off" id="p-or">🍊</span><small id="s-or">البرتقال</small></div>
      <div class="prop"><span class="e off" id="p-sq">🫙</span><small id="s-sq">العصّارة فارغة</small></div>
      <div class="prop"><span class="e off" id="p-cup">🥤</span><small id="s-cup">لا يوجد كوب</small></div>
      <div class="prop" id="rbx">${robot('think', 70)}</div></div></div>
    <div class="row"><button class="btn emerald" id="run" disabled>▶ نفّذ</button></div>`;
  let bd = null;
  bd = orderBuilder($('#bd'), CARDS, (seq, pool) => { $('#run').disabled = pool.length > 0 || !!(bd && bd.locked); });
  const P = (k, on, txt, emo) => { const e = $('#p-' + k); e.classList.toggle('off', !on); if (emo) e.textContent = emo; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); if (txt) $('#s-' + k).textContent = txt; };
  const bub = t => { $('#bub').innerHTML = `<div class="bubble2">${t}</div>`; };
  const rb = m => { $('#rbx').innerHTML = robot(m, 70); };
  function reset() { ['or', 'sq', 'cup'].forEach(k => $('#p-' + k).classList.add('off')); $('#p-or').textContent = '🍊'; $('#p-sq').textContent = '🫙'; $('#p-cup').textContent = '🥤'; $('#s-or').textContent = 'البرتقال'; $('#s-sq').textContent = 'العصّارة فارغة'; $('#s-cup').textContent = 'لا يوجد كوب'; $('#bub').innerHTML = ''; rb('think'); }
  function step(id, st) {
    switch (id) {
      case 'or': st.or = 1; P('or', 1, 'برتقال كامل'); return ['أحضرت البرتقال 🍊'];
      case 'cut': if (!st.or) return [null, 'أقطع ماذا؟ لا يوجد برتقال! 🔪😵']; st.cut = 1; P('or', 1, 'برتقال مقطّع'); return ['قطّعته قطعًا 🔪'];
      case 'cup': st.cup = 1; P('cup', 1, 'كوب فارغ'); return ['أحضرت الكوب 🥤'];
      case 'sq': if (!st.or) return [null, 'أعصر… الهواء؟ لا يوجد برتقال! 🤲']; if (!st.cut) return [null, 'عصرت برتقالة كاملة بقشرها… فطار العصير على وجهي! 💥🍊']; st.juice = 1; P('sq', 1, 'فيها عصير', '🧃'); P('or', 0, 'قشور'); return ['عصرته! 🧃'];
      case 'sug': if (!st.cup) return [null, 'لحظة! أين سأضع السكر؟ 😵 لا يوجد كوب! (انسكب السكر على الطاولة)']; st.sug = 1; P('cup', 1, st.pour ? 'عصير + سكر' : 'فيه سكر'); return ['أضفت السكر 🥄'];
      case 'pour': if (!st.juice) return [null, 'أسكب ماذا؟ العصّارة فارغة! 🫙']; if (!st.cup) return [null, 'سكبت العصير على الطاولة! 💦 أين الكوب؟']; st.pour = 1; P('cup', 1, st.sug ? 'عصير + سكر' : 'فيه عصير', '🧋'); return ['سكبت العصير 🫗'];
    }
  }
  $('#run').onclick = async () => {
    bd.locked = true; $('#run').disabled = true; bd.unmark(); ctx.clear(); reset();
    const st = {};
    for (let i = 0; i < bd.seq.length; i++) {
      bd.mark(i, 'on'); await wait(750);
      const [okMsg, err] = step(bd.seq[i].id, st);
      bd.unmark(); for (let j = 0; j < i; j++) bd.mark(j, 'ok');
      if (err) {
        bd.mark(i, 'bad'); bub(err); rb('dizzy');
        ctx.fail(`الروبوت توقّف عند الخطوة <b>${ar(i + 1)}</b>.`);
        ctx.say(err, 'dizzy'); bd.locked = false; $('#run').disabled = false; return;
      }
      bd.mark(i, 'ok'); bub(okMsg); sfx.step();
    }
    rb('happy'); bub('تفضّل! عصير برتقال طازج 🧋😋');
    ctx.ok('نجح الروبوت! كل خطوة جاءت في وقتها.'); ctx.say('أخيرًا عرفت ماذا أفعل أولًا! شكرًا لك 🧋', 'happy');
    ctx.reveal();
    practiceQ(ctx, 'خوارزمية <b>تسجيل الدخول</b> في تطبيق: ما الخطوة <b>الأولى</b>؟', [{ t: 'اضغط زر «دخول»', r: 'تضغط دخول قبل أن تكتب شيئًا؟' }, { t: 'افتح التطبيق', ok: true, r: 'نعم! ثم اكتب الاسم، ثم كلمة المرور، ثم اضغط دخول. خوارزمية تستخدمها كل يوم.' }, { t: 'اكتب كلمة المرور', r: 'في أي مكان ستكتبها والتطبيق مغلق؟' }], () => ctx.complete());
  };
};

/* ---------- b3c: literal robot (clear + ordered + executable) ---------- */
MECH.literal = ctx => {
  const R = [
    [['قم من السرير', 1], ['استعد للمدرسة', 'v', 'أستعد كيف؟ 😐 أعطني خطوة أستطيع تنفيذها.'], ['امشِ إلى موقف الحافلة', 'o', 'أمشي… وأنا ما زلت نائمًا في السرير؟ 😴']],
    [['البس الزي المدرسي', 1], ['كن مرتّبًا', 'v', 'مرتّبًا كيف؟ أعطني فعلًا أنفّذه 😐'], ['أغلق سحّاب الحقيبة', 'o', 'أغلقت حقيبة فارغة… وأنا بملابس النوم! 🩳']],
    [['ضع الكتب والدفاتر في الحقيبة', 1], ['جهّز أغراضك', 'v', 'أي أغراض؟ وأين أضعها؟ 🤨'], ['ارتدِ الحقيبة على ظهرك', 'o', 'ارتديت حقيبة فارغة! الكتب ما زالت على المكتب 📚']],
    [['أغلق سحّاب الحقيبة', 1], ['انتبه لحقيبتك', 'v', 'أنتبه لها… ثم ماذا؟ 👀 أنا أنظر إليها الآن.'], ['افتح الباب واخرج', 'o', 'خرجت… والحقيبة مفتوحة وتساقطت الكتب! 📚💨']],
    [['ارتدِ الحقيبة على ظهرك', 1], ['اذهب إلى المدرسة', 'v', 'كيف؟ 😐 أعطني خطوات يمكنني تنفيذها.'], ['امشِ إلى موقف الحافلة', 'o', 'وصلت الموقف… ونسيت الحقيبة في الغرفة! 🎒']],
    [['افتح الباب واخرج', 1], ['اذهب إلى المدرسة', 'v', 'كيف؟ 😐 قلت لك: أنا لا أفهم إلا خطوات صغيرة!'], ['قم من السرير', 'o', 'أقوم من السرير… مرة ثانية؟ 🤔 أنا مستيقظ أصلًا!']],
    [['امشِ إلى موقف الحافلة', 1], ['لا تتأخر', 'v', 'هذه نصيحة جميلة 🙂 لكنها ليست خطوة أنفّذها.'], ['البس الزي المدرسي', 'o', 'ألبسه مرة ثانية فوق الأولى؟ 🥵']]
  ];
  let r = 0, vague = 0, order = 0; const done = [];
  function show() {
    const opts = shuffle(R[r]);
    ctx.host.innerHTML = `<div class="two"><div><span class="lbl">ما الخطوة التالية؟</span><div class="cards" style="flex-direction:column;align-items:stretch">${opts.map(o => `<button class="card" data-t="${o[0]}">${o[0]}</button>`).join('')}</div>
      <div class="meter" style="margin-top:12px">التقدم <div class="m"><i style="width:${r / R.length * 100}%"></i></div>${ar(r)}/${ar(R.length)}</div></div>
      <div><span class="lbl">خوارزمية الروبوت حتى الآن</span><ol class="slots">${done.map(t => `<li><span class="card ok" style="cursor:default">${t}</span></li>`).join('') || '<li class="empty">لم تكتب أي خطوة بعد</li>'}</ol></div></div>`;
    $('.cards', ctx.host).onclick = e => {
      const b = e.target.closest('.card'); if (!b || b.disabled) return; const o = R[r].find(x => x[0] === b.dataset.t);
      if (o[1] === 1) { sfx.ok(); done.push(o[0]); ctx.clear(); ctx.say(['تمّ! ✅ هذه خطوة أفهمها.', 'نفّذت! واضحة ومرتّبة 👌', 'هذه خطوة حقيقية، أحببتها!'][r % 3], 'happy'); r++; if (r < R.length) show(); else finish(); }
      else { b.classList.add('bad'); b.disabled = true; if (o[1] === 'v') vague++; else order++; ctx.say(o[2], o[1] === 'v' ? 'think' : 'dizzy'); ctx.fail(o[1] === 'v' ? 'هذا أمر <b>غير واضح</b>: الروبوت لا يعرف كيف ينفّذه.' : 'هذه خطوة واضحة… لكن <b>في غير وقتها</b>.', { noCheck: true }); }
    };
  }
  async function finish() {
    ctx.host.innerHTML = `<span class="lbl">الروبوت ينفّذ خوارزميتك…</span><ol class="slots" id="run">${done.map(t => `<li><span class="card" style="cursor:default">${t}</span></li>`).join('')}</ol>`;
    const cs = $$('#run .card');
    for (const c of cs) { c.classList.add('on'); sfx.step(); await wait(380); c.classList.remove('on'); c.classList.add('ok'); }
    ctx.ok(`وصل الروبوت إلى موقف الحافلة! 🚌 لاحظ: رفض ${ar(vague)} أوامر غير واضحة، وتلخبط في ${ar(order)} أوامر جاءت في غير وقتها.`);
    ctx.say('الآن أستطيع الذهاب إلى المدرسة وحدي! 🎒🚌', 'happy');
    ctx.complete();
  }
  show();
};
