
/* ---------- world 2 map ---------- */
const W2L = [
  { id: 'l1', t: 'سلّم بتّو', s: 'التكرار بعدد معروف: «كرر ٦ مرات»', g: 'Loop · for' },
  { id: 'l2', t: 'متاهة النمط', s: 'كل ما داخل الحلقة يتكرر معًا في كل دورة', g: 'جسم الحلقة' },
  { id: 'l3', t: 'الكوب العجيب', s: '«كرر طالما…» والحلقة التي لا تنتهي', g: 'Loop · while' }
];
const W2C = [
  { id: 'c1', t: 'مظلة بتّو', s: '«إذا» تحقق الشرط ← نفّذ، وإلا تخطَّ', g: 'if' },
  { id: 'c2', t: 'آلة الفرز', s: '«إذا… وإلا» طريقان لا ثالث لهما', g: 'if … else' },
  { id: 'c3', t: 'مُصنِّف الدرجات', s: '«وإلا إذا» عدة شروط بالترتيب', g: 'else if' }
];
ROUTES.w2 = () => {
  const row = (s, i) => `<li><button class="station ${S.done[s.id] ? 'done' : ''}" data-go="${s.id}"><span class="num">${ar(i + 1)}</span><span class="st-body"><b>${s.t}</b><span>${s.s}</span></span><span class="st-side"><span class="gtag" dir="auto">${s.g}</span>${starHTML(S.stars[s.id])}</span></button></li>`;
  frame('العالم الثاني · مختبر الحلقات والشروط', 'home', `
  ${talk('في هذا المختبر ستمتلك <b>قوّتين خارقتين</b> يملكهما كل مبرمج: <b>التكرار</b> (الحلقات <span dir="ltr">Loop</span>) لتجعل الحاسب يعيد العمل دون تعب، و<b>القرار</b> (الشروط <span dir="ltr">If</span>) لتجعله يختار ماذا يفعل.')}
  <h3 class="sect">القوة الأولى: الحلقات <span dir="ltr">Loop</span> 🔁</h3><ol class="track">${W2L.map(row).join('')}</ol>
  <h3 class="sect">القوة الثانية: الشروط <span dir="ltr">If</span> 🔀</h3><ol class="track">${W2C.map(row).join('')}</ol>
  <button class="boss" data-go="boss"><span class="boss-k">التحدي النهائي · حلقة + شرط معًا</span><b>تحدي «بِز» ⚡</b><span>هل تستطيع أن تفكر مثل الحاسب… بسرعة؟</span>${starHTML(S.stars.boss)}</button>
  <section class="panel"><h3>قاموس بتّو</h3><div class="tablewrap"><table class="dict">
    <tr><th>المفهوم</th><th>معناه</th><th>مثال</th></tr>
    <tr><td><b>الحلقة <span dir="ltr">Loop</span></b></td><td>تكرار مجموعة أوامر</td><td>كرر ٥ مرات: صفّق</td></tr>
    <tr><td><b><span dir="ltr">for</span></b></td><td>نعرف عدد المرات مسبقًا</td><td><code>for i in range(7):</code></td></tr>
    <tr><td><b><span dir="ltr">while</span></b></td><td>نكرر طالما الشرط صحيح</td><td><code>while not cup.full():</code></td></tr>
    <tr><td><b><span dir="ltr">if</span></b></td><td>نفّذ فقط إذا تحقق الشرط</td><td><code>if rain:</code></td></tr>
    <tr><td><b><span dir="ltr">if … else</span></b></td><td>طريقان: واحد للصح وواحد للخطأ</td><td><code>else:</code></td></tr>
    <tr><td><b><span dir="ltr">else if</span></b></td><td>عدة شروط، يُنفَّذ أول شرط صحيح فقط</td><td><code>elif grade &gt;= 80:</code></td></tr>
  </table></div></section>`, 'orange');
};

