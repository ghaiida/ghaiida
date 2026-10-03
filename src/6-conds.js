
/* ---------- if 1: umbrella ---------- */
ROUTES.c1 = () => {
  frame('الشروط ١ · مظلة بتّو', 'w2', `
  ${talk('الجملة الشرطية تجعل البرنامج <b>يقرّر</b>. تبدأ بـ <b>«إذا»</b> ثم سؤال جوابه <b>صح أو خطأ</b>. إذا كان صح ← ينفّذ الأمر، وإذا كان خطأ ← يتخطّاه. جرّب الطقسين!', 'happy', 't')}
  <section class="panel"><div class="lab2">
    <div><div class="lbl">١. اختر الطقس</div><div class="row" style="margin-top:0"><button class="btn sel" data-w="sun">☀️ مشمس</button><button class="btn" data-w="rain">🌧️ ممطر</button></div>
      <div class="lbl" style="margin-top:14px">٢. البرنامج</div>
      ${pseudo(['<span class="kw">إذا</span> كان الجو ممطرًا:', '    خذ المظلة ☂️', 'اذهب إلى المدرسة 🏫'], 'ps')}
      <div class="row"><button class="btn hot" id="run">▶ نفّذ البرنامج</button></div></div>
    <div><div class="scene" id="sc"><div class="fx"></div><span class="sun">☀️</span><div class="ground"></div><span class="school">🏫</span><div class="walker" id="wk"><span class="umb" hidden>☂️</span>${bot('happy', 60)}</div></div>
      <div class="cond" id="cond">الشرط: <b>لم يُفحص بعد</b></div></div>
  </div><div class="fb" id="fb" hidden></div></section>
  <section class="panel" id="Q" hidden><h3>دورك: توقّع ماذا سيفعل البرنامج</h3><div id="qz"></div></section><div id="after"></div>`, 'orange');
  let weather = 'sun', busy = false; const tried = new Set();
  const W = $('#wk'), lines = $$('#ps .ln');
  $$('[data-w]').forEach(b => b.onclick = () => {
    if (busy) return; weather = b.dataset.w;
    $$('[data-w]').forEach(x => x.classList.toggle('sel', x === b));
    $('#sc').classList.toggle('rain', weather === 'rain');
    W.classList.remove('go'); W.querySelector('.umb').hidden = true; lines.forEach(l => l.classList.remove('on', 'skip'));
    $('#cond').innerHTML = 'الشرط: <b>لم يُفحص بعد</b>';
  });
  $('#run').onclick = async () => {
    if (busy) return; busy = true; $('#fb').hidden = true;
    W.style.transition = 'none'; W.classList.remove('go'); void W.offsetWidth; W.style.transition = '';
    W.querySelector('.umb').hidden = true; lines.forEach(l => l.classList.remove('on', 'skip'));
    const rain = weather === 'rain';
    lines[0].classList.add('on'); await wait(700);
    $('#cond').innerHTML = `الشرط: هل الجو ممطر؟ ← <b style="color:var(--${rain ? 'green' : 'red'})">${rain ? 'صح ✓' : 'خطأ ✗'}</b>`;
    await wait(700); lines[0].classList.remove('on');
    if (rain) { lines[1].classList.add('on'); W.querySelector('.umb').hidden = false; sfx.ok(); await wait(800); lines[1].classList.remove('on'); }
    else { lines[1].classList.add('skip'); await wait(500); }
    lines[2].classList.add('on'); W.classList.add('go'); await wait(1700);
    fb($('#fb'), rain ? 'الشرط <b>صح</b>، فنفّذ بتّو «خذ المظلة» ثم ذهب للمدرسة ☂️'
      : 'الشرط <b>خطأ</b>، فتخطّى بتّو سطر المظلة وذهب مباشرة للمدرسة. لاحظ: «اذهب إلى المدرسة» نُفِّذ في الحالتين لأنه <b>خارج</b> الشرط.', true);
    tried.add(weather); busy = false;
    if (tried.size === 1) setTalk($('#t'), 'ممتاز! الآن غيّر الطقس وشغّل البرنامج مرة أخرى. ماذا سيتغيّر؟', 'happy');
    if (tried.size === 2 && $('#Q').hidden) {
      setTalk($('#t'), 'رأيت الحالتين! الآن أنت الحاسب: اقرأ كل شرط وتوقّع النتيجة.', 'happy');
      $('#Q').hidden = false; startQuiz(); later(() => $('#Q').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }), 300);
    }
  };
  function startQuiz() {
    const yn = (yes, rYes, rNo) => [{ t: 'نعم', ok: yes, r: rYes }, { t: 'لا', ok: !yes, r: rNo }];
    const QS = [
      { fixed: true, pre: pseudo(['<span class="kw">إذا</span> درجة الحرارة &gt; ٤٠:', '    ابقَ في الداخل']), q: 'درجة الحرارة اليوم <b>٣٨</b>. هل سيبقى بتّو في الداخل؟',
        opts: yn(false, 'انتبه: هل ٣٨ أكبر من ٤٠؟', '٣٨ &gt; ٤٠ خطأ، فلن يُنفَّذ الأمر.') },
      { fixed: true, pre: pseudo(['<span class="kw">إذا</span> الدرجة &gt;= ٥٠:', '    اطبع «ناجح»']), q: 'درجة الطالب <b>٥٠</b>. هل سيطبع البرنامج «ناجح»؟',
        opts: yn(true, '٥٠ ≥ ٥٠ صح! العلامة &gt;= تعني «أكبر من أو يساوي».', 'انتبه للعلامة &gt;= … إنها تشمل «يساوي».') },
      { fixed: true, pre: pseudo(['<span class="kw">إذا</span> كان اليوم الجمعة <span class="kw">و</span> الجو جميل:', '    اذهب في نزهة']), q: 'اليوم <b>الجمعة</b>، لكن الجو <b>ممطر</b>. هل سيذهب بتّو في نزهة؟',
        opts: yn(false, '«و» تحتاج أن يكون الشرطان صحيحين معًا.', '«و» تحتاج الشرطين معًا. الجو ممطر ← الشرط كله خطأ.') },
      { fixed: true, pre: pseudo(['<span class="kw">إذا</span> كانت معك تذكرة <span class="kw">أو</span> كنت طالبًا:', '    ادخل المتحف']), q: 'ليست معك تذكرة، لكنك <b>طالب</b>. هل ستدخل المتحف؟',
        opts: yn(true, '«أو» يكفيها شرط واحد صحيح.', '«أو» يكفيها شرط واحد صحيح، وأنت طالب!') }
    ];
    quiz($('#qz'), QS, wrong => finish({ id: 'c1', map: 'w2', next: 'c2', stars: wrong === 0 ? 3 : wrong <= 2 ? 2 : 1,
      memo: `<p><b>إذا (<span dir="ltr">if</span>)</b> = بوابة لا تُفتح إلا عندما يكون الشرط <mark>صحيحًا</mark>. وإذا كان خطأ، يتخطّاها البرنامج ويكمل.</p>
        <div class="ops"><span><b>&gt;</b>أكبر من</span><span><b>&lt;</b>أصغر من</span><span><b>==</b>يساوي</span><span><b>!=</b>لا يساوي</span><span><b>&gt;=</b>أكبر أو يساوي</span><span><b>&lt;=</b>أصغر أو يساوي</span><span><b>و</b>الشرطان معًا</span><span><b>أو</b>يكفي واحد</span></div>
        ${code('if weather == "rain":\n    take_umbrella()\ngo_to_school()')}` }));
  }
};

