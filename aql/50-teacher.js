
/* ---------- teacher dashboard ----------
   Reads every student's progress/<id> doc. Only the owner and editors can read them (db rules). */
function analyze(students) {
  const ms = CONTENT.missions, byC = {};
  ms.forEach(m => { (byC[m.concept] = byC[m.concept] || []).push(m.id); });
  const rows = students.map(s => {
    const mm = s.missions || {}; const done = ms.filter(m => mm[m.id]?.done).length;
    const attempts = Object.values(mm).reduce((a, m) => a + (m.attempts || 0), 0);
    const mastered = [], struggled = [];
    for (const [c, ids] of Object.entries(byC)) {
      if (ids.every(id => mm[id]?.done && (mm[id].stars || 0) >= 2)) mastered.push(c);
      if (ids.some(id => (mm[id]?.fails || 0) >= 3 || (mm[id]?.hints || 0) >= 2)) struggled.push(c);
    }
    return { ...s, done, pct: Math.round(done / ms.length * 100), attempts, mastered, struggled, lvl: levelInfo(s.xp || 0) };
  });
  const concept = Object.entries(byC).map(([c, ids]) => {
    let sum = 0, n = 0; rows.forEach(r => ids.forEach(id => { const m = (r.missions || {})[id]; sum += m?.done ? (m.stars || 1) / 3 : 0; n++; }));
    return { c, v: n ? Math.round(sum / n * 100) : 0 };
  });
  const hard = ms.map(m => { let f = 0, n = 0; rows.forEach(r => { const x = (r.missions || {})[m.id]; if (x && x.attempts) { f += x.fails || 0; n++; } }); return { m, v: n ? +(f / n).toFixed(1) : 0, n }; })
    .filter(x => x.n).sort((a, b) => b.v - a.v).slice(0, 5);
  return { rows, concept, hard };
}
function demoStudents() {
  const names = ['طالب ١ (مثال)', 'طالب ٢ (مثال)', 'طالب ٣ (مثال)', 'طالب ٤ (مثال)', 'طالب ٥ (مثال)', 'طالب ٦ (مثال)'];
  return names.map((name, k) => {
    const missions = {}; const reach = [4, 9, 14, 7, 18, 11][k];
    CONTENT.missions.slice(0, reach).forEach((m, i) => { const f = (k * 7 + i * 3) % 5; missions[m.id] = { done: true, stars: f > 2 ? 1 : f > 0 ? 2 : 3, attempts: 1 + (f > 2 ? 2 : 0), fails: f, hints: f > 3 ? 2 : f > 1 ? 1 : 0 }; });
    const xp = Object.values(missions).length * 50; return { name, xp, logic: reach * 2, bugs: Math.floor(reach / 3), missions, updatedAt: Date.now() - k * 36e5 * 5 };
  });
}
let tipEl = null;
function tip(e, text) { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); } tipEl.textContent = text; tipEl.style.left = e.clientX + 'px'; tipEl.style.top = e.clientY + 'px'; tipEl.hidden = false; }
document.addEventListener('pointerover', e => { const b = e.target.closest('[data-tip]'); if (b) tip(e, b.dataset.tip); else if (tipEl) tipEl.hidden = true; });
document.addEventListener('pointermove', e => { if (tipEl && !tipEl.hidden && e.target.closest('[data-tip]')) { tipEl.style.left = e.clientX + 'px'; tipEl.style.top = e.clientY + 'px'; } });

