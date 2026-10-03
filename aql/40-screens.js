
/* ---------- intro: the broken system ---------- */
ROUTES.intro = async () => {
  app.innerHTML = `<div class="intro">
    <div class="logo"><span class="pre">مهمة:</span><span class="mark">عقل المبرمج</span></div>
    <div class="core off" id="core"><div class="ring"></div><div class="ring r2"></div><div class="dot"></div></div>
    <div class="terminal" aria-live="polite"><div class="bar"><i></i><i></i><i></i></div><div id="tl"></div></div>
    <div id="story" hidden style="max-width:560px">
      <p style="font-size:1.15rem;font-weight:700">هناك نظام رقمي ذكي تعطّل، وأنت الآن المبرمج الذي سيعيد تشغيله.</p>
      <p class="muted">لن تستطيع إصلاح النظام إلا إذا تعلّمت كيف يفكّر المبرمج.</p>
      <label class="lbl" for="nm" style="margin-top:14px">ما اسمك أيها المبرمج؟</label>
      <input class="field" id="nm" maxlength="24" value="${esc(S.name)}" placeholder="اكتب اسمك" style="max-width:320px;text-align:center;font-size:1.1rem" autocomplete="given-name">
      <div class="row c"><button class="btn lg royal" id="start">ابدأ المغامرة ←</button></div>
    </div></div>`;
  const L = [['> تشغيل النظام «النواة»…', ''], ['⚠ خطأ: وحدة التفكير المنطقي متوقفة', 'err'], ['⚠ خطأ: ملفات الخوارزميات مفقودة', 'err'], ['⚠ خطأ: القرارات لا تعمل', 'err'], ['> البحث عن مبرمج قادر على الإصلاح…', ''], ['✓ تم العثور على مبرمج: أنت', 'ok']];
  const T = $('#tl');
  for (const [t, c] of L) {
    const s = document.createElement('span'); s.className = 'ln cur ' + c; T.appendChild(s);
    for (let i = 1; i <= t.length; i++) { s.textContent = t.slice(0, i); if (i % 3 === 0) await wait(REDUCE ? 0 : 14); }
    s.classList.remove('cur'); if (c === 'err') sfx.oops(); await wait(REDUCE ? 50 : 260);
  }
  $('#story').hidden = false; $('#nm').focus();
  $('#start').onclick = () => { S.name = ($('#nm').value || '').trim(); S.intro = true; touchStreak(); save(); sfx.win(); go('home'); };
  $('#nm').onkeydown = e => { if (e.key === 'Enter') $('#start').click(); };
};

/* ---------- home ---------- */
function gateStats(g) { const l = gateMissions(g); const d = l.filter(m => M(m.id).done).length; return { d, n: l.length, pct: Math.round(d / l.length * 100) }; }
ROUTES.home = () => {
  if (!S.intro) return go('intro');
  const L = levelInfo(), g1 = gateStats('build'), g2 = gateStats('think');
  const all = CONTENT.missions.length, done = CONTENT.missions.filter(m => M(m.id).done).length, sys = Math.round(done / all * 100);
  const fin = missionById('final'), finOpen = isUnlocked(fin), finDone = M('final').done;
  const dailyDone = S.daily.date === today() && S.daily.done;
  app.innerHTML = hud('مهمة: عقل المبرمج') + `
    <section class="home-head"><div class="rb idle">${robot(sys >= 100 ? 'happy' : 'wow', 92)}</div>
      <div><span class="eyebrow">النظام مستعاد بنسبة ${ar(sys)}٪</span><h1>${S.name ? `أهلًا يا ${esc(S.name)}، ` : ''}اختر مهمتك</h1>
      <p class="muted" style="margin:0">${sys >= 100 ? 'أعدت تشغيل النظام بالكامل. أنت تفكّر الآن مثل المبرمج 🧠' : 'كل مهمة تنجزها تعيد جزءًا من النظام إلى الحياة.'}</p></div></section>
    <div class="me">
      <div class="stat"><span class="l">المستوى ${ar(L.n)}</span><span class="v" style="font-size:1.1rem">${L.title}</span><div class="xpbar"><i style="width:${L.pct}%"></i></div><span class="l" style="margin-top:4px">${L.max ? 'أعلى مستوى!' : `${ar(L.toNext)} ⭐ للمستوى التالي`}</span></div>
      <div class="stat"><span class="v num">🧠 ${ar(S.logic)}</span><span class="l">نقاط التفكير المنطقي</span></div>
      <div class="stat"><span class="v num">🐞 ${ar(S.bugs)}</span><span class="l">أخطاء اكتشفتها</span></div>
      <div class="stat"><span class="v num">🔥 ${ar(S.streak.count || 0)}</span><span class="l">أيام متتالية</span></div></div>
    <div class="gates">
      <button class="gate g1" data-go="build"><span class="portal"></span><span class="gicon">🧩</span><span class="gk">البوابة الأولى</span><h2>كيف يصنع المبرمج برنامجًا؟</h2><span class="gs">من فهم المشكلة… إلى تحسين الحل</span>
        <span class="gp"><span class="bar"><i style="width:${g1.pct}%"></i></span><b>${ar(g1.d)}/${ar(g1.n)}</b></span></button>
      <button class="gate g2" data-go="think"><span class="portal"></span><span class="gicon">⚙️</span><span class="gk">البوابة الثانية</span><h2>كيف يفكّر البرنامج؟</h2><span class="gs">Loop · If · Else · المتغيرات · الأخطاء</span>
        <span class="gp"><span class="bar"><i style="width:${g2.pct}%"></i></span><b>${ar(g2.d)}/${ar(g2.n)}</b></span></button>
    </div>
    <div class="side-row">
      <button class="tile${dailyDone ? ' done' : ''}" data-go="daily"><span class="ti">🎯</span><span><b>تحدي اليوم</b><span>${dailyDone ? 'أنجزته اليوم ✓ عُد غدًا' : 'لغز سريع جديد كل يوم · +٣٠ ⭐'}</span></span></button>
      <button class="tile${finDone ? ' done' : ''}" ${finOpen ? 'data-go="m:final"' : 'disabled style="opacity:.6;cursor:not-allowed"'}><span class="ti">🧠</span><span><b>مهمة المبرمج الأخيرة</b><span>${finDone ? 'أعدت تشغيل النظام ✓' : finOpen ? 'كل شيء جاهز… أعد تشغيل النظام!' : '🔒 تُفتح بعد إكمال البوابتين'}</span></span></button>
    </div>
    <div class="row c" style="margin-top:26px"><button class="btn ghost sm" data-go="intro">📜 قصة النظام</button><button class="btn ghost sm" data-go="teacher">👩‍🏫 لوحة المعلم</button></div>`;
};

