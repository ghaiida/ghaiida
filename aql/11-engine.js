
/* ---------- mission engine ----------
   Every mission = Experience (mechanic) → Discover (reveal "what you just did is…") → Explain (memory card) → Practice (inside mechanic) → Master (rewards).
   Mechanics are registered by name; content (CONTENT below, in 12-content.js) only references them, so new lessons are data, not code. */
const MECH = {};
const CONCEPTS = {
  problem: 'فهم المشكلة', io: 'المدخلات والمخرجات', algo: 'الخوارزمية', code: 'كتابة البرنامج', test: 'الاختبار',
  debug: 'تصحيح الأخطاء', optimize: 'تحسين الحل', loop: 'التكرار Loop', if: 'الشرط If', ifelse: 'If / Else', elseif: 'Else If', var: 'المتغيرات', inout: 'الإدخال والإخراج'
};
const missionById = id => CONTENT.missions.find(m => m.id === id);
const gateMissions = g => CONTENT.missions.filter(m => m.gate === g);
function isUnlocked() { return true; } // classroom mode: the teacher can open any mission in any order

ROUTES.m = id => {
  const def = missionById(id); if (!def) return go('home');
  if (!isUnlocked(def)) return go(def.gate === 'think' ? 'think' : 'build');
  const back = def.gate === 'think' ? 'think' : def.gate === 'final' ? 'home' : 'build';
  const list = gateMissions(def.gate), idx = list.indexOf(def);
  app.innerHTML = hud(`${def.icon} ${def.title}`, back) + `
    ${guide(def.intro, def.mood || 'happy')}
    <section class="panel" id="stage-panel"><button class="btn sm amber hintbtn" id="hintbtn">💡 أعطني تلميحًا</button>
      <span class="eyebrow">${def.gate === 'final' ? 'المهمة الأخيرة' : def.gate === 'build' ? `المهمة ${ar(idx + 1)} من ${ar(list.length)}` : `العالم ${ar(idx + 1)} من ${ar(list.length)}`}</span>
      <h3 style="padding-inline-end:150px">${def.task}</h3>
      <div id="stage" style="margin-top:14px"></div><div id="hint"></div><div id="fb"></div></section>
    <div id="after"></div>`;
  const rec = M(id); rec.attempts++; save();
  const t0 = Date.now(); let hintLv = 0, fails = 0, revealed = false, completed = false;
  const hintBtn = $('#hintbtn');
  hintBtn.onclick = () => {
    if (hintLv >= def.hints.length) return;
    const labels = ['تلميح بسيط', 'توجيه أوضح', 'مثال مشابه'];
    hintLv++; rec.hints++; save(); sfx.tap();
    $('#hint').innerHTML = def.hints.slice(0, hintLv).map((h, i) => `<div class="hintbox"><div class="hl">💡 ${labels[i]}</div>${h}</div>`).join('');
    if (hintLv >= def.hints.length) { hintBtn.disabled = true; hintBtn.textContent = '💡 استخدمت كل التلميحات'; }
  };
  const ctx = {
    def, cfg: def.cfg || {}, host: $('#stage'), fbEl: $('#fb'),
    say: (h, m) => say(h, m),
    info(h) { fbox($('#fb'), h, 'info'); },
    clear() { $('#fb').innerHTML = ''; },
    ok(h) { sfx.ok(); fbox($('#fb'), h, 'ok'); },
    fail(h, opts = {}) {
      fails++; rec.fails++; save(); sfx.oops();
      const extra = fails >= 2 && hintLv < def.hints.length ? '<br><small>تحتاج دفعة صغيرة؟ اضغط 💡 أعطني تلميحًا.</small>' : '';
      fbox($('#fb'), `${h}${opts.noCheck ? '' : '<br><b>هل تريد فحص خطواتك؟</b> 🔍'}${extra}`, 'bad');
      if (fails >= 2) { shake(hintBtn); }
    },
    bug() { S.bugs++; save(); sfx.bug(); },
    reveal() {
      if (revealed) return; revealed = true;
      const r = def.reveal; if (!r) return;
      $('#after').insertAdjacentHTML('beforeend', `<section class="reveal"><div class="k">${r.k || 'اكتشفت للتو…'}</div><h2>${r.title}</h2>${r.text ? `<p>${r.text}</p>` : ''}${r.eq ? `<div class="eq">${r.eq}</div>` : ''}${r.life ? `<div class="life">${r.life.map(x => `<span>${x}</span>`).join('')}</div>` : ''}</section>`);
      later(() => $('#after').lastElementChild?.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' }), 150);
    },
    complete(bonus = {}) {
      if (completed) return; completed = true; ctx.reveal();
      const ms = Date.now() - t0, first = !rec.done;
      const stars = bonus.stars ?? (fails === 0 && hintLv === 0 ? 3 : fails <= 2 && hintLv <= 1 ? 2 : 1);
      let xp = first ? def.xp || 40 : 10; let logic = 0;
      if (fails === 0) { logic = def.logic || 2; if (first) rec.firstTry = true; }
      if (first && hintLv === 0) xp += 10;
      rec.done = true; rec.stars = Math.max(rec.stars, stars); if (!rec.bestMs || ms < rec.bestMs) rec.bestMs = ms;
      const before = levelInfo().n; S.xp += xp; S.logic += logic; touchStreak(); save();
      const after = levelInfo();
      sfx.win(); burst();
      const mem = def.memory;
      const next = list[idx + 1];
      $('#after').insertAdjacentHTML('beforeend', `
        ${mem ? `<div class="memcard"><div class="memcard-in"><div class="glyph">${mem.glyph}</div><div><div class="lbl">🧠 احفظها في عقلك</div><h4>${mem.title}</h4><q>${mem.text}</q></div></div></div>` : ''}
        <section class="panel"><div class="row" style="margin-top:0">
          <span class="chip">⭐ +${ar(xp)} خبرة</span>${logic ? `<span class="chip">🧠 +${ar(logic)} تفكير منطقي</span>` : ''}<span class="chip">⚡ ${ar(Math.round(ms / 1000))} ث</span>
          <span class="chip" aria-label="${ar(stars)} نجوم">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span></div>
          <p class="muted small" style="margin-top:10px">${fails ? `جرّبت ${ar(fails + 1)} مرات حتى نجحت. هكذا يعمل المبرمجون: تجربة، ثم فحص، ثم إصلاح.` : 'نجحت من أول محاولة! عقلك المنطقي يعمل بقوة.'}</p>
          <div class="row">${next ? `<button class="btn royal" data-go="m:${next.id}">المهمة التالية: ${next.title} ←</button>` : `<button class="btn royal" data-go="${back}">رجوع إلى الخريطة ←</button>`}
          <button class="btn ghost" data-go="m:${id}">العب مرة أخرى ↻</button></div></section>`);
      if (after.n > before) later(() => toast(`🏆 مستوى جديد: <span class="xp">م${ar(after.n)} · ${after.title}</span>`), 900);
      else later(() => toast(`<span class="xp">+${ar(xp)} ⭐</span> ${def.title} اكتملت`), 600);
    }
  };
  MECH[def.mech](ctx);
};
