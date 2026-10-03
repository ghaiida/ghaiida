
/* ---------- boss: fizz (loop + if) ---------- */
ROUTES.boss = () => {
  frame('التحدي النهائي · بِز', 'w2', `
  ${talk('الآن تجمع القوّتين: <b>حلقة</b> تعدّ من ١ إلى ١٥، وداخلها <b>شرط</b>. أنت الحاسب! لكل عدد: إذا كان يقبل القسمة على ٣ اضغط <b>«بِز!»</b>، وإلا اضغط <b>«قل العدد»</b>. أسرع قبل أن ينتهي الوقت!', 'wow', 't')}
  <section class="panel" id="P"></section><div id="after"></div>`, 'orange');
  const MODES = {
    1: { ms: 3500, title: 'الجولة ١: بِز',
      lines: ['<span class="kw">كرر</span> لكل عدد من ١ إلى ١٥:', '    <span class="kw">إذا</span> العدد يقبل القسمة على ٣:', '        قل «بِز»', '    <span class="kw">وإلا</span>:', '        قل العدد'],
      btns: [['num', 'قل العدد'], ['fizz', 'بِز!']],
      ans: n => n % 3 === 0 ? 'fizz' : 'num',
      path: { fizz: [1, 2], num: [1, 3, 4] },
      why: (n, a) => a === 'fizz' ? `${ar(n)} ÷ ٣ = ${ar(n / 3)} بلا باقٍ ← «بِز»` : `${ar(n)} لا يقبل القسمة على ٣ ← «${ar(n)}»` },
    2: { ms: 5000, title: 'جولة الأبطال: بِزطَن',
      lines: ['<span class="kw">كرر</span> لكل عدد من ١ إلى ١٥:', '    <span class="kw">إذا</span> يقبل القسمة على ٣ <span class="kw">و</span> على ٥:', '        قل «بِزطَن»', '    <span class="kw">وإلا إذا</span> يقبل القسمة على ٣:', '        قل «بِز»', '    <span class="kw">وإلا إذا</span> يقبل القسمة على ٥:', '        قل «طَن»', '    <span class="kw">وإلا</span>:', '        قل العدد'],
      btns: [['num', 'العدد'], ['fizz', 'بِز'], ['buzz', 'طَن'], ['fb', 'بِزطَن']],
      ans: n => n % 15 === 0 ? 'fb' : n % 3 === 0 ? 'fizz' : n % 5 === 0 ? 'buzz' : 'num',
      path: { fb: [1, 2], fizz: [1, 3, 4], buzz: [1, 3, 5, 6], num: [1, 3, 5, 7, 8] },
      why: (n, a) => ({ fb: `${ar(n)} يقبل القسمة على ٣ و ٥ معًا ← «بِزطَن»`, fizz: `${ar(n)} يقبل القسمة على ٣ فقط ← «بِز»`, buzz: `${ar(n)} يقبل القسمة على ٥ فقط ← «طَن»`, num: `${ar(n)} لا يقبل القسمة على ٣ ولا ٥ ← «${ar(n)}»` })[a] }
  };
  const P = $('#P');
  play(1);

  function play(m) {
    const M = MODES[m]; let n = 0, score = 0, tid = null, acc = false;
    if (m === 2) setTalk($('#t'), 'جولة الأبطال! الآن ٤ أزرار. لاحظ أن شرط <b>«٣ و ٥ معًا»</b> جاء <b>أولًا</b>… تذكّر لماذا من مصنّف الدرجات!', 'wow');
    P.innerHTML = `<div class="sorthead"><span class="pill">${M.title}</span><span>النقاط: <b id="sc">٠</b> من ١٥</span></div>
      <div class="bosswrap"><div>${pseudo(M.lines, 'ps')}</div>
      <div class="machine" style="margin-top:0"><div class="dots" id="dots">${'<i></i>'.repeat(15)}</div><div class="lbl" style="margin:0">العدد في هذه الدورة</div><div class="bigno" id="no">—</div><div class="tbar"><i id="tb"></i></div>
        <div class="answers">${M.btns.map(([k, t]) => `<button class="branch ${k}" data-k="${k}" disabled>${t}</button>`).join('')}</div>
        <button class="btn hot" id="go">ابدأ ▶</button></div></div><div class="fb" id="fb" hidden></div>`;
    const TB = $('#tb'), dots = $$('#dots i'), btns = $$('.answers .branch');
    const enable = on => btns.forEach(b => b.disabled = !on);
    $('#go').onclick = () => { $('#go').hidden = true; next(); };
    btns.forEach(b => b.onclick = () => answer(b.dataset.k));
    function next() {
      n++; if (n > 15) return end();
      dots[n - 1].classList.add('cur'); $('#no').textContent = ar(n);
      const lines = $$('#ps .ln'); lines.forEach(l => l.classList.remove('on', 'skip')); lines[0].classList.add('on');
      TB.style.transition = 'none'; TB.style.width = '100%'; void TB.offsetWidth; TB.style.transition = `width ${M.ms}ms linear`; TB.style.width = '0%';
      tid = later(() => answer(null), M.ms); acc = true; enable(true);
    }
    function answer(k) {
      if (!acc) return; acc = false; clearTimeout(tid); enable(false);
      TB.style.width = getComputedStyle(TB).width; TB.style.transition = 'none';
      const a = M.ans(n), ok = k === a;
      const lines = $$('#ps .ln'); M.path[a].forEach(i => lines[i].classList.add('on'));
      dots[n - 1].classList.remove('cur'); dots[n - 1].classList.add(ok ? 'ok' : 'bad');
      if (ok) { score++; sfx.ok(); } else sfx.bad();
      $('#sc').textContent = ar(score);
      fb($('#fb'), (k === null ? '⏰ انتهى الوقت! ' : ok ? '✓ ' : '✗ ') + M.why(n, a), ok);
      later(next, ok ? 800 : 1900);
    }
    function end() {
      $('#no').textContent = '🏁';
      if (m === 1) {
        if (score >= 10) {
          finish({ id: 'boss', map: 'w2', next: 'cert', nextLabel: 'شهادتي 🏅', stars: score === 15 ? 3 : score >= 12 ? 2 : 1,
            extra: '<button class="btn hot" id="r2">جولة الأبطال ⚡</button>',
            memo: `<p><b>الحلقة تكرّر، والشرط يقرّر.</b> <mark>ومعًا يصنعان كل البرامج تقريبًا!</mark> الألعاب مثلًا تكرر رسم الشاشة ٦٠ مرة في الثانية، وفي كل مرة تسأل: إذا لمس اللاعب العدو ← انتهت اللعبة.</p>${code('for n in range(1, 16):\n    if n % 3 == 0:\n        print("بِز")\n    else:\n        print(n)')}` });
          $('#r2').onclick = () => { $('#after').innerHTML = ''; play(2); window.scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' }); };
        } else {
          fb($('#fb'), `حصلت على ${ar(score)} من ١٥. تحتاج ١٠ على الأقل لتهزم التحدي. ركّز: هل العدد في جدول الضرب للرقم ٣؟`, false);
          P.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn hot" id="again">حاول مرة أخرى ↻</button></div>');
          $('#again').onclick = () => play(1);
        }
      } else {
        if (score >= 12) { S.done.boss2 = true; save(); sfx.win(); confetti(); }
        fb($('#fb'), score >= 12 ? `🏆 بطل حقيقي! ${ar(score)} من ١٥ في جولة الأبطال. هذه اللعبة اسمها عالميًا <span dir="ltr">FizzBuzz</span>، ويُسأل عنها المبرمجون في مقابلات العمل!` : `حصلت على ${ar(score)} من ١٥. جولة الأبطال صعبة فعلًا! حاول مرة أخرى.`, score >= 12);
        P.insertAdjacentHTML('beforeend', '<div class="row"><button class="btn hot" id="again">العب جولة الأبطال مرة أخرى ↻</button><button class="btn" data-go="cert">شهادتي 🏅</button></div>');
        $('#again').onclick = () => play(2);
      }
    }
  }
};

/* ---------- certificate ---------- */
ROUTES.cert = () => {
  const ALL = [...W1IDS, ...W2IDS], n = ALL.filter(k => S.done[k]).length;
  const BADGES = [['مهندس الخوارزميات', W1IDS], ['سيّد الحلقات', ['l1', 'l2', 'l3']], ['حارس الشروط', ['c1', 'c2', 'c3']], ['قاهر بِز', ['boss']], ['بطل بِزطَن', ['boss2']]];
  let date = ''; try { date = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) {}
  frame('شهادتي', 'home', `
  <section class="panel"><label class="lbl" for="nm">اكتب اسمك ليظهر في الشهادة</label><input id="nm" class="inp" maxlength="40" value="${esc(S.name)}" placeholder="اسمك هنا" autocomplete="name"></section>
  <div class="cert"><div>${bot('happy', 70)}</div><p class="cert-k">شهادة مبرمج صغير</p><h1 class="cert-name" id="cn">${esc(S.name) || '…'}</h1>
    <p>أتمّ <b>${ar(n)}</b> من <b>${ar(ALL.length)}</b> مهمة في مغامرات بتّو البرمجية</p>
    <div class="badges">${BADGES.map(([t, ids]) => { const ok = ids.every(k => S.done[k]); return `<div class="badge${ok ? ' on' : ''}"><span>${ok ? '🏅' : '🔒'}</span>${t}</div>`; }).join('')}</div>
    <p class="cert-sign">توقيع: بتّو${date ? ' · ' + date : ''}</p></div>
  <div class="row"><button class="btn primary" data-go="home">الرئيسية</button><button class="btn" id="reset">ابدأ من جديد</button></div>`);
  $('#nm').oninput = e => { S.name = e.target.value; save(); $('#cn').textContent = S.name || '…'; };
  let armed = false;
  $('#reset').onclick = () => {
    if (!armed) { armed = true; $('#reset').textContent = 'متأكد؟ سيُمسح كل تقدّمك. اضغط مرة أخرى'; $('#reset').classList.add('stop'); return; }
    S.done = {}; S.stars = {}; save(); go('cert');
  };
};

go(location.hash.slice(1) || 'home');