/* ---------- gate maps ---------- */
function mapNode(m, i, label) {
  const r = M(m.id), open = isUnlocked(m);
  return `<li><button class="node${r.done ? ' done' : ''}${open ? '' : ' locked'}" ${open ? `data-go="m:${m.id}"` : 'disabled'}>
    <span class="ic">${open ? m.icon : '🔒'}</span><span class="nb"><span class="stepno">${label}</span><b>${m.title}</b><span>${m.sub}</span></span>
    <span class="st">${r.done ? '★'.repeat(r.stars) : open ? '▶' : ''}</span></button></li>`;
}
ROUTES.build = () => {
  const list = gateMissions('build'), s = gateStats('build');
  const names = { '١': 'فهم المشكلة', '٢': 'المدخلات والمخرجات', '٣': 'تصميم الخوارزمية', '٤': 'كتابة البرنامج', '٥': 'اختبار البرنامج', '٦': 'اكتشاف الأخطاء وتصحيحها', '٧': 'تحسين الحل' };
  app.innerHTML = hud('🧩 كيف يصنع المبرمج برنامجًا؟', 'home') + guide(`كل برنامج في العالم يمر بهذه <b>المراحل السبع</b> بالترتيب. لن تُفتح المهمة التالية إلا بعد أن تجرّب التي قبلها. (${ar(s.d)} من ${ar(s.n)})`, 'happy') +
    `<ol class="path">${list.map((m, i) => mapNode(m, i, `المرحلة ${m.stage} · ${names[m.stage]}`)).join('')}</ol>`;
};
ROUTES.think = () => {
  const list = gateMissions('think'), s = gateStats('think');
  const W = { '🔁': 'عالم LOOP', '🤔': 'عالم IF', '⚖️': 'عالم IF / ELSE', '🔀': 'عالم IF / ELSE IF', '📦': 'عالم المتغيرات', '🎮': 'عالم المدخلات والمخرجات', '🐞': 'عالم اكتشاف الأخطاء' };
  app.innerHTML = hud('⚙️ كيف يفكّر البرنامج؟', 'home') + guide(`هنا لن أشرح لك شيئًا قبل أن تلعب. <b>العب أولًا</b>… وستكتشف المفهوم بنفسك. (${ar(s.d)} من ${ar(s.n)})`, 'wow') +
    `<ol class="path">${list.map((m, i) => mapNode(m, i, `${m.stage} ${W[m.stage]}`)).join('')}</ol>`;
};