/* ---------- if 2: if/else sorting machine ---------- */
ROUTES.c2 = () => {
  frame('الشروط ٢ · آلة الفرز', 'w2', `
  ${talk('أحيانًا نريد أن نفعل شيئًا إذا تحقق الشرط، و<b>شيئًا آخر</b> إذا لم يتحقق. هذه هي <b>«إذا… وإلا»</b> (<span dir="ltr">if … else</span>). كل عنصر يذهب في طريق واحد فقط، لا الاثنين معًا! أنت الآن المعالج: افرز بسرعة قبل أن ينتهي الوقت.')}
  <section class="panel" id="P"></section><div id="after"></div>`, 'orange');
  const RULES = [
    { cond: 'العدد زوجي', yes: 'الصندوق الأزرق 🟦', no: 'الصندوق الأحمر 🟥',
      make() { return shuffle([rand(1, 49) * 2, rand(1, 49) * 2, rand(0, 49) * 2 + 1, rand(0, 49) * 2 + 1]).map(n => ({ show: ar(n), ans: n % 2 === 0, why: n % 2 === 0 ? `${ar(n)} يقبل القسمة على ٢ ← زوجي` : `${ar(n)} ÷ ٢ يبقى ١ ← فردي` })); } },
    { cond: 'العمر ≥ ١٢', yes: 'تذكرة كبار 🎟️', no: 'تذكرة أطفال 🎈',
      make() { return shuffle([12, rand(13, 40), rand(4, 11), rand(4, 11)]).map(n => ({ show: ar(n), small: 'سنة', ans: n >= 12, why: n === 12 ? '١٢ ≥ ١٢ صح! العلامة ≥ تشمل المساواة.' : n > 12 ? `${ar(n)} أكبر من ١٢` : `${ar(n)} أصغر من ١٢` })); } },
    { cond: 'الحيوان يطير', yes: 'قفص الطيور 🪺', no: 'الحديقة 🌳',
      make() {
        const all = [['🦅', 'نسر', 1], ['🐘', 'فيل', 0], ['🦋', 'فراشة', 1], ['🐪', 'جمل', 0], ['🐝', 'نحلة', 1], ['🐢', 'سلحفاة', 0], ['🦉', 'بومة', 1], ['🐄', 'بقرة', 0]];
        const pick = shuffle(all).slice(0, 3).map(([e, n, f]) => ({ show: e, small: n, ans: !!f, why: `${n} ${f ? 'يطير' : 'لا يطير'}` }));
        pick.push({ show: '🐧', small: 'بطريق', ans: false, why: 'خدعة! البطريق طائر لكنه <b>لا يطير</b>. الحاسب يفحص الشرط بدقة: «يطير؟» لا.' });
        return shuffle(pick);
      } }
  ];
  const items = []; RULES.forEach(r => items.push(...r.make().map(x => ({ ...x, r }))));
  const P = $('#P'), MS = 6000;
  let k = 0, score = 0, tid = null, acc = false;
  P.innerHTML = `<div class="sorthead"><span class="pill" id="rn">القاعدة ١ من ٣</span><span>النقاط: <b id="sc">٠</b> من ${ar(items.length)}</span></div>
    <div id="code"></div>
    <div class="machine"><div class="item" id="it">؟</div><div class="itn" id="itn"></div><div class="tbar"><i id="tb"></i></div>
      <div class="branches"><button class="branch yes" id="by" disabled>✓ صح<small id="byl"></small></button><button class="branch no" id="bn" disabled>✗ خطأ ← وإلا<small id="bnl"></small></button></div>
      <button class="btn hot" id="go">ابدأ الفرز ▶</button></div>
    <div class="fb" id="fb" hidden></div>`;
  const showRule = r => { $('#code').innerHTML = pseudo([`<span class="kw">إذا</span> ${r.cond}:`, `    ضعه في ${r.yes}`, '<span class="kw">وإلا</span>:', `    ضعه في ${r.no}`], 'ps'); $('#byl').textContent = r.yes; $('#bnl').textContent = r.no; };
  showRule(RULES[0]);
  const TB = $('#tb');
  const enable = on => { $('#by').disabled = !on; $('#bn').disabled = !on; };
  $('#go').onclick = () => { $('#go').hidden = true; next(); };
  function next() {
    if (k === items.length) return end();
    const it = items[k];
    if (k % 4 === 0) { showRule(it.r); $('#rn').textContent = `القاعدة ${ar(k / 4 + 1)} من ٣`; }
    const lines = $$('#ps .ln'); lines.forEach(l => l.classList.remove('on', 'skip')); lines[0].classList.add('on');
    const I = $('#it'); I.textContent = it.show; I.classList.remove('pop'); void I.offsetWidth; I.classList.add('pop');
    $('#itn').textContent = it.small || '';
    TB.style.transition = 'none'; TB.style.width = '100%'; void TB.offsetWidth; TB.style.transition = `width ${MS}ms linear`; TB.style.width = '0%';
    tid = later(() => answer(null), MS); acc = true; enable(true);
  }
  function answer(v) {
    if (!acc) return; acc = false; clearTimeout(tid); enable(false);
    TB.style.width = getComputedStyle(TB).width; TB.style.transition = 'none';
    const it = items[k], ok = v === it.ans, lines = $$('#ps .ln');
    lines[0].classList.remove('on');
    (it.ans ? [lines[1]] : [lines[2], lines[3]]).forEach(l => l.classList.add('on'));
    (it.ans ? [lines[2], lines[3]] : [lines[1]]).forEach(l => l.classList.add('skip'));
    if (ok) { score++; sfx.ok(); } else sfx.bad();
    $('#sc').textContent = ar(score);
    fb($('#fb'), (v === null ? '⏰ انتهى الوقت! ' : ok ? '✓ ' : '✗ ') + it.why + ` ← الشرط <b>${it.ans ? 'صح' : 'خطأ'}</b> ← ${it.ans ? it.r.yes : it.r.no}`, ok);
    k++; later(next, ok ? 1400 : 2600);
  }
  $('#by').onclick = () => answer(true); $('#bn').onclick = () => answer(false);
  function end() {
    $('#it').textContent = '🏁'; $('#itn').textContent = `${ar(score)} من ${ar(items.length)}`;
    P.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn" id="again">العب مرة أخرى</button></div>');
    $('#again').onclick = () => go('c2');
    finish({ id: 'c2', map: 'w2', next: 'c3', stars: score >= 11 ? 3 : score >= 8 ? 2 : 1,
      memo: `<p><b>إذا… وإلا</b> = مفترق طرق: <mark>طريق واحد فقط</mark> يُنفَّذ دائمًا. لا الاثنان معًا، ولا لا شيء.</p>${code('if number % 2 == 0:\n    print("الصندوق الأزرق")\nelse:\n    print("الصندوق الأحمر")')}<p>والحاسب لا ينخدع بالمظاهر: البطريق طائر، لكن جواب «يطير؟» هو <b>لا</b> 🐧</p>` });
  }
};