ROUTES.teacher = async (arg) => {
  const demo = arg === 'demo';
  app.innerHTML = hud('👩‍🏫 لوحة المعلم', 'home') + '<div id="tv"><section class="panel"><p class="muted">جارٍ تحميل تقدّم الطلاب…</p></section></div>';
  let students = [], note = '';
  if (demo) { students = demoStudents(); note = 'بيانات توضيحية لأسماء غير حقيقية، لترى شكل اللوحة. ستظهر بيانات طلابك الحقيقيين هنا عندما يلعبون.'; }
  else if (!CLOUD.db || !CLOUD.uid) { return renderGate('حفظ التقدّم المشترك غير متاح في هذا العرض. افتح اللعبة من حسابك على claude.ai لترى تقدّم طلابك.'); }
  else if (!CLOUD.teacher) { return renderGate('هذه اللوحة لصاحب اللعبة والمحررين فقط. تقدّمك أنت محفوظ ويظهر لمعلمك.'); }
  else {
    try { const q = await CLOUD.db.collection('progress').get(); students = q.docs.map(d => ({ id: d.id, ...(d.data() || {}) })); }
    catch (e) { return renderGate('تعذّر تحميل بيانات الطلاب الآن. حاول مرة أخرى بعد قليل.'); }
    if (!students.length) {
      $('#tv').innerHTML = `<section class="panel"><h3>لا يوجد طلاب بعد</h3><p class="muted">شارك رابط اللعبة مع طلابك بصلاحية <b>مساهم (Contributor)</b> من قائمة المشاركة. عندما يبدأ أي طالب اللعب، سيظهر تقدّمه هنا تلقائيًا: نسبة الإنجاز، والمفاهيم التي أتقنها، وأين واجه صعوبة.</p>
        <div class="row"><button class="btn royal" data-go="teacher:demo">اعرض بيانات توضيحية</button><button class="btn ghost" data-go="teacher">↻ تحديث</button></div></section>`;
      return;
    }
  }
  render(students, note);

  function renderGate(msg) {
    $('#tv').innerHTML = `<section class="panel"><h3>لوحة المعلم</h3><p class="muted">${msg}</p><div class="row"><button class="btn royal" data-go="teacher:demo">اعرض بيانات توضيحية</button></div></section>`;
  }
  function render(list, note) {
    const A = analyze(list); const R = A.rows.sort((a, b) => b.pct - a.pct);
    const avg = R.length ? Math.round(R.reduce((s, r) => s + r.pct, 0) / R.length) : 0;
    const avgM = A.concept.length ? Math.round(A.concept.reduce((s, c) => s + c.v, 0) / A.concept.length) : 0;
    const totalBugs = R.reduce((s, r) => s + (r.bugs || 0), 0), totalAtt = R.reduce((s, r) => s + r.attempts, 0);
    $('#tv').innerHTML = `${note ? `<div class="demo-note">⚠️ ${note}</div>` : ''}
      <div class="tgrid">
        <div class="stat"><span class="v num">${ar(R.length)}</span><span class="l">طالب</span></div>
        <div class="stat"><span class="v num">${ar(avg)}٪</span><span class="l">متوسط التقدّم</span></div>
        <div class="stat"><span class="v num">${ar(avgM)}٪</span><span class="l">متوسط إتقان المفاهيم</span></div>
        <div class="stat"><span class="v num">${ar(totalAtt)}</span><span class="l">محاولات · 🐞 ${ar(totalBugs)} خطأ مكتشف</span></div></div>
      <div class="two">
        <section class="panel"><h3>إتقان كل مفهوم</h3><p class="small muted">متوسط الطلاب، ويُحسب من المهام المكتملة ونجومها</p><div class="bars" style="margin-top:12px">
          ${A.concept.sort((a, b) => a.v - b.v).map(c => `<div class="hbar" data-tip="${CONCEPTS[c.c]}: ${c.v}٪"><span>${CONCEPTS[c.c]}</span><span class="t"><i style="width:${c.v}%;background:${c.v < 40 ? 'var(--amber)' : 'var(--royal)'}"></i></span><span class="vlab num">${ar(c.v)}٪</span></div>`).join('')}</div>
          <p class="small muted" style="margin-top:10px">🟧 أقل من ٤٠٪: مفهوم يحتاج مراجعة مع الصف</p></section>
        <section class="panel"><h3>أكثر التحديات صعوبة</h3><p class="small muted">متوسط المحاولات الخاطئة لكل طالب جرّب المهمة</p><div class="bars" style="margin-top:12px">
          ${A.hard.length ? (() => { const mx = Math.max(1, ...A.hard.map(h => h.v)); return A.hard.map(h => `<div class="hbar" data-tip="${h.m.title}: ${h.v} محاولة خاطئة في المتوسط"><span>${h.m.icon} ${h.m.title}</span><span class="t"><i style="width:${h.v / mx * 100}%;background:var(--amber)"></i></span><span class="vlab num">${ar(h.v)}</span></div>`).join(''); })() : '<p class="muted">لا توجد بيانات كافية بعد.</p>'}</div></section></div>
      <section class="panel"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="flex:1">الطلاب</h3>${demo ? '<button class="btn sm ghost" data-go="teacher">رجوع إلى البيانات الحقيقية</button>' : '<button class="btn sm ghost" data-go="teacher">↻ تحديث</button>'}</div>
        <p class="small muted">اضغط على طالب لترى تفاصيله.</p>
        <div class="tablewrap"><table class="stable"><thead><tr><th>الطالب</th><th>التقدّم</th><th>المستوى</th><th>أتقن</th><th>واجه صعوبة في</th><th>المحاولات</th></tr></thead><tbody>
        ${R.map((r, i) => `<tr data-i="${i}"><td><b>${esc(r.name || 'طالب بدون اسم')}</b></td><td class="num">${ar(r.pct)}٪<span class="mini"><i style="width:${r.pct}%"></i></span></td><td>م${ar(r.lvl.n)}</td>
          <td>${r.mastered.map(c => `<span class="pill2 m">${CONCEPTS[c]}</span>`).join('') || '<span class="muted small">—</span>'}</td><td>${r.struggled.map(c => `<span class="pill2 s">${CONCEPTS[c]}</span>`).join('') || '<span class="muted small">—</span>'}</td><td class="num">${ar(r.attempts)}</td></tr>`).join('')}
        </tbody></table></div><div id="detail"></div></section>`;
    $('.stable tbody').onclick = e => {
      const tr = e.target.closest('tr'); if (!tr) return; $$('.stable tr').forEach(x => x.classList.remove('sel')); tr.classList.add('sel');
      const r = R[+tr.dataset.i], mm = r.missions || {};
      $('#detail').innerHTML = `<div class="stage" style="margin-top:14px"><h3>${esc(r.name || 'طالب')} · ${r.lvl.title}</h3><p class="small muted">⭐ ${ar(r.xp || 0)} خبرة · 🧠 ${ar(r.logic || 0)} تفكير منطقي · 🐞 ${ar(r.bugs || 0)} خطأ مكتشف</p>
        <div class="bars" style="margin-top:10px">${CONTENT.missions.map(m => { const x = mm[m.id]; const v = x?.done ? Math.round((x.stars || 1) / 3 * 100) : 0; return `<div class="hbar" data-tip="${m.title}: ${x ? `${x.attempts || 0} محاولة، ${x.fails || 0} خطأ، ${x.hints || 0} تلميح` : 'لم يبدأ'}"><span>${m.icon} ${m.title}</span><span class="t"><i style="width:${v}%;background:${x && (x.fails || 0) >= 3 ? 'var(--amber)' : 'var(--emerald)'}"></i></span><span class="vlab">${x?.done ? '★'.repeat(x.stars || 1) : x ? '…' : '—'}</span></div>`; }).join('')}</div></div>`;
    };
  }
};
