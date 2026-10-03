
/* ---------- station 3: write the program ---------- */
function codingLevel(host, L, onWin, max = 20) {
  host.innerHTML = `<div class="lvl"><div class="gh"></div><div>
    <div class="lbl">اضغط الأوامر لتضيفها إلى برنامجك</div>
    <div class="pal">${['U', 'D', 'R', 'L'].map(k => `<button class="blk" data-add="${k}">${blkLabel(k)}</button>`).join('')}</div>
    <div class="lbl" style="margin-top:12px">برنامجك <span class="cnt"></span> · اضغط أمرًا لحذفه</div>
    <div class="prog"></div>
    <div class="row"><button class="btn primary" data-a="run">▶ شغّل</button><button class="btn" data-a="clear">مسح الكل</button></div>
    <div class="fb" hidden></div></div>
    <div class="trans"><div><div class="lbl">الخوارزمية بلغتنا</div><div class="pseudo ps"></div></div><div><div class="lbl">البرنامج نفسه بلغة بايثون</div><div class="code cd"></div></div></div></div>`;
  const g = makeGrid(host.querySelector('.gh'), L);
  const P = host.querySelector('.prog'), F = host.querySelector('.fb'), PS = host.querySelector('.ps'), CD = host.querySelector('.cd'), CNT = host.querySelector('.cnt');
  let prog = [], busy = false;
  const draw = () => {
    P.innerHTML = prog.map((k, i) => `<button class="blk" data-i="${i}">${blkLabel(k)}</button>`).join('') || '<span class="empty">برنامجك فارغ…</span>';
    CNT.textContent = `(${ar(prog.length)} أمر)`;
    PS.innerHTML = prog.map((k, i) => `<div class="ln">${ar(i + 1)}. تحرّك خطوة إلى ${DIR[k][5]}</div>`).join('') || '<div class="ln skip">…</div>';
    CD.innerHTML = prog.length ? '<span class="cm"># برنامج بتّو</span>\n' + prog.map(k => DIR[k][4]).join('\n') : '<span class="cm"># ...</span>';
  };
  host.querySelector('.pal').onclick = e => {
    const b = e.target.closest('[data-add]'); if (!b || busy) return;
    if (prog.length >= max) { fb(F, `الحد الأقصى ${ar(max)} أمرًا.`, false); return; }
    prog.push(b.dataset.add); sfx.step(); F.hidden = true; draw();
  };
  P.onclick = e => { const b = e.target.closest('[data-i]'); if (!b || busy) return; prog.splice(+b.dataset.i, 1); draw(); };
  host.querySelector('[data-a=clear]').onclick = () => { if (busy) return; prog = []; draw(); g.reset(); F.hidden = true; };
  host.querySelector('[data-a=run]').onclick = async () => {
    if (busy) return;
    if (!prog.length) { fb(F, 'أضف بعض الأوامر أولًا.', false); return; }
    busy = true; F.hidden = true; draw();
    const blks = [...P.querySelectorAll('.blk')], lns = [...PS.querySelectorAll('.ln')];
    const res = await g.run(prog, i => { blks.forEach((b, j) => b.classList.toggle('on', j === i)); lns.forEach((b, j) => b.classList.toggle('on', j === i)); });
    if (res.ok) { sfx.ok(); fb(F, '🎉 وصل العصير! برنامجك يعمل.', true); onWin(prog.length); return; } // stays locked after a win
    busy = false;
    blks.forEach(b => b.classList.remove('on')); if (blks[res.i]) blks[res.i].classList.add('bad');
    fb(F, gridFail(res) + (res.why === 'short' ? ' أكمل البرنامج!' : ' احذف الأمر الخاطئ وجرّب.'), false);
  };
  draw();
}
ROUTES.w1s3 = () => {
  frame('المحطة ٣ · كتابة البرنامج', 'w1', `
  ${talk('صمّمنا الحل، والآن نكتبه بلغة يفهمها الحاسب. هذا اسمه <b>البرمجة</b> أو <b>الترميز</b>. مهمتك: اكتب برنامجًا يوصل بتّو بالعصير 🧃 إلى الطالب 🙋 دون أن يصطدم بالكراسي. وراقب كيف تتحوّل أوامرك العربية إلى <b>كود حقيقي</b>!')}
  <section class="panel"><h3 id="lt"></h3><div id="L"></div></section><div id="after"></div>`);
  const LV = [
    { w: 5, h: 4, start: [0, 3], goal: [4, 0], walls: [[1, 1], [2, 1], [3, 3], [1, 2]] },
    { w: 6, h: 5, start: [0, 4], goal: [5, 0], walls: [[1, 3], [1, 2], [1, 1], [3, 4], [3, 3], [3, 1], [3, 0], [5, 3], [5, 4]] }
  ];
  let lv = 0;
  const start = () => {
    $('#lt').textContent = `المستوى ${ar(lv + 1)} من ${ar(LV.length)}`;
    codingLevel($('#L'), LV[lv], () => {
      if (lv < LV.length - 1) {
        $('#L').insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary" id="nxl">المستوى التالي ←</button></div>');
        $('#nxl').onclick = () => { lv++; start(); };
      } else finish({ id: 'w1s3', map: 'w1', next: 'w1s4',
        memo: `<p><b>كتابة البرنامج</b> = ترجمة الخوارزمية إلى <mark>لغة برمجة</mark> يفهمها الحاسب.</p>
          <div class="ipo"><span>تحرّك خطوة إلى اليمين</span><i>←</i><span dir="ltr" style="font-family:var(--f-mono)">robot.move_right()</span></div>
          <p>اللغات كثيرة (بايثون، سكراتش، جافا…) لكن الفكرة واحدة: الحاسب ينفّذ الأوامر <b>بالترتيب، واحدًا تلو الآخر</b>.</p>` });
    });
  };
  start();
};