/* ---------- loop 1: stairs ---------- */
function makeStairs(host, N) {
  const sh = Math.min(28, Math.floor(170 / N));
  host.innerHTML = `<div class="stairs" style="--n:${N + 2};--sh:${sh}px" role="img" aria-label="سلّم من ${ar(N)} درجات">${Array.from({ length: N }, (_, i) => `<div class="st" style="--i:${i + 1}"></div>`).join('')}<div class="flag" style="--i:${N}">🏁</div><div class="sbot">${bot('happy', 44)}</div></div>`;
  const B = host.querySelector('.sbot'); let k = 0;
  const place = (c, h, instant) => {
    if (instant) B.style.transition = 'none';
    B.style.setProperty('--c', c); B.style.setProperty('--hh', h);
    if (instant) { void B.offsetWidth; B.style.transition = ''; }
    k = c;
  };
  const api = {
    set(c, instant) { place(c, c, instant); swapBot(B, 'happy', 44); },
    async climb(n, onStep) {
      api.set(0, true); await wait(300);
      for (let i = 0; i < n; i++) {
        onStep && onStep(i);
        if (k === N) { place(N + 1, N + 1); await wait(350); place(N + 1, 0); swapBot(B, 'sad', 44); sfx.bad(); return 'over'; }
        place(k + 1, k + 1); sfx.step(); await wait(400);
      }
      if (k === N) { swapBot(B, 'happy', 44); return 'ok'; }
      swapBot(B, 'sad', 44); return 'short';
    }
  };
  return api;
}
const stairFail = r => r === 'short' ? 'توقّف بتّو قبل القمة. يحتاج تكرارًا أكثر!' : 'صعد بتّو في الهواء… وسقط! 😵 عدد التكرار أكبر من عدد الدرجات.';
ROUTES.l1 = () => {
  frame('الحلقات ١ · سلّم بتّو', 'w2', `
  ${talk('بتّو يريد الوصول إلى العلم 🏁 في أعلى السلّم. الأمر <b>«اصعد درجة»</b> يرفعه درجة واحدة فقط. ابنِ برنامجًا يوصله إلى القمة!', 'happy', 't')}
  <section class="panel"><div id="st"></div><div id="ctl"></div><div class="fb" id="fb" hidden></div></section><div id="after"></div>`, 'orange');
  const T = $('#t'), CT = $('#ctl'), F = $('#fb');
  let N = 6, stairs = makeStairs($('#st'), N);
  phase1();

  function phase1() {
    let n = 0, busy = false;
    CT.innerHTML = `<div class="row"><button class="btn hot" id="add">＋ اصعد درجة</button><button class="btn primary" id="run">▶ شغّل</button><button class="btn" id="clr">مسح</button></div>
      <div class="lbl" style="margin-top:12px">برنامجك: <span id="cnt"></span></div><div class="pseudo" id="ps"></div>`;
    const draw = () => { $('#cnt').textContent = `${ar(n)} سطر`; $('#ps').innerHTML = n ? Array.from({ length: n }, () => '<div class="ln">اصعد درجة</div>').join('') : '<div class="ln skip">فارغ…</div>'; };
    $('#add').onclick = () => { if (busy || n >= 20) return; n++; sfx.step(); draw(); };
    $('#clr').onclick = () => { if (busy) return; n = 0; draw(); stairs.set(0, true); F.hidden = true; };
    $('#run').onclick = async () => {
      if (busy || !n) return; busy = true; F.hidden = true;
      const lines = $$('#ps .ln');
      const r = await stairs.climb(n, i => lines.forEach((l, j) => l.classList.toggle('on', j === i)));
      if (r === 'ok') {
        sfx.ok(); fb(F, `وصل بتّو! 🎉 لكن انظر إلى برنامجك: كتبتَ «اصعد درجة» ${ar(N)} مرات!`, true);
        setTalk(T, 'تخيّل سلّمًا من <b>١٠٠ درجة</b> 😩 هل ستكتب الأمر ١٠٠ مرة؟ المبرمجون عندهم سلاح سري اسمه <b>الحلقة (<span dir="ltr">Loop</span>)</b>.', 'wow');
        CT.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn hot" id="p2">أرني السلاح السري ←</button></div>');
        $('#p2').onclick = phase2;
      } else { busy = false; fb(F, r === 'short' ? 'توقّف بتّو قبل القمة. يحتاج أوامر أكثر!' : 'صعد بتّو في الهواء… وسقط! 😵 الأوامر أكثر من الدرجات.', false); }
    };
    draw();
  }

  function flash(lines) { lines[0].classList.add('on'); later(() => { lines[0].classList.remove('on'); lines[1].classList.add('on'); }, 140); later(() => lines[1].classList.remove('on'), 360); }

  function phase2() {
    stairs.set(0, true); F.hidden = true;
    setTalk(T, 'هذه هي <b>الحلقة</b>: نكتب الأمر <b>مرة واحدة</b>، ونخبر الحاسب كم مرة يكرره. شغّلها وراقب العدّاد!', 'happy');
    CT.innerHTML = `<div class="loopviz">${pseudo([`<span class="kw">كرر</span> ${ar(N)} مرات:`, '    اصعد درجة'], 'ps')}<div class="counter"><small>الدورة</small><b id="ctr">٠</b><small>من ${ar(N)}</small></div></div>
      <div class="row"><button class="btn hot" id="run">▶ شغّل الحلقة</button></div>`;
    $('#run').onclick = async () => {
      $('#run').disabled = true; const lines = $$('#ps .ln');
      await stairs.climb(N, i => { $('#ctr').textContent = ar(i + 1); flash(lines); });
      sfx.ok();
      fb(F, `${ar(N)} أسطر صارت <b>سطرين</b> فقط! ولو كان السلّم ١٠٠ درجة؟ نغيّر رقمًا واحدًا: «كرر ١٠٠ مرة». وهكذا تُكتب بلغة بايثون:` + code('for i in range(6):\n    robot.climb()'), true);
      CT.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn hot" id="p3">إلى التحدي ←</button></div>');
      $('#p3').onclick = phase3;
    };
  }

  function phase3() {
    N = rand(7, 12); stairs = makeStairs($('#st'), N); F.hidden = true;
    let c = 1, busy = false, tries = 0;
    setTalk(T, 'سلّم جديد! <b>عُدّ الدرجات</b>، ثم اضبط عدد مرات التكرار. عدد قليل؟ لن يصل. عدد كبير؟ سيطير في الهواء!', 'happy');
    CT.innerHTML = `<div class="loopviz"><div class="pseudo" id="ps"><div class="ln"><span class="kw">كرر</span><span class="stepper"><button class="sbtn" id="mi" aria-label="أقل">−</button><b id="cv">١</b><button class="sbtn" id="pl" aria-label="أكثر">+</button></span>مرات:</div><div class="ln" style="--ind:1">اصعد درجة</div></div>
      <div class="counter"><small>الدورة</small><b id="ctr">٠</b></div></div><div class="row"><button class="btn hot" id="run">▶ شغّل</button></div>`;
    const setC = v => { if (busy) return; c = Math.max(1, Math.min(15, v)); $('#cv').textContent = ar(c); };
    $('#mi').onclick = () => setC(c - 1); $('#pl').onclick = () => setC(c + 1);
    $('#run').onclick = async () => {
      if (busy) return; busy = true; tries++; F.hidden = true; const lines = $$('#ps .ln');
      const r = await stairs.climb(c, i => { $('#ctr').textContent = ar(i + 1); flash(lines); });
      if (r === 'ok') {
        sfx.ok(); fb(F, `✓ بالضبط! السلّم ${ar(N)} درجات، والحلقة تكررت ${ar(N)} مرات.`, true);
        finish({ id: 'l1', map: 'w2', next: 'l2', stars: tries === 1 ? 3 : tries === 2 ? 2 : 1,
          memo: `<p><b>الحلقة (<span dir="ltr">Loop</span>)</b> = تكرار مجموعة أوامر عدة مرات دون أن نعيد كتابتها.</p>
            <p>عندما <mark>نعرف عدد المرات مسبقًا</mark> نستخدم حلقة <b dir="ltr">for</b>:</p>${code('for i in range(' + N + '):\n    robot.climb()')}
            <p>من حياتك: الطواف حول الكعبة <b>٧ أشواط</b>، القفز على الحبل <b>٢٠ مرة</b>، كتابة الكلمة <b>٥ مرات</b>.</p>` });
      } else { busy = false; fb(F, stairFail(r) + ' عدّل الرقم وجرّب.', false); }
    };
  }
};