/* ---------- daily challenge ---------- */
const DAILY = [
  { q: '<span class="ltr">كرر ٣ مرات: صفّق 👏 مرتين</span><br>كم تصفيقة؟', o: ['٣', '٥', '٦'], a: 2, w: '٣ دورات × تصفيقتين = ٦.' },
  { q: 'س = ٤ ثم س = س + ٣ ثم س = س × ٢<br>ما قيمة س؟', o: ['١١', '١٤', '٨'], a: 1, w: '(٤ + ٣) × ٢ = ١٤.' },
  { q: 'إذا الحرارة ≥ ٣٠: «حار» وإلا: «لطيف»<br>الحرارة ٣٠. ماذا يُطبع؟', o: ['حار', 'لطيف', 'لا شيء'], a: 0, w: '٣٠ ≥ ٣٠ صحيحة.' },
  { q: 'إذا ≥ ٩٠: «ذهبي» وإلا إذا ≥ ٧٠: «فضي» وإلا: «برونزي»<br>النقاط ٨٥؟', o: ['ذهبي', 'فضي', 'برونزي'], a: 1, w: 'أول شرط صحيح: ٨٥ ≥ ٧٠ ← فضي.' },
  { q: 'روبوت في الخانة ٢. الأوامر: يمين، يمين، يسار.<br>أين ينتهي؟', o: ['الخانة ٣', 'الخانة ٤', 'الخانة ٥'], a: 0, w: '٢ + ١ + ١ − ١ = ٣.' },
  { q: 'أي واحد من هذه <b>ليس</b> خوارزمية؟', o: ['وصفة كعكة', 'خطوات تسجيل الدخول', 'لون السماء'], a: 2, w: 'لون السماء معلومة، ليس خطوات لحل مشكلة.' },
  { q: 'كرر طالما العدد &lt; ٥: العدد = العدد + ١<br>بدأ العدد من ٢. كم مرة تكررت الحلقة؟', o: ['٢', '٣', '٥'], a: 1, w: '٢←٣←٤←٥ : ثلاث مرات ثم توقف.' },
  { q: 'برنامج يطبع المجموع قبل أن يحسبه. ما نوع الخطأ؟', o: ['خطأ في الترتيب', 'خطأ في الشرط', 'لا يوجد خطأ'], a: 0, w: 'الترتيب مهم: نحسب أولًا ثم نطبع.' },
  { q: 'في لعبة: «النقاط على الشاشة» هي…', o: ['مدخل', 'مخرج', 'متغير لا يظهر'], a: 1, w: 'ما يعرضه البرنامج لك = مخرج.' },
  { q: 'إذا معك تذكرة <b>و</b> عمرك ≥ ١٢: ادخل<br>معك تذكرة، وعمرك ١٠. هل تدخل؟', o: ['نعم', 'لا'], a: 1, w: '«و» تحتاج الشرطين معًا.' }
];
ROUTES.daily = () => {
  const t = today(); const idx = [...t].reduce((s, ch) => s + ch.charCodeAt(0), 0) % DAILY.length; const D = DAILY[idx];
  const done = S.daily.date === t && S.daily.done;
  app.innerHTML = hud('🎯 تحدي اليوم', 'home') + guide(done ? 'أنجزت تحدي اليوم! 🔥 عُد غدًا للغز جديد، وحافظ على سلسلتك.' : 'لغز اليوم! فكّر مثل الحاسب: سطرًا سطرًا. خذ وقتك، لا يوجد مؤقّت ضاغط.', done ? 'happy' : 'think') +
    `<section class="panel"><span class="eyebrow">${t}</span><div class="bigq" style="margin-top:6px">${D.q}</div><div class="cards" id="dc">${D.o.map((o, i) => `<button class="card" data-i="${i}"${done ? ' disabled' : ''}>${o}</button>`).join('')}</div><div id="fb"></div></section>`;
  const t0 = Date.now();
  if (!done) $('#dc').onclick = e => {
    const b = e.target.closest('.card'); if (!b || b.disabled) return;
    if (+b.dataset.i === D.a) {
      b.classList.add('ok'); $$('#dc .card').forEach(x => x.disabled = true);
      S.daily = { date: t, done: true }; S.xp += 30; S.logic += 1; touchStreak(); save(); sfx.win(); burst();
      fbox($('#fb'), `${D.w} +٣٠ ⭐ · حللته في ${ar(Math.round((Date.now() - t0) / 1000))} ثانية. 🔥 سلسلتك: ${ar(S.streak.count)} يوم.`, 'ok');
    } else { b.classList.add('bad'); b.disabled = true; sfx.oops(); fbox($('#fb'), 'ليس هذا. تتبّع السطور واحدًا واحدًا، وجرّب مرة أخرى.', 'bad'); }
  };
};

/* ---------- boot ---------- */
function start() {
  const h = (location.hash || '').slice(1).replace('-', ':');
  go(h && h !== 'intro' && S.intro ? h : (S.intro ? 'home' : 'intro'));
  initCloud();
}
function onCloudReady() {
  const cur = (location.hash || '').slice(1);
  if (!S.intro) return;
  if (cur === 'home' || cur === '') go('home');
  if (cur === 'teacher') go('teacher');
  pushCloud();
}
