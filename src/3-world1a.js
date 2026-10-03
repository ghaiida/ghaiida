
/* ---------- home ---------- */
const W1IDS = ['w1s1', 'w1s2', 'w1s3', 'w1s4', 'w1s5', 'w1fin'];
const W2IDS = ['l1', 'l2', 'l3', 'c1', 'c2', 'c3', 'boss'];
ROUTES.home = () => {
  const d1 = W1IDS.filter(k => S.done[k]).length, d2 = W2IDS.filter(k => S.done[k]).length;
  app.innerHTML = `<div class="topline">${soundBtn()}</div>
  <section class="hero">
    <div class="hero-bot">${bot('happy', 120)}</div>
    <div><p class="eyebrow">لعبة تعلّم البرمجة · المرحلة المتوسطة</p>
      <h1>مغامرات <span class="hl">بِتّو</span></h1>
      <p class="lead">بِتّو روبوت ذكي جدًا… لكنه ينفّذ كل أمر <mark>حرفيًا</mark>. لا يخمّن، ولا يفهم «تقريبًا». علّمه كيف يفكّر المبرمجون، وستتعلم أنت معه.</p></div>
  </section>
  <div class="worlds">
    <button class="world w-blue" data-go="w1">
      <span class="w-art">1 2 3</span>
      <span class="w-tag">العالم الأول</span>
      <span class="w-title">مصنع البرامج</span>
      <span class="w-sub">خطوات تصميم البرنامج + ما هي الخوارزمية؟</span>
      <span class="w-list">٥ محطات: محقق المشكلات، مطبخ الخوارزمية، متاهة المقصف، صيد الحشرات، دفتر المبرمج</span>
      <span class="w-prog"><i style="width:${d1 / W1IDS.length * 100}%"></i></span>
      <span class="w-cta">ادخل المصنع ←</span>
    </button>
    <button class="world w-orange" data-go="w2">
      <span class="w-art">↻ ?</span>
      <span class="w-tag">العالم الثاني</span>
      <span class="w-title">مختبر الحلقات والشروط</span>
      <span class="w-sub">ما معنى Loop؟ وما هي if بأنواعها؟</span>
      <span class="w-list">سلّم بتّو، الكوب العجيب، مظلة بتّو، آلة الفرز، مصنّف الدرجات، وتحدي «بِز»</span>
      <span class="w-prog"><i style="width:${d2 / W2IDS.length * 100}%"></i></span>
      <span class="w-cta">ادخل المختبر ←</span>
    </button>
  </div>
  <div class="homecert"><button class="btn" data-go="cert">🏅 شهادتي (${ar(d1 + d2)} من ${ar(W1IDS.length + W2IDS.length)})</button></div>`;
};

/* ---------- world 1 map ---------- */
const W1 = [
  { id: 'w1s1', t: 'تحديد المشكلة', s: 'ما المطلوب؟ وما المدخلات والمخرجات؟', h: 'المهندس يسأل صاحب البيت: كم غرفة تريد؟', g: 'لعبة المحقق' },
  { id: 'w1s2', t: 'تصميم الحل (الخوارزمية)', s: 'نخطط خطوات الحل بالترتيب قبل أي كود', h: 'يرسم المخطط على الورق قبل أول طوبة', g: 'مطبخ بتّو' },
  { id: 'w1s3', t: 'كتابة البرنامج', s: 'نترجم الخوارزمية إلى لغة يفهمها الحاسب', h: 'يبدأ البناء الفعلي حسب المخطط', g: 'متاهة المقصف' },
  { id: 'w1s4', t: 'الاختبار وتصحيح الأخطاء', s: 'نشغّل البرنامج ونصطاد الأخطاء ونصلحها', h: 'يفحص الكهرباء والماء قبل أن يسكنه أحد', g: 'صيد الحشرات' },
  { id: 'w1s5', t: 'التوثيق والصيانة', s: 'نشرح البرنامج ونطوّره عند الحاجة', h: 'يكتب دليل البيت ويصلح ما يتلف لاحقًا', g: 'دفتر المبرمج' }
];
ROUTES.w1 = () => {
  frame('العالم الأول · مصنع البرامج', 'home', `
  ${talk('كل برنامج في العالم، من الألعاب إلى تطبيقات البنوك، يُصنع في <b>خمس محطات</b> بالترتيب نفسه. ادخل كل محطة والعب لتفهمها.')}
  <ol class="track">${W1.map((s, i) => `<li><button class="station ${S.done[s.id] ? 'done' : ''}" data-go="${s.id}">
    <span class="num">${ar(i + 1)}</span>
    <span class="st-body"><b>${s.t}</b><span>${s.s}</span><small>في بناء بيت: ${s.h}</small></span>
    <span class="st-side"><span class="gtag">${s.g}</span>${starHTML(S.stars[s.id])}</span></button></li>`).join('')}</ol>
  <section class="panel"><h3>احفظ المحطات بجملة واحدة</h3><p class="hint">قلها بصوت عالٍ ثلاث مرات، ولن تنساها.</p>
    <div class="chant"><span>حدِّدْ</span><i>←</i><span>صمِّمْ</span><i>←</i><span>اكتبْ</span><i>←</i><span>اختبرْ</span><i>←</i><span>وثِّقْ</span></div>
    <div class="row"><button class="btn primary" data-go="w1fin">التحدي الأخير: رتّب المحطات من ذاكرتك ←</button>${starHTML(S.stars.w1fin)}</div></section>`);
};