/* ---------- station 4: test & debug ---------- */
function debugLevel(host, L, buggy, onWin, onTry) {
  let prog = [...buggy], busy = false, tries = 0, ran = false;
  const orig = [...buggy];
  host.innerHTML = `<div class="lvl"><div class="gh"></div><div>
    <div class="lbl">برنامج زميلك (اضغط أمرًا لتغيير اتجاهه 🔄)</div>
    <div class="prog"></div>
    <div class="row"><button class="btn primary" data-a="run">▶ اختبر البرنامج</button></div>
    <div class="fb" hidden></div>
    <div class="lbl" style="margin-top:12px">سجل الاختبارات 🧪</div><div class="log"><div>لم تُجرَ أي تجربة بعد.</div></div></div></div>`;
  const g = makeGrid(host.querySelector('.gh'), L);
  const P = host.querySelector('.prog'), F = host.querySelector('.fb'), LOG = host.querySelector('.log');
  const cyc = { U: 'R', R: 'D', D: 'L', L: 'U' };
  const draw = () => { P.innerHTML = prog.map((k, i) => `<button class="blk${k !== orig[i] ? ' edited' : ''}" data-i="${i}">${blkLabel(k)}</button>`).join(''); };
  P.onclick = e => {
    const b = e.target.closest('[data-i]'); if (!b || busy) return;
    if (!ran) { fb(F, 'المبرمج الذكي يختبر أولًا 😉 اضغط «اختبر البرنامج» لترى أين المشكلة.', false); return; }
    const i = +b.dataset.i; prog[i] = cyc[prog[i]]; sfx.step(); draw();
  };
  host.querySelector('[data-a=run]').onclick = async () => {
    if (busy) return; busy = true; ran = true; tries++; onTry(); F.hidden = true; draw();
    const blks = [...P.querySelectorAll('.blk')];
    const res = await g.run(prog, i => blks.forEach((b, j) => b.classList.toggle('on', j === i)));
    if (tries === 1) LOG.innerHTML = '';
    LOG.insertAdjacentHTML('beforeend', `<div class="${res.ok ? 'y' : 'n'}">التجربة ${ar(tries)}: ${res.ok ? '✓ وصل بتّو! لا توجد أخطاء.' : '✗ ' + gridFail(res)}</div>`);
    if (res.ok) { sfx.ok(); fb(F, '🐛 تم اصطياد كل الحشرات! البرنامج يعمل.', true); onWin(); return; }
    busy = false; blks.forEach(b => b.classList.remove('on')); if (blks[res.i]) blks[res.i].classList.add('bad');
    fb(F, res.why === 'short' ? 'وصلنا لنهاية البرنامج ولم يصل بتّو. ابحث عن الأمر الخاطئ.' : `الحشرة غالبًا في الأمر رقم ${ar(res.i + 1)} أو قبله. اضغطه لتغيير اتجاهه، ثم اختبر مرة أخرى.`, false);
  };
  draw();
}
ROUTES.w1s4 = () => {
  frame('المحطة ٤ · الاختبار وتصحيح الأخطاء', 'w1', `
  ${talk('لماذا يسمّى الخطأ البرمجي <b>Bug</b> أي «حشرة»؟ في عام <b>١٩٤٧م</b> توقّف حاسوب ضخم في جامعة هارفارد، فوجد الفريق <b>فراشة حقيقية</b> عالقة داخله! ألصقوها في دفتر الملاحظات وكتبوا: «أول حشرة حقيقية يتم العثور عليها». ومن يومها صار إصلاح الأخطاء اسمه <b>Debugging</b>.<br>زميلك كتب برنامجًا لبتّو… وفيه حشرات! <b>اختبره أولًا</b>، ثم اضغط الأمر الخاطئ لتغيير اتجاهه.')}
  <section class="panel"><h3 id="lt"></h3><div id="L"></div></section><div id="after"></div>`);
  const LV = [
    { L: { w: 5, h: 4, start: [0, 3], goal: [4, 1], walls: [[1, 2], [3, 2]] }, bug: ['R', 'R', 'U', 'R', 'R', 'R'] },
    { L: { w: 6, h: 5, start: [0, 4], goal: [5, 0], walls: [[0, 2], [2, 3], [2, 2], [4, 1], [4, 2], [3, 4]] }, bug: ['U', 'R', 'U', 'L', 'U', 'R', 'R', 'D', 'R'] }
  ];
  let lv = 0, tries = 0;
  const start = () => {
    $('#lt').textContent = `البرنامج ${ar(lv + 1)} من ${ar(LV.length)}${lv === 1 ? ' · فيه حشرتان!' : ''}`;
    debugLevel($('#L'), LV[lv].L, LV[lv].bug, () => {
      if (lv < LV.length - 1) {
        $('#L').insertAdjacentHTML('beforeend', '<div class="row"><button class="btn primary" id="nxl">البرنامج التالي ←</button></div>');
        $('#nxl').onclick = () => { lv++; start(); };
      } else finish({ id: 'w1s4', map: 'w1', next: 'w1s5', stars: tries <= 6 ? 3 : tries <= 9 ? 2 : 1,
        memo: `<p><b>الاختبار</b> = نشغّل البرنامج لنتأكد أنه يعطي النتيجة الصحيحة.</p><p><b>تصحيح الأخطاء (Debugging)</b> = نبحث عن مكان الخطأ ونصلحه، ثم <mark>نختبر من جديد</mark>. وهكذا حتى يعمل.</p><p>المبرمج المحترف لا يخاف من الأخطاء… بل يصطادها! 🐛🔍</p>` });
    }, () => tries++);
  };
  start();
};