/* ---------- if 3: else-if chain ---------- */
ROUTES.c3 = () => {
  frame('الشروط ٣ · مُصنِّف الدرجات', 'w2', `
  ${talk('عندما تكون الاحتمالات <b>أكثر من اثنين</b> نستخدم <b>«وإلا إذا»</b> (<span dir="ltr">else if</span>). الحاسب يفحص الشروط <b>من الأعلى إلى الأسفل</b>، و<mark>يتوقف عند أول شرط صحيح</mark> ويتجاهل الباقي. أنت المعالج: ماذا سيطبع البرنامج؟')}
  <section class="panel" id="P"></section><div id="after"></div>`, 'orange');
  const GOOD = [[90, 'ممتاز'], [80, 'جيد جدًا'], [65, 'جيد'], [null, 'يحتاج إلى تحسين']];
  const BUG = [[65, 'جيد'], [80, 'جيد جدًا'], [90, 'ممتاز'], [null, 'يحتاج إلى تحسين']];
  const ROUNDS = [{ g: 95, c: GOOD }, { g: 72, c: GOOD }, { g: 83, c: GOOD }, { g: 40, c: GOOD }, { g: 90, c: GOOD }, { g: 95, c: BUG, bug: true }];
  const P = $('#P'); let r = 0, score = 0;
  function show() {
    const R = ROUNDS[r]; let busy = false;
    P.innerHTML = `<div class="sorthead"><span class="pill">${R.bug ? 'جولة المحقق 🕵️' : `الطالب ${ar(r + 1)} من ${ar(ROUNDS.length - 1)}`}</span><span>إجابات صحيحة: <b>${ar(score)}</b></span></div>
      ${R.bug ? '<p class="task">زميلك غيّر <b>ترتيب</b> الشروط! انتبه جيدًا…</p>' : ''}
      <div class="grade"><small>درجة الطالب</small>${ar(R.g)}</div>
      <div class="chain">${R.c.map(([v, o], i) => `<div class="crow"><span class="cc">${v === null ? '<span class="kw2">وإلا</span>' : `<span class="kw2">${i === 0 ? 'إذا' : 'وإلا إذا'}</span> الدرجة ≥ ${ar(v)}`}</span><span class="co">اطبع «${o}»</span><span class="cs"></span></div>`).join('')}</div>
      <p class="q">ماذا سيطبع البرنامج؟</p>
      <div class="answers">${shuffle(GOOD.map(x => x[1])).map(o => `<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>
      <div class="fb" id="fb" hidden></div><div class="row" id="nx" hidden><button class="btn hot">${r < ROUNDS.length - 1 ? 'التالي ←' : 'إنهاء ←'}</button></div>`;
    P.querySelector('.answers').onclick = async e => {
      const b = e.target.closest('.opt'); if (!b || busy) return; busy = true;
      P.querySelectorAll('.answers .opt').forEach(x => x.disabled = true);
      const pick = b.dataset.o, rows = P.querySelectorAll('.crow'); let out = null;
      for (let i = 0; i < R.c.length; i++) {
        const [v, o] = R.c[i]; rows[i].classList.add('chk'); await wait(650); rows[i].classList.remove('chk');
        const t = v === null || R.g >= v;
        rows[i].querySelector('.cs').textContent = v === null ? 'نُفِّذ' : t ? 'صح ✓' : 'خطأ ✗';
        rows[i].classList.add(t ? 't' : 'f'); sfx.step();
        if (t) { out = o; for (let j = i + 1; j < rows.length; j++) { rows[j].classList.add('skip'); rows[j].querySelector('.cs').textContent = 'لم يُفحص'; } break; }
      }
      const ok = pick === out;
      if (ok) { score++; sfx.ok(); b.classList.add('ok'); } else { sfx.bad(); b.classList.add('bad'); }
      let msg = ok ? `✓ صحيح! طبع البرنامج «${out}».` : `✗ البرنامج طبع «${out}».`;
      if (R.g === 95 && !R.bug) msg += ' لاحظ: ٩٥ ≥ ٦٥ صح أيضًا، لكن الحاسب توقف عند <b>أول</b> شرط صحيح ولم يكمل.';
      if (R.g === 90) msg += ' ٩٠ ≥ ٩٠ صح، لأن العلامة ≥ تعني «أكبر من أو يساوي».';
      if (R.g === 40) msg += ' لم يتحقق أي شرط، فنُفِّذ جزء «وإلا» الأخير.';
      if (R.bug) msg += ' 🐛 هذا <b>خطأ منطقي</b>! طالب درجته ٩٥ حصل على «جيد» لأن الشرط ≥ ٦٥ جاء أولًا وكان صحيحًا. <b>ترتيب الشروط مهم</b>: نبدأ بالأعلى ثم الأقل.';
      fb($('#fb'), msg, ok); $('#nx').hidden = false;
    };
    $('#nx button').onclick = () => {
      r++;
      if (r < ROUNDS.length) show();
      else finish({ id: 'c3', map: 'w2', next: 'boss', nextLabel: 'التحدي النهائي', stars: score >= 6 ? 3 : score >= 4 ? 2 : 1,
        memo: `<p><b>وإلا إذا (<span dir="ltr">else if</span>)</b> = سلسلة شروط تُفحص <mark>من الأعلى إلى الأسفل</mark>. أول شرط صحيح يُنفَّذ، والباقي يُتجاهل. وإن لم يصح أي شرط يُنفَّذ «وإلا».</p>
          ${code('if grade >= 90:\n    print("ممتاز")\nelif grade >= 80:\n    print("جيد جدًا")\nelif grade >= 65:\n    print("جيد")\nelse:\n    print("يحتاج إلى تحسين")')}<p>⚠️ الترتيب الخاطئ يصنع <b>خطأً منطقيًا</b>: البرنامج يعمل… لكنه يعطي نتيجة خاطئة.</p>` });
    };
  }
  show();
};
