document.documentElement.setAttribute('dir','rtl');
document.documentElement.setAttribute('lang','ar');
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = $('#app');
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = n => String(n).replace(/\d/g, d => AR[d]);
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

let S = { done: {}, stars: {}, sound: true, name: '' };
try { const o = JSON.parse(localStorage.getItem('bitto-v1') || 'null'); if (o) S = Object.assign(S, o); } catch (e) {}
function save() { try { localStorage.setItem('bitto-v1', JSON.stringify(S)); } catch (e) {} }

/* timers are cleared on every screen change, so pending animations simply stop */
let timers = [];
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
const wait = ms => new Promise(r => later(r, ms));

/* sound */
let AC = null;
function tone(f, d = .12, type = 'sine', v = .08) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
    o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d);
  } catch (e) {}
}
const sfx = {
  ok() { tone(660); setTimeout(() => tone(880), 90); },
  bad() { tone(190, .22, 'square', .045); },
  step() { tone(460, .05, 'triangle', .05); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .16), i * 110)); }
};

/* the robot */
function bot(mood = 'happy', size = 80) {
  const ink = '#1B2440';
  const mouth = mood === 'sad' ? `<path d="M41 62 Q50 55 59 62" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
    : mood === 'wow' ? `<ellipse cx="50" cy="60" rx="5" ry="6" fill="${ink}"/>`
    : `<path d="M40 57 Q50 66 60 57" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
  const eyes = mood === 'sad' ? `<path d="M35 46 h10 M55 46 h10" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="40" cy="46" r="5" fill="${ink}"/><circle cx="60" cy="46" r="5" fill="${ink}"/><circle cx="41.5" cy="44.5" r="1.6" fill="#fff"/><circle cx="61.5" cy="44.5" r="1.6" fill="#fff"/>`;
  return `<svg class="bot" viewBox="0 0 100 118" width="${size}" height="${Math.round(size * 1.18)}" aria-hidden="true">
<line x1="50" y1="8" x2="50" y2="22" stroke="${ink}" stroke-width="3"/><circle cx="50" cy="8" r="6" fill="#EE6F2D" stroke="${ink}" stroke-width="2"/>
<rect x="8" y="38" width="8" height="18" rx="4" fill="#FFD23F" stroke="${ink}" stroke-width="2"/><rect x="84" y="38" width="8" height="18" rx="4" fill="#FFD23F" stroke="${ink}" stroke-width="2"/>
<rect x="15" y="22" width="70" height="56" rx="18" fill="#2D5BEF" stroke="${ink}" stroke-width="3"/>
<rect x="24" y="31" width="52" height="38" rx="12" fill="#fff" stroke="${ink}" stroke-width="2"/>
${eyes}${mouth}
<rect x="30" y="82" width="40" height="30" rx="9" fill="#FFD23F" stroke="${ink}" stroke-width="3"/>
<path d="M42 92 h16 M42 100 h10" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
function swapBot(host, mood, size) { const s = host.querySelector('svg.bot'); if (!s) return; s.insertAdjacentHTML('afterend', bot(mood, size)); s.remove(); }

/* router */
const ROUTES = {};
function go(r) {
  timers.forEach(clearTimeout); timers = [];
  if (!ROUTES[r]) r = 'home';
  ROUTES[r]();
  window.scrollTo(0, 0);
  try { history.replaceState(null, '', '#' + r); } catch (e) {}
}
const soundBtn = () => `<button class="iconbtn" data-sound aria-label="تشغيل أو كتم الصوت">${S.sound ? '🔊' : '🔇'}</button>`;
function frame(title, back, body, tone = 'blue') {
  app.innerHTML = `<header class="bar t-${tone}"><button class="iconbtn" data-go="${back}" aria-label="رجوع">→</button><h2>${title}</h2>${soundBtn()}</header><main class="${tone === 'orange' ? 'w-orange' : 'w-blue'}">${body}</main>`;
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-sound]');
  if (s) { S.sound = !S.sound; save(); s.textContent = S.sound ? '🔊' : '🔇'; return; }
  const g = e.target.closest('[data-go]');
  if (g) { sfx.step(); go(g.dataset.go); }
});

/* shared ui */
const talk = (html, mood = 'happy', id = '') => `<div class="talk"${id ? ` id="${id}"` : ''}><div class="talk-bot">${bot(mood, 64)}</div><div class="bubble">${html}</div></div>`;
function setTalk(el, html, mood = 'happy') { el.querySelector('.talk-bot').innerHTML = bot(mood, 64); el.querySelector('.bubble').innerHTML = html; }
function fb(el, html, ok) { el.className = 'fb ' + (ok ? 'ok' : 'bad'); el.innerHTML = html; el.hidden = false; }
const starHTML = n => n ? `<span class="stars" aria-label="${ar(n)} نجوم">${'★'.repeat(n)}<span class="dim">${'★'.repeat(3 - n)}</span></span>` : '';
const code = s => `<div class="code">${s}</div>`;
function pseudo(lines, id = '') {
  return `<div class="pseudo"${id ? ` id="${id}"` : ''}>${lines.map(l => { const ind = (l.match(/^ */)[0].length / 4) | 0; return `<div class="ln" style="--ind:${ind}">${l.trim()}</div>`; }).join('')}</div>`;
}
function shakeEl(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function confetti() {
  if (REDUCE) return;
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#2D5BEF', '#EE6F2D', '#FFD23F', '#159957', '#DC3B4F'];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % 5];
    s.style.animationDelay = Math.random() * .4 + 's'; s.style.animationDuration = 1.2 + Math.random() * .8 + 's';
    c.appendChild(s);
  }
  document.body.appendChild(c); setTimeout(() => c.remove(), 2800);
}
function finish({ id, stars = 3, memo, next, nextLabel, map, extra = '' }) {
  S.done[id] = true; S.stars[id] = Math.max(S.stars[id] || 0, stars); save();
  sfx.win(); confetti();
  const A = $('#after');
  A.innerHTML = `<section class="panel win"><div class="win-head">${bot('happy', 56)}<div><h3>أحسنت! أتممت المهمة</h3>${starHTML(stars)}</div></div>
    <div class="memo"><span class="memo-tag">ثبّتها في ذاكرتك</span>${memo}</div>
    <div class="row">${next ? `<button class="btn ${map === 'w2' ? 'hot' : 'primary'}" data-go="${next}">${nextLabel || 'المهمة التالية'} ←</button>` : ''}${extra}<button class="btn" data-go="${map}">العودة للخريطة</button></div></section>`;
  later(() => A.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' }), 200);
}

/* tap-to-order builder */
function builder(host, items, onChange) {
  let pool = shuffle(items), seq = [];
  host.innerHTML = `<div class="b-cols"><div><div class="lbl">البطاقات</div><div class="chips b-pool"></div></div><div><div class="lbl">ترتيبك</div><ol class="seq"></ol></div></div>`;
  const P = host.querySelector('.b-pool'), Q = host.querySelector('.seq');
  const api = {
    locked: false,
    get seq() { return seq; },
    mark(i, cls) { const c = Q.children[i] && Q.children[i].querySelector('.chip'); if (c) c.classList.add(cls); },
    clearMarks() { Q.querySelectorAll('.chip').forEach(c => c.classList.remove('on', 'ok', 'bad')); }
  };
  function draw() {
    P.innerHTML = pool.map(it => `<button class="chip" data-id="${it.id}">${it.t}</button>`).join('') || '<span class="empty">انتهت البطاقات ✓</span>';
    Q.innerHTML = seq.map(it => `<li><button class="chip" data-id="${it.id}">${it.t}</button></li>`).join('') || '<li class="empty">اضغط البطاقات بالترتيب الذي تراه صحيحًا</li>';
    onChange && onChange(seq);
  }
  P.onclick = e => { const b = e.target.closest('[data-id]'); if (!b || api.locked) return; const i = pool.findIndex(x => String(x.id) === b.dataset.id); seq.push(pool.splice(i, 1)[0]); sfx.step(); draw(); };
  Q.onclick = e => { const b = e.target.closest('[data-id]'); if (!b || api.locked) return; const i = seq.findIndex(x => String(x.id) === b.dataset.id); pool.push(seq.splice(i, 1)[0]); draw(); };
  draw();
  return api;
}

/* multiple-choice quiz */
function quiz(host, qs, onDone) {
  let i = 0, wrong = 0;
  function show() {
    const q = qs[i], opts = q.fixed ? q.opts : shuffle(q.opts);
    host.innerHTML = `<span class="pill">سؤال ${ar(i + 1)} من ${ar(qs.length)}</span>${q.pre || ''}<p class="q">${q.q}</p>
      <div class="opts${q.fixed ? ' answers' : ''}">${opts.map((o, j) => `<button class="opt" data-j="${j}">${o.t}</button>`).join('')}</div>
      <div class="fb" hidden></div><div class="row" hidden><button class="btn primary">${i < qs.length - 1 ? 'السؤال التالي ←' : 'إنهاء ←'}</button></div>`;
    const F = host.querySelector('.fb'), N = host.querySelector('.row');
    let answered = false;
    host.querySelector('.opts').onclick = e => {
      const b = e.target.closest('.opt'); if (!b || answered || b.disabled) return;
      const o = opts[+b.dataset.j];
      if (o.ok) {
        answered = true; b.classList.add('ok'); sfx.ok(); fb(F, '✓ ' + (o.r || 'صحيح!'), true); N.hidden = false;
        host.querySelectorAll('.opt').forEach(x => { if (x !== b) x.disabled = true; });
      } else { wrong++; b.classList.add('bad'); b.disabled = true; sfx.bad(); fb(F, '✗ ' + (o.r || 'حاول مرة أخرى'), false); }
    };
    N.querySelector('button').onclick = () => { i++; if (i < qs.length) show(); else onDone(wrong); };
  }
  show();
}

/* grid world: robot moves on a board */
const DIR = {
  U: [0, -1, '↑', 'أعلى', 'robot.move_up()', 'الأعلى'],
  D: [0, 1, '↓', 'أسفل', 'robot.move_down()', 'الأسفل'],
  R: [1, 0, '→', 'يمين', 'robot.move_right()', 'اليمين'],
  L: [-1, 0, '←', 'يسار', 'robot.move_left()', 'اليسار']
};
const blkLabel = k => `${DIR[k][2]} ${DIR[k][3]}`;
function makeGrid(host, L) {
  const walls = new Set(L.walls.map(([x, y]) => x + ',' + y));
  let cells = '';
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const w = walls.has(x + ',' + y), g = x === L.goal[0] && y === L.goal[1];
    cells += `<div class="cell${w ? ' wall' : ''}${g ? ' goal' : ''}">${w ? '🪑' : g ? '🙋' : ''}</div>`;
  }
  host.innerHTML = `<div class="grid" style="--w:${L.w};--h:${L.h}" role="img" aria-label="لوحة المتاهة">${cells}<div class="gbot">${bot('happy', 40)}<span class="carry">🧃</span></div></div>`;
  const B = host.querySelector('.gbot'); let pos;
  const place = (x, y) => { pos = [x, y]; B.style.setProperty('--x', x); B.style.setProperty('--y', y); };
  const mood = m => swapBot(B, m, 40);
  function reset() { B.classList.add('nomove'); place(L.start[0], L.start[1]); void B.offsetWidth; B.classList.remove('nomove'); mood('happy'); }
  function bump() { mood('sad'); B.classList.remove('bump'); void B.offsetWidth; B.classList.add('bump'); sfx.bad(); }
  async function run(cmds, onStep) {
    reset(); await wait(300);
    for (let i = 0; i < cmds.length; i++) {
      onStep && onStep(i);
      const [dx, dy] = DIR[cmds[i]], nx = pos[0] + dx, ny = pos[1] + dy;
      if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) { bump(); return { ok: false, i, why: 'edge' }; }
      if (walls.has(nx + ',' + ny)) { bump(); return { ok: false, i, why: 'wall' }; }
      place(nx, ny); sfx.step(); await wait(420);
    }
    const ok = pos[0] === L.goal[0] && pos[1] === L.goal[1];
    mood(ok ? 'happy' : 'sad');
    return { ok, i: cmds.length - 1, why: ok ? '' : 'short' };
  }
  reset();
  return { run, reset };
}
const gridFail = r => r.why === 'short' ? 'انتهت الأوامر ولم يصل بتّو إلى الطالب بعد.'
  : `💥 عند الأمر رقم ${ar(r.i + 1)} ${r.why === 'wall' ? 'اصطدم بتّو بكرسي' : 'خرج بتّو من حدود الفصل'}!`;