/* ---------- station 5: documentation & maintenance ---------- */
ROUTES.w1s5 = () => {
  frame('المحطة ٥ · التوثيق والصيانة', 'w1', `
  ${talk('البرنامج يعمل! لكن المهمة لم تنتهِ. نكتب <b>توثيقًا</b>: ملاحظات تشرح البرنامج للبشر (الحاسب يتجاهلها). ثم تأتي <b>الصيانة</b>: تطوير البرنامج وإصلاحه بعد أن يستخدمه الناس.')}
  <section class="panel"><h3>دفتر المبرمج</h3><div id="qz"></div></section><div id="after"></div>`);
  const QS = [
    { q: 'بعد سنة كاملة، فتحتَ برنامجك لتعدّله. أيّ نسخة ستفهمها أسرع؟', opts: [
      { t: '<div class="code mini">a = x + y + z\nb = a / 3\nprint(b)</div>', r: 'ستحتار: ما هو a؟ وما x؟ بلا أسماء واضحة ولا تعليقات، حتى أنت لن تفهم برنامجك!' },
      { t: '<div class="code mini"><span class="cm"># حساب معدّل الطالب</span>\n<span class="cm"># نجمع الدرجات الثلاث</span>\ntotal = math + science + arabic\n<span class="cm"># نقسم على عدد المواد</span>\naverage = total / 3\nprint(average)</div>', ok: true, r: 'بالضبط! الأسماء الواضحة والتعليقات (التي تبدأ بـ #) هي <b>التوثيق</b>. الحاسب يتجاهلها، لكنها كنز للبشر.' }] },
    { q: 'أي تعليق يناسب هذا السطر؟', pre: code('average = total / 3'), opts: [
      { t: '<span dir="ltr"># هذا سطر</span>', r: 'لا يشرح شيئًا! التعليق الجيد يخبرك ماذا يفعل السطر.' },
      { t: '<span dir="ltr"># احسب المعدّل بقسمة المجموع على عدد المواد</span>', ok: true, r: 'تعليق واضح يشرح الهدف 👌' },
      { t: '<span dir="ltr"># اطبع اسم الطالب</span>', r: 'هذا تعليق خاطئ ومضلّل! السطر لا يطبع شيئًا.' }] },
    { q: 'أضافت المدرسة مادة رابعة. ماذا يفعل المبرمج؟', opts: [
      { t: 'يحذف البرنامج ويبدأ من الصفر.', r: 'لا داعي! البرنامج الموثّق سهل التعديل.' },
      { t: 'لا شيء، البرنامج سيكتشف المادة الجديدة وحده.', r: 'تذكّر بتّو الحرفي! الحاسب لا يعرف شيئًا لم نخبره به.' },
      { t: 'يضيف مُدخلًا جديدًا ويقسم على ٤ بدل ٣.', ok: true, r: 'صحيح! هذه هي <b>الصيانة</b>: تطوير البرنامج بعد تسليمه. والتوثيق يجعلها سهلة وسريعة.' }] }
  ];
  quiz($('#qz'), QS, wrong => finish({ id: 'w1s5', map: 'w1', next: 'w1fin', nextLabel: 'التحدي الأخير', stars: wrong === 0 ? 3 : wrong <= 2 ? 2 : 1,
    memo: `<p><b>التوثيق</b> = رسالة منك إلى المستقبل: تعليقات وأسماء واضحة تشرح البرنامج.</p><p><b>الصيانة</b> = إصلاح البرنامج وتطويره عندما تتغير الحاجة.</p><p><mark>البرنامج يُكتب مرة واحدة… ويُقرأ مئات المرات.</mark></p>` }));
};