/* ---------- loop 2: pattern maze (loop body) ---------- */
function loopLevel(host, L, onWin) {
  let body = [], cnt = 1, busy = false;
  host.innerHTML = `<div class="lvl"><div class="gh"></div><div>
    <div class="lbl">اضغط الأوامر لتضعها داخل الحلقة (٣ خانات)</div>
    <div class="pal">${['U', 'D', 'R', 'L'].map(k => `<button class="blk" data-add="${k}">${blkLabel(k)}</button>`).join('')}</div>
    <div class="loopblk"><div class="lhead">كرر<span class="stepper"><button class="sbtn" data-s="-1" aria-label="أقل">−</button><b class="cv">١</b><button class="sbtn" data-s="1" aria-label="أكثر">+</button></span>مرات:</div><div class="lbody"></div></div>
    <div class="iter" aria-live="polite"></div>
    <div class="row"><button class="btn hot" data-a="run">▶ شغّل</button><button class="btn" data-a="clear">مسح</button></div>
    <div class="fb" hidden></div></div>
    <div class="trans"><div><div class="lbl">بلغتنا</div><div class="pseudo ps"></div></div><div><div class="lbl">بلغة بايثون</div><div class="code cd"></div></div></div></div>`;
  const g = makeGrid(host.querySelector('.gh'), L);
  const BD = host.querySelector('.lbody'), F = host.querySelector('.fb'), IT = host.querySelector('.iter'), PS = host.querySelector('.ps'), CD = host.querySelector('.cd');
  const draw = () => {
    host.querySelector('.cv').textContent = ar(cnt);
    BD.innerHTML = body.map((k, i) => `<button class="blk" data-i="${i}">${blkLabel(k)}</button>`).join('') + Array.from({ length: 3 - body.length }, () => '<span class="slot">خانة فارغة</span>').join('');
    PS.innerHTML = `<div class="ln"><span class="kw">كرر</span> ${ar(cnt)} مرات:</div>` + (body.map(k => `<div class="ln" style="--ind:1">تحرّك إلى ${DIR[k][5]}</div>`).join('') || '<div class="ln skip" style="--ind:1">…</div>');
    CD.textContent = `for i in range(${cnt}):\n` + (body.map(k => '    ' + DIR[k][4]).join('\n') || '    ...');
  };
  host.querySelector('.pal').onclick = e => { const b = e.target.closest('[data-add]'); if (!b || busy) return; if (body.length >= 3) { fb(F, 'الحلقة ممتلئة: ٣ أوامر فقط. فكّر في النمط!', false); return; } body.push(b.dataset.add); sfx.step(); F.hidden = true; draw(); };
  BD.onclick = e => { const b = e.target.closest('[data-i]'); if (!b || busy) return; body.splice(+b.dataset.i, 1); draw(); };
  host.querySelector('.lhead').onclick = e => { const b = e.target.closest('[data-s]'); if (!b || busy) return; cnt = Math.max(1, Math.min(9, cnt + +b.dataset.s)); draw(); };
  host.querySelector('[data-a=clear]').onclick = () => { if (busy) return; body = []; cnt = 1; draw(); g.reset(); F.hidden = true; IT.textContent = ''; };
  host.querySelector('[data-a=run]').onclick = async () => {
    if (busy) return;
    if (!body.length) { fb(F, 'ضع أمرًا واحدًا على الأقل داخل الحلقة.', false); return; }
    busy = true; F.hidden = true; draw();
    const cmds = []; for (let i = 0; i < cnt; i++) cmds.push(...body);
    const blks = [...BD.querySelectorAll('.blk')];
    const res = await g.run(cmds, idx => { const it = Math.floor(idx / body.length), bi = idx % body.length; IT.textContent = `الدورة ${ar(it + 1)} من ${ar(cnt)}`; blks.forEach((b, j) => b.classList.toggle('on', j === bi)); });
    blks.forEach(b => b.classList.remove('on'));
    if (res.ok) { sfx.ok(); fb(F, `🎉 نفّذ بتّو ${ar(cmds.length)} خطوات، وأنت كتبت ${ar(body.length + 1)} أسطر فقط!`, true); onWin(); return; }
    busy = false; fb(F, gridFail(res) + ' ابحث عن النمط الذي يتكرر في الطريق.', false);
  };
  draw();
}
ROUTES.l2 = () => {
  frame('الحلقات ٢ · متاهة النمط', 'w2', `
  ${talk('الحلقة لا تكرر أمرًا واحدًا فقط! كل ما تضعه <b>داخلها</b> يتكرر معًا في كل دورة. انظر إلى الطريق نحو الطالب: هل ترى <b>درجًا</b> يتكرر؟ لديك ٣ خانات فقط داخل الحلقة.')}
  <section class="panel"><h3 id="lt"></h3><div id="L"></div></section><div id="after"></div>`, 'orange');
  const LV = [
    { w: 6, h: 6, start: [0, 5], goal: [4, 1], walls: [[2, 5], [0, 2], [4, 4], [1, 1]] },
    { w: 7, h: 5, start: [0, 4], goal: [6, 1], walls: [[3, 4], [0, 1], [1, 2], [5, 4], [6, 3]] }
  ];
  let lv = 0;
  const start = () => {
    $('#lt').textContent = `المستوى ${ar(lv + 1)} من ${ar(LV.length)}`;
    loopLevel($('#L'), LV[lv], () => {
      if (lv < LV.length - 1) {
        $('#L').insertAdjacentHTML('beforeend', '<div class="row"><button class="btn hot" id="nxl">المستوى التالي ←</button></div>');
        $('#nxl').onclick = () => { lv++; start(); };
      } else finish({ id: 'l2', map: 'w2', next: 'l3',
        memo: `<p>الأوامر <b>داخل</b> الحلقة اسمها <b>جسم الحلقة</b>. في كل دورة تُنفَّذ كلها بالترتيب، ثم تبدأ دورة جديدة.</p>${code('for i in range(3):\n    robot.move_right()\n    robot.move_right()\n    robot.move_up()')}<p>المبرمج الذكي <mark>يبحث عن النمط المتكرر</mark> ثم يضعه في حلقة.</p>` });
    });
  };
  start();
};