/* ---------- station 1: define the problem ---------- */
ROUTES.w1s1 = () => {
  frame('المحطة ١ · تحديد المشكلة', 'w1', `
  ${talk('قبل أن يكتب الطبيب الدواء، يسأل المريض: <b>بماذا تشعر؟</b> والمبرمج كذلك! أول خطوة أن نفهم المشكلة: ما <b>المدخلات</b> التي نعطيها للبرنامج؟ وما <b>المخرجات</b> التي نريدها منه؟ وما المعلومات التي لا تهمنا أصلًا؟')}
  <section class="panel">
    <p class="task"><span class="pill">المشكلة</span>نريد برنامجًا يحسب <mark>معدّل</mark> طالب في ثلاث مواد.</p>
    <p class="hint">أنت المحقق 🔍 اضغط على بطاقة، ثم اضغط على الصندوق المناسب لها.</p>
    <div class="chips" id="chips"></div>
    <div class="bins">
      <div class="bin" data-bin="in" role="button" tabindex="0"><b>📥 مدخلات</b><small>ما نعطيه للبرنامج</small><div class="bin-items"></div></div>
      <div class="bin" data-bin="out" role="button" tabindex="0"><b>📤 مخرجات</b><small>النتيجة التي نريدها</small><div class="bin-items"></div></div>
      <div class="bin" data-bin="no" role="button" tabindex="0"><b>🗑️ لا تهمنا</b><small>معلومة لا تؤثر في الحل</small><div class="bin-items"></div></div>
    </div>
    <div class="fb" id="fb" hidden></div>
  </section><div id="after"></div>`);
  const ITEMS = shuffle([
    { t: 'درجة الرياضيات', b: 'in', r: 'صحيح! نحتاجها لنجمع الدرجات.' },
    { t: 'درجة العلوم', b: 'in', r: 'صحيح! هي إحدى الدرجات الثلاث.' },
    { t: 'درجة لغتي', b: 'in', r: 'صحيح! هذه الدرجة الثالثة.' },
    { t: 'عدد المواد (٣)', b: 'in', r: 'ممتاز! سنقسم المجموع على هذا العدد.' },
    { t: 'المعدّل', b: 'out', r: 'بالضبط! هذا ما يريد المستخدم أن يراه في النهاية.' },
    { t: 'لون حقيبة الطالب', b: 'no', r: 'صحيح، لون الحقيبة لا يغيّر المعدل أبدًا 😄' },
    { t: 'اسم المدرسة', b: 'no', r: 'صحيح، لا نحتاجه في الحساب.' },
    { t: 'حالة الطقس اليوم', b: 'no', r: 'صحيح، الطقس لا علاقة له بالمعدل.' }
  ]).map((x, i) => ({ ...x, i }));
  const HINT = { in: 'هل نحتاج هذه المعلومة لنبدأ الحساب؟', out: 'هل هذا شيء نعطيه للبرنامج، أم شيء ننتظره منه؟', no: 'فكّر: هل تغيّر هذه المعلومة المعدل؟' };
  let sel = null, placed = 0, wrong = 0;
  const C = $('#chips'), F = $('#fb');
  C.innerHTML = ITEMS.map(x => `<button class="chip" data-i="${x.i}">${x.t}</button>`).join('');
  C.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    C.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
    sel = +b.dataset.i; b.classList.add('sel'); $$('.bin').forEach(x => x.classList.add('ready'));
  };
  $$('.bin').forEach(bin => {
    const act = () => {
      if (sel === null) { fb(F, 'اختر بطاقة أولًا، ثم اضغط على الصندوق.', false); return; }
      const it = ITEMS.find(x => x.i === sel), chip = C.querySelector(`[data-i="${sel}"]`);
      if (it.b === bin.dataset.bin) {
        sfx.ok(); chip.remove();
        bin.querySelector('.bin-items').insertAdjacentHTML('beforeend', `<span class="chip">${it.t}</span>`);
        fb(F, '✓ ' + it.r, true); placed++; sel = null; $$('.bin').forEach(x => x.classList.remove('ready'));
        if (placed === ITEMS.length) finish({
          id: 'w1s1', map: 'w1', next: 'w1s2', stars: wrong === 0 ? 3 : wrong <= 2 ? 2 : 1,
          memo: `<p>كل برنامج في الدنيا = <b>مدخلات</b> ← <b>معالجة</b> ← <b>مخرجات</b></p>
            <div class="ipo"><span>📥 الدرجات الثلاث</span><i>←</i><span>⚙️ المجموع ÷ ٣</span><i>←</i><span>📤 المعدّل</span></div>
            <p>والمعلومات التي لا تؤثر في الحل نستبعدها. <mark>المشكلة المفهومة جيدًا هي نصف الحل.</mark></p>`
        });
      } else { sfx.bad(); wrong++; shakeEl(bin); fb(F, '✗ ليس هنا. ' + HINT[it.b], false); }
    };
    bin.onclick = act;
    bin.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } };
  });
};