/* ---------- world 1 final ---------- */
ROUTES.w1fin = () => {
  frame('التحدي الأخير · رتّب المحطات', 'w1', `
  ${talk('بدون النظر إلى الخريطة! رتّب محطات تصميم البرنامج الخمس كما يفعل المبرمجون المحترفون.', 'wow')}
  <section class="panel"><div id="bd"></div><div class="row"><button class="btn primary" id="ck" disabled>تحقّق ✓</button></div><div class="fb" id="fb" hidden></div></section><div id="after"></div>`);
  let tries = 0;
  const bd = builder($('#bd'), W1.map((s, i) => ({ id: i, t: s.t })), seq => { $('#ck').disabled = seq.length !== W1.length || bd.locked; });
  $('#ck').onclick = () => {
    tries++; bd.clearMarks(); let ok = true;
    bd.seq.forEach((it, i) => { const good = it.id === i; bd.mark(i, good ? 'ok' : 'bad'); if (!good) ok = false; });
    if (ok) {
      bd.locked = true; $('#ck').disabled = true; fb($('#fb'), '✓ ترتيب مثالي! أنت الآن تفكّر مثل مهندس برمجيات.', true);
      finish({ id: 'w1fin', map: 'w1', next: 'w2', nextLabel: 'إلى العالم الثاني', stars: tries === 1 ? 3 : tries === 2 ? 2 : 1,
        memo: `<div class="tablewrap"><table class="dict"><tr><th>المحطة</th><th>في بناء بيت</th></tr>${W1.map((s, i) => `<tr><td><b>${ar(i + 1)}. ${s.t}</b></td><td>${s.h}</td></tr>`).join('')}</table></div>
          <div class="chant" style="margin-top:10px"><span>حدِّدْ</span><i>←</i><span>صمِّمْ</span><i>←</i><span>اكتبْ</span><i>←</i><span>اختبرْ</span><i>←</i><span>وثِّقْ</span></div>` });
    } else { sfx.bad(); fb($('#fb'), 'البطاقات الحمراء في غير مكانها. اضغطها لإرجاعها وأعد المحاولة. تلميح: حدِّدْ ← صمِّمْ ← …', false); }
  };
};