/* ---------- loop 3: while + infinite loop ---------- */
ROUTES.l3 = () => {
  frame('الحلقات ٣ · الكوب العجيب', 'w2', `
  ${talk('هذا كوب عجيب: <b>لا أحد يعرف كم ملعقة ماء يحتاج ليمتلئ!</b> مرة ٥ ملاعق ومرة ٨… اختر الحلقة التي تملؤه <b>دائمًا</b> دون أن ينسكب الماء. وجرّب الخيارات الأخرى لترى ماذا يحدث!', 'happy', 't')}
  <section class="panel"><div class="lab">
    <div><div class="lbl">اختر برنامجًا</div><div class="radio" id="opts"></div>
      <div class="row"><button class="btn hot" id="run" disabled>▶ شغّل</button><button class="btn stop" id="stop" hidden>⏹ أوقف البرنامج!</button></div></div>
    <div><div class="cupzone"><span class="tap">🚰</span><div class="stream" id="stream"></div><div class="cup"><div class="water" id="water"></div></div><div class="spill" id="spill"></div></div>
      <div class="lbl">ماذا يحدث داخل الحاسب؟ <span id="it"></span></div><div class="log" id="log"><div>اختر برنامجًا ثم اضغط «شغّل».</div></div></div>
  </div><div class="fb" id="fb" hidden></div></section><div id="after"></div>`, 'orange');
  const T = $('#t'), LOG = $('#log'), F = $('#fb');
  const OPTS = shuffle([
    { k: 'while', l: ['<span class="kw">كرر طالما</span> الكوب <u>غير ممتلئ</u>:', 'أضف ملعقة ماء'] },
    { k: 'for3', l: ['<span class="kw">كرر ٣ مرات</span>:', 'أضف ملعقة ماء'] },
    { k: 'full', l: ['<span class="kw">كرر طالما</span> الكوب <u>ممتلئ</u>:', 'أضف ملعقة ماء'] },
    { k: 'ever', l: ['<span class="kw">كرر للأبد</span>:', 'أضف ملعقة ماء'] }
  ]);
  $('#opts').innerHTML = OPTS.map(o => `<button class="ropt" data-k="${o.k}"><div>${o.l[0]}</div><div style="padding-inline-start:1.6em">${o.l[1]}</div></button>`).join('');
  let pick = null, busy = false, stop = false, won = false;
  $('#opts').onclick = e => { const b = e.target.closest('.ropt'); if (!b || busy) return; $$('.ropt').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pick = b.dataset.k; $('#run').disabled = false; };
  $('#stop').onclick = () => { stop = true; };
  const L = (t, c = '') => { LOG.insertAdjacentHTML('beforeend', `<div class="${c}">${t}</div>`); LOG.scrollTop = LOG.scrollHeight; };
  $('#run').onclick = async () => {
    if (busy || !pick) return; busy = true; stop = false; F.hidden = true; $('#run').disabled = true;
    const need = rand(5, 8); let lvl = 0, it = 0;
    const setW = () => { $('#water').style.height = Math.min(lvl / need, 1) * 92 + '%'; $('#spill').style.width = Math.min(Math.max(0, lvl - need) * 26, 260) + 'px'; };
    setW(); LOG.innerHTML = ''; $('#it').textContent = '';
    const pour = async () => { $('#stream').style.height = '150px'; await wait(220); lvl++; it++; setW(); $('#stream').style.height = '0'; sfx.step(); $('#it').textContent = `(الدورة ${ar(it)})`; await wait(260); };
    let ok = false, msg = '';
    if (pick === 'while') {
      while (true) {
        const full = lvl >= need;
        L(`فحص الشرط: هل الكوب غير ممتلئ؟ ${full ? 'لا ✗' : 'نعم ✓'}`, full ? 'n' : 'y'); await wait(280);
        if (full) { L('الشرط أصبح خطأ ← توقفت الحلقة وحدها', 'y'); break; }
        await pour();
      }
      ok = true; msg = `✓ امتلأ الكوب بعد ${ar(need)} ملاعق بالضبط! حلقة «طالما» تفحص الشرط قبل كل دورة، وتتوقف وحدها عندما يصبح خطأ. شغّلها مرة أخرى: سيتغير عدد الملاعق، وستنجح دائمًا.`;
    } else if (pick === 'for3') {
      for (let i = 0; i < 3; i++) { L(`الدورة ${ar(i + 1)} من ٣ ← أضف ملعقة`); await pour(); }
      L('انتهت الدورات الثلاث.', 'n');
      msg = `✗ انتهت الدورات الثلاث، لكن الكوب كان يحتاج ${ar(need)} ملاعق! «كرر ٣ مرات» تصلح عندما <b>نعرف</b> العدد مسبقًا، وهنا لا نعرفه.`;
    } else if (pick === 'full') {
      L('فحص الشرط: هل الكوب ممتلئ؟ لا ✗', 'n'); await wait(500);
      L('الشرط خطأ من البداية ← لن ندخل الحلقة أبدًا!', 'n');
      msg = '✗ لم تتكرر الحلقة ولا مرة واحدة! الكوب فارغ، فالشرط «ممتلئ» خطأ من أول فحص، وتخطّى الحاسب الحلقة كلها.';
    } else {
      $('#stop').hidden = false;
      while (!stop && it < 30) {
        L(`الدورة ${ar(it + 1)}: أضف ملعقة… (لا يوجد شرط توقف!)`, lvl >= need ? 'n' : '');
        await pour();
        if (lvl === need + 1) { setTalk(T, 'النجدة! الماء ينسكب! 💦 اضغط «أوقف البرنامج»!', 'wow'); sfx.bad(); }
      }
      $('#stop').hidden = true;
      L(stop ? 'أوقفتَ البرنامج بالقوة ⏹' : 'أوقفناه نحن بعد ٣٠ دورة ⏹', 'n');
      setTalk(T, 'هذا الكوب العجيب يحتاج حلقة ذكية تعرف متى تتوقف. جرّب كل الخيارات!', 'happy');
      msg = '✗ هذه <b>حلقة لا نهائية</b> (<span dir="ltr">Infinite Loop</span>) 😱 لا يوجد شرط يوقفها، فتستمر حتى يتجمّد البرنامج أو نوقفه بالقوة. إنها من أشهر أخطاء المبرمجين!';
    }
    document.querySelector(`.ropt[data-k="${pick}"]`).dataset.r = ok ? 'ok' : 'bad';
    ok ? sfx.ok() : sfx.bad();
    fb(F, msg, ok); busy = false; $('#run').disabled = false;
    if (ok && !won) {
      won = true;
      finish({ id: 'l3', map: 'w2', next: 'c1', nextLabel: 'إلى الشروط',
        memo: `<div class="tablewrap"><table class="dict"><tr><th></th><th><span dir="ltr">for</span> · كرر عددًا</th><th><span dir="ltr">while</span> · كرر طالما</th></tr>
          <tr><td><b>متى؟</b></td><td>نعرف عدد المرات</td><td>لا نعرف العدد، لكن نعرف متى نتوقف</td></tr>
          <tr><td><b>مثال</b></td><td>الطواف ٧ أشواط</td><td>اشرب الماء طالما أنت عطشان</td></tr>
          <tr><td><b>بايثون</b></td><td><code>for i in range(7):</code></td><td><code>while not cup.full():</code></td></tr></table></div>
          <p style="margin-top:10px">⚠️ احذر <b>الحلقة اللانهائية</b>: كل حلقة «طالما» تحتاج شرطًا <mark>سيصبح خطأ يومًا ما</mark>.</p>` });
    }
  };
};