/* ---------- station 2: algorithm ---------- */
const LIT = [
  { task: 'اطلب من بتّو أن يفتح باب الفصل.', opts: [
    { t: 'افتح.', ok: false, r: 'بتّو فتح… فمه! 😮 «أفتح ماذا؟ لم تحدد!»' },
    { t: 'تقدّم إلى الباب، أمسك المقبض، أدِره للأسفل، ثم اسحب الباب نحوك.', ok: true, r: 'انفتح الباب! كل خطوة واضحة ومحددة.' }] },
  { task: 'اطلب منه أن يضع الجبن على الخبز.', opts: [
    { t: 'افتح علبة الجبن، خذ ملعقة جبن، وافردها على وجه شريحة الخبز.', ok: true, r: 'ساندويتش لذيذ 🥪 أوامر دقيقة = نتيجة صحيحة.' },
    { t: 'ضع الجبن على الخبز.', ok: false, r: 'بتّو وضع علبة الجبن كاملة، وهي مغلقة، فوق الرغيف! 📦🍞' }] },
  { task: 'اطلب منه أن يرسم مربعًا.', opts: [
    { t: 'ارسم شكلًا جميلًا له زوايا.', ok: false, r: 'رسم بتّو نجمة بـ ١٧ زاوية… «هي جميلة ولها زوايا!» 🤷' },
    { t: 'ارسم خطًا طوله ٥ سم، استدر ٩٠ درجة، وكرّر ذلك ٤ مرات.', ok: true, r: 'مربع مثالي ⬛ أوامر دقيقة بأرقام واضحة.' }] }
];
const TEA = [
  { id: 1, t: 'املأ الغلاية بالماء' }, { id: 2, t: 'شغّل الغلاية حتى يغلي الماء' }, { id: 3, t: 'ضع كيس الشاي في الكوب' },
  { id: 4, t: 'اسكب الماء المغلي في الكوب' }, { id: 5, t: 'انتظر ٣ دقائق' }, { id: 6, t: 'أخرج الكيس وقدّم الكوب' }
];
const SHAPES = [
  { k: 'oval', svg: '<rect x="6" y="14" width="88" height="36" rx="18"/>', m: 'بداية / نهاية', c: '#DCE6FF' },
  { k: 'para', svg: '<polygon points="22,14 94,14 78,50 6,50"/>', m: 'إدخال / إخراج', c: '#FFF0BF' },
  { k: 'rect', svg: '<rect x="8" y="14" width="84" height="36"/>', m: 'معالجة (عملية أو حساب)', c: '#FFE0CC' },
  { k: 'dia', svg: '<polygon points="50,2 96,32 50,62 4,32"/>', m: 'قرار (سؤال جوابه نعم أو لا)', c: '#D5F2E1' }
];
function avgFlow() {
  const N = [['oval', 'ابدأ'], ['para', 'أدخل الدرجات الثلاث'], ['rect', 'المجموع = د١ + د٢ + د٣'], ['rect', 'المعدل = المجموع ÷ ٣'], ['para', 'اطبع المعدل'], ['oval', 'النهاية']];
  let s = '';
  N.forEach(([k, t], i) => {
    const y = 8 + i * 64, x = 30, w = 200, h = 42;
    const shape = k === 'oval' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="21"/>`
      : k === 'para' ? `<polygon points="${x + 18},${y} ${x + w},${y} ${x + w - 18},${y + h} ${x},${y + h}"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    s += `<g class="fn-${k}">${shape}<text x="130" y="${y + h / 2 + 1}" dominant-baseline="middle" text-anchor="middle">${t}</text></g>`;
    if (i < N.length - 1) s += `<path class="fa" d="M130 ${y + h} V ${y + 62} M124 ${y + 56} L130 ${y + 63} L136 ${y + 56}"/>`;
  });
  return `<svg class="flow" viewBox="0 0 260 ${8 + 6 * 64}" role="img" aria-label="مخطط انسيابي لبرنامج حساب المعدل">${s}</svg>`;
}
ROUTES.w1s2 = () => {
  frame('المحطة ٢ · تصميم الحل (الخوارزمية)', 'w1', `
  ${talk('قبل أن نكتب أي كود، نخطط للحل خطوة بخطوة. هذا التخطيط اسمه <b>الخوارزمية</b>. لكن احذر: بتّو ينفّذ كل شيء <b>حرفيًا</b>! لنختبره أولًا…', 'happy', 't')}
  <div class="parts"><span class="part" data-p="1">أ · بتّو الحرفي</span><span class="part" data-p="2">ب · مطبخ الخوارزمية</span><span class="part" data-p="3">ج · لغة الأشكال</span></div>
  <section class="panel" id="P"></section><div id="after"></div>`);
  const T = $('#t'), P = $('#P');
  const setPart = n => $$('.part').forEach(p => { const k = +p.dataset.p; p.classList.toggle('on', k === n); p.classList.toggle('ok', k < n); });
  let teaTries = 0, shapeWrong = 0;
  partA();

  function partA() {
    setPart(1); let r = 0;
    const show = () => {
      const q = LIT[r];
      P.innerHTML = `<h3>أعطِ بتّو أمرًا يفهمه</h3><p class="task"><span class="pill">المهمة ${ar(r + 1)} من ${ar(LIT.length)}</span>${q.task}</p>
        <div class="opts">${q.opts.map((o, j) => `<button class="opt" data-j="${j}">«${o.t}»</button>`).join('')}</div>
        <div class="lit-stage" id="ls">${bot('happy', 64)}<div class="lit-say">بانتظار أمرك…</div></div>
        <div class="row" id="nx" hidden><button class="btn primary">${r < LIT.length - 1 ? 'المهمة التالية ←' : 'إلى مطبخ الخوارزمية ←'}</button></div>`;
      P.querySelector('.opts').onclick = e => {
        const b = e.target.closest('.opt'); if (!b || b.disabled) return;
        const o = q.opts[+b.dataset.j];
        $('#ls').innerHTML = bot(o.ok ? 'happy' : 'wow', 64) + `<div class="lit-say ${o.ok ? 'good' : 'oops'}">${o.r}</div>`;
        if (o.ok) { sfx.ok(); b.classList.add('ok'); P.querySelectorAll('.opt').forEach(x => x.disabled = true); $('#nx').hidden = false; }
        else { sfx.bad(); b.classList.add('bad'); b.disabled = true; }
      };
      $('#nx button').onclick = () => {
        r++;
        if (r < LIT.length) show();
        else { setTalk(T, 'لاحظت؟ الأمر الغامض يُنتج نتيجة غريبة. الحاسب مثل بتّو تمامًا: <mark>لا يخمّن</mark>. الآن رتّب خطوات صنع كوب شاي، وسينفّذها بتّو بالترتيب الذي تضعه أنت بالضبط.'); partB(); }
      };
    };
    show();
  }

  function partB() {
    setPart(2);
    P.innerHTML = `<h3>مطبخ الخوارزمية: كوب شاي ☕</h3><p class="hint">اضغط البطاقات بالترتيب. اضغط بطاقة في «ترتيبك» لإرجاعها.</p>
      <div id="bd"></div>
      <div class="kitchen"><div class="obj"><span class="em off" id="kE">🫖</span><small id="kS">الغلاية فارغة</small></div><div class="obj"><span class="em off" id="cE">☕</span><small id="cS">الكوب فارغ</small></div></div>
      <div class="row"><button class="btn primary" id="runT" disabled>▶ شغّل الخوارزمية</button></div><div class="fb" id="fbT" hidden></div><div id="defn"></div>`;
    const bd = builder($('#bd'), TEA, seq => { $('#runT').disabled = seq.length !== TEA.length; });
    const K = (e, s, on) => { $('#kE').classList.toggle('off', !on); $('#kE').textContent = e; $('#kS').textContent = s; };
    const C = (s, on) => { $('#cE').classList.toggle('off', !on); $('#cS').textContent = s; };
    function step(id, st) {
      switch (id) {
        case 1: st.water = 1; K('🫖', 'فيها ماء بارد', true); return '';
        case 2: if (!st.water) return 'شغّلت الغلاية وهي فارغة! 🔥 كادت تحترق. يجب أن نملأها أولًا.';
          st.boil = 1; K('♨️', 'الماء يغلي', true); return '';
        case 3: st.bag = 1; C(st.pour ? 'ماء ساخن + كيس شاي' : 'فيه كيس شاي', true); return '';
        case 4: if (!st.water) return 'سكبت… لا شيء! الغلاية فارغة أصلًا.';
          if (!st.boil) return 'سكبت ماءً باردًا 🥶 لن يصنع شايًا!';
          st.pour = 1; C(st.bag ? 'ماء ساخن + كيس شاي' : 'فيه ماء ساخن', true); return '';
        case 5: if (!st.pour) return 'انتظرت ٣ دقائق أمام كوب فارغ… ⏳ لم يحدث شيء!';
          if (!st.bag) return 'انتظرت، لكن لا يوجد كيس شاي في الكوب! النتيجة: ماء ساخن فقط.';
          st.wait = 1; C('الشاي يتخمّر…', true); return '';
        case 6: if (!st.wait) return 'قدّمت الكوب قبل أن يجهز الشاي… طعمه غريب! 😖';
          C('شاي جاهز! 😋', true); return '';
      }
    }
    $('#runT').onclick = async () => {
      bd.locked = true; $('#runT').disabled = true; bd.clearMarks(); $('#fbT').hidden = true; teaTries++;
      K('🫖', 'الغلاية فارغة', false); C('الكوب فارغ', false);
      const st = {}, seq = bd.seq;
      for (let i = 0; i < seq.length; i++) {
        bd.mark(i, 'on'); await wait(700);
        const err = step(seq[i].id, st);
        bd.clearMarks();
        for (let j = 0; j < i; j++) bd.mark(j, 'ok');
        if (err) { bd.mark(i, 'bad'); sfx.bad(); fb($('#fbT'), `✗ عند الخطوة ${ar(i + 1)}: ${err}<br><small>الترتيب مهم! أرجِع البطاقات الخاطئة وجرّب مرة أخرى.</small>`, false); bd.locked = false; $('#runT').disabled = false; return; }
        bd.mark(i, 'ok'); sfx.step();
      }
      sfx.ok(); fb($('#fbT'), '✓ كوب شاي مثالي! بتّو نفّذ خوارزميتك خطوة بخطوة.', true);
      setTalk(T, 'رائع! الآن عرفت معنى <b>الخوارزمية</b> بنفسك. اقرأ التعريف بالأسفل، ثم انتقل لآخر جزء.', 'happy');
      $('#defn').innerHTML = `<div class="defn"><div class="defn-title">الخوارزمية</div>
        <p class="defn-text">مجموعة من <mark>الخطوات المرتّبة والواضحة والمحدّدة</mark> التي نتبعها لحل مشكلة، ولها بداية ونهاية.</p>
        <div class="props"><div><b>مرتّبة</b><span>غيّر الترتيب فتحصل على شاي بارد 🥶</span></div><div><b>واضحة ومحدّدة</b><span>«افتح» وحدها جعلت بتّو يفتح فمه</span></div><div><b>منتهية</b><span>لها بداية ونهاية، ولا تستمر للأبد</span></div></div>
        <p class="fact"><b>هل تعلم؟</b> كلمة <span dir="ltr">Algorithm</span> أصلها اسم العالِم المسلم <b>محمد بن موسى الخوارزمي</b> الذي عاش في بغداد في القرن التاسع الميلادي. كتب الأوروبيون اسمه باللاتينية <span dir="ltr">«Algoritmi»</span>، فصار اسمه اسمًا لكل خطوات الحل في العالم!</p>
        <div class="row"><button class="btn primary" id="toC">ج · لغة الأشكال ←</button></div></div>`;
      $('#toC').onclick = partC;
    };
  }

  function partC() {
    setPart(3);
    setTalk(T, 'المبرمجون يرسمون الخوارزمية أحيانًا بأشكال، اسمها <b>المخطط الانسيابي</b>. لكل شكل معنى. طابِق كل شكل بمعناه!', 'happy');
    window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' });
    const means = shuffle(SHAPES);
    P.innerHTML = `<h3>لغة الأشكال</h3><p class="hint">اضغط على شكل، ثم اضغط على معناه.</p>
      <div class="match"><div class="mcol">${SHAPES.map(s => `<button class="shape" data-k="${s.k}" style="--sfill:${s.c}" aria-label="شكل"><svg viewBox="0 0 100 64">${s.svg}</svg></button>`).join('')}</div>
      <div class="mcol">${means.map(s => `<button class="opt mean" data-k="${s.k}">${s.m}</button>`).join('')}</div></div>
      <div class="fb" id="fbS" hidden></div><div id="flowbox"></div>`;
    let sel = null, matched = 0;
    P.querySelectorAll('.shape').forEach(b => b.onclick = () => { if (b.disabled) return; P.querySelectorAll('.shape').forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); });
    P.querySelectorAll('.mean').forEach(b => b.onclick = () => {
      if (b.disabled) return;
      if (!sel) { fb($('#fbS'), 'اختر شكلًا أولًا.', false); return; }
      if (sel.dataset.k === b.dataset.k) {
        sfx.ok(); sel.classList.remove('sel'); sel.classList.add('ok'); b.classList.add('ok'); sel.disabled = true; b.disabled = true; sel = null; matched++;
        fb($('#fbS'), '✓ صحيح!', true);
        if (matched === SHAPES.length) {
          $('#flowbox').innerHTML = `<div class="defn"><h3>شاهد خوارزمية «حساب المعدل» من المحطة ١ كمخطط انسيابي</h3><div class="flowwrap">${avgFlow()}</div></div>`;
          finish({ id: 'w1s2', map: 'w1', next: 'w1s3', stars: teaTries <= 1 && shapeWrong === 0 ? 3 : teaTries <= 3 ? 2 : 1,
            memo: `<p><b>الخوارزمية</b> = خطوات <mark>مرتّبة + واضحة + منتهية</mark> لحل مشكلة.</p><p>نكتبها بالكلام (خطوات مرقّمة) أو نرسمها <b>مخططًا انسيابيًا</b>: ⬭ بداية/نهاية، ▱ إدخال/إخراج، ▭ معالجة، ◇ قرار.</p><p>وتذكّر صاحبها: <b>الخوارزمي</b> 🌙</p>` });
        }
      } else { sfx.bad(); shapeWrong++; shakeEl(b); fb($('#fbS'), '✗ ليس هذا معناه، جرّب مرة أخرى.', false); }
    });
  }
};
