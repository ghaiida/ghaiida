document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const AR = '٠١٢٣٤٥٦٧٨٩';
const ar = n => String(n).replace(/\d/g, d => AR[d]);
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ---------- timers: cleared on every screen change ---------- */
let timers = [];
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
const wait = ms => new Promise(r => later(r, ms));

/* ---------- player state (local first, cloud when available) ---------- */
const KEY = 'aql-v1';
const blank = () => ({ intro: false, xp: 0, logic: 0, bugs: 0, sound: true, streak: { last: '', count: 0 }, daily: { date: '', done: false }, missions: {} });
let S = blank();
try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o) S = Object.assign(blank(), o); } catch (e) {}
const M = id => (S.missions[id] = S.missions[id] || { done: false, stars: 0, attempts: 0, fails: 0, hints: 0, firstTry: false, bestMs: 0 });
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- levels ---------- */
const LEVELS = [
  [0, 'متدرّب'], [120, 'مستكشف'], [300, 'مفكّر منطقي'], [540, 'مصمّم خوارزميات'], [840, 'مبرمج'], [1200, 'صائد أخطاء محترف'], [1650, 'مهندس برمجيات'], [2200, 'عقل المبرمج']
];
function levelInfo(xp = S.xp) {
  let i = 0; while (i < LEVELS.length - 1 && xp >= LEVELS[i + 1][0]) i++;
  const cur = LEVELS[i][0], nxt = LEVELS[i + 1] ? LEVELS[i + 1][0] : cur;
  return { n: i + 1, title: LEVELS[i][1], pct: nxt > cur ? Math.round((xp - cur) / (nxt - cur) * 100) : 100, toNext: Math.max(0, nxt - xp), max: !LEVELS[i + 1] };
}
function touchStreak() {
  const t = today(); if (S.streak.last === t) return;
  const y = new Date(Date.now() - 864e5); const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
  S.streak = { last: t, count: S.streak.last === ys ? S.streak.count + 1 : 1 };
}

/* ---------- sound ---------- */
let AC = null;
function tone(f, d = .12, type = 'sine', v = .07, at = 0) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d);
  } catch (e) {}
}
const sfx = {
  tap() { tone(520, .05, 'triangle', .04); },
  ok() { tone(660, .1); tone(990, .14, 'sine', .07, .08); },
  oops() { tone(300, .14, 'triangle', .06); tone(240, .18, 'triangle', .05, .1); },
  step() { tone(440, .05, 'triangle', .045); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .16, 'sine', .07, i * .09)); },
  beat(i) { tone([392, 440, 523, 587][i % 4], .12, 'square', .03); },
  bug() { tone(880, .06, 'square', .04); tone(1320, .1, 'square', .04, .07); }
};

/* ---------- the guide robot "رمز" ---------- */
function robot(mood = 'happy', size = 90) {
  const eye = {
    happy: '<path d="M37 47 q6 -7 12 0 M55 47 q6 -7 12 0" stroke="#5CF2C2" stroke-width="4" fill="none" stroke-linecap="round"/>',
    sad: '<path d="M37 44 q6 6 12 0 M55 44 q6 6 12 0" stroke="#FFB4BE" stroke-width="4" fill="none" stroke-linecap="round"/>',
    wow: '<circle cx="43" cy="45" r="6" fill="#5CF2C2"/><circle cx="61" cy="45" r="6" fill="#5CF2C2"/>',
    think: '<circle cx="43" cy="45" r="5" fill="#5CF2C2"/><path d="M55 45 h12" stroke="#5CF2C2" stroke-width="4" stroke-linecap="round"/>',
    dizzy: '<path d="M38 40 l10 10 M48 40 l-10 10 M56 40 l10 10 M66 40 l-10 10" stroke="#FFD27A" stroke-width="3.5" stroke-linecap="round"/>'
  }[mood] || '';
  const mouth = mood === 'sad' || mood === 'dizzy' ? '<path d="M45 60 q7 -4 14 0" stroke="#5CF2C2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>'
    : mood === 'wow' ? '<ellipse cx="52" cy="60" rx="4" ry="4.5" fill="#5CF2C2"/>'
    : '<path d="M44 58 q8 6 16 0" stroke="#5CF2C2" stroke-width="3" fill="none" stroke-linecap="round"/>';
  return `<svg viewBox="0 0 104 124" width="${size}" height="${Math.round(size * 124 / 104)}" aria-hidden="true">
<defs><linearGradient id="rh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B7BFF"/><stop offset="1" stop-color="#1F4FD8"/></linearGradient>
<linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F9FF"/><stop offset="1" stop-color="#D6DFF5"/></linearGradient></defs>
<line x1="52" y1="6" x2="52" y2="20" stroke="#0E2E8F" stroke-width="4" stroke-linecap="round"/><circle cx="52" cy="7" r="6" fill="#F2A12E"/>
<rect x="6" y="36" width="10" height="20" rx="5" fill="#0E9F7A"/><rect x="88" y="36" width="10" height="20" rx="5" fill="#0E9F7A"/>
<rect x="13" y="18" width="78" height="62" rx="24" fill="url(#rh)"/><rect x="13" y="66" width="78" height="14" rx="7" fill="#0E2E8F" opacity=".25"/>
<rect x="22" y="28" width="60" height="42" rx="16" fill="#0F1E44"/><rect x="26" y="31" width="22" height="6" rx="3" fill="#fff" opacity=".12"/>
${eye}${mouth}
<rect x="30" y="84" width="44" height="32" rx="12" fill="url(#rb)"/><circle cx="52" cy="99" r="7" fill="#F2A12E"/><circle cx="52" cy="99" r="3" fill="#fff" opacity=".7"/>
</svg>`;
}
const guide = (html, mood = 'happy', id = 'guide') => `<div class="guide" id="${id}"><div class="rb idle">${robot(mood, 76)}</div><div class="say">${html}</div></div>`;
function say(html, mood = 'happy', id = 'guide') {
  const g = document.getElementById(id); if (!g) return;
  g.querySelector('.rb').innerHTML = robot(mood, 76); g.querySelector('.say').innerHTML = html;
  const rb = g.querySelector('.rb'); rb.classList.remove('shake', 'jump'); void rb.offsetWidth;
  rb.classList.add(mood === 'sad' || mood === 'dizzy' ? 'shake' : mood === 'happy' || mood === 'wow' ? 'jump' : 'idle');
}
function fbox(el, html, kind = 'info', icon) {
  const ic = icon || { ok: '✅', bad: '🔍', info: '💬' }[kind];
  el.innerHTML = `<div class="fb ${kind}"><span class="i">${ic}</span><div>${html}</div></div>`;
}
function shake(el) { el.classList.remove('shakeit'); void el.offsetWidth; el.classList.add('shakeit'); }
function burst() {
  if (REDUCE) return;
  const b = document.createElement('div'); b.className = 'burst';
  const cols = ['#1F4FD8', '#0E9F7A', '#F2A12E', '#FFFFFF', '#5CF2C2'];
  for (let i = 0; i < 36; i++) { const s = document.createElement('i'); const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220; s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px'); s.style.background = cols[i % 5]; b.appendChild(s); }
  document.body.appendChild(b); setTimeout(() => b.remove(), 1300);
}
function toast(html) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.remove(), 2700);
}

/* ---------- router ---------- */
const ROUTES = {};
let routeParam = null;
function go(r, param) {
  timers.forEach(clearTimeout); timers = [];
  routeParam = param ?? null;
  const [name, arg] = String(r).split(':');
  if (!ROUTES[name]) return go('home');
  ROUTES[name](arg);
  window.scrollTo(0, 0);
  try { history.replaceState(null, '', '#' + String(r).replace(':', '-')); } catch (e) {}
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-sound]');
  if (s) { S.sound = !S.sound; save(); s.textContent = S.sound ? '🔊' : '🔇'; return; }
  const g = e.target.closest('[data-go]');
  if (g && !g.disabled) { sfx.tap(); go(g.dataset.go); }
});
function hud(title, back) {
  const L = levelInfo();
  return `<header class="hud">${back ? `<button class="back" data-go="${back}" aria-label="رجوع">→</button>` : ''}
    <div class="hud-title">${title}</div>
    <div class="chips"><span class="chip lvl-chip" title="مستواك">م${ar(L.n)}</span><span class="chip" title="نقاط الخبرة"><span class="k">⭐</span><span class="num">${ar(S.xp)}</span></span>
    <span class="chip opt" title="أيام متتالية"><span class="k">🔥</span>${ar(S.streak.count || 0)}</span>
    <button class="chip" data-sound aria-label="الصوت" style="border:0;cursor:pointer">${S.sound ? '🔊' : '🔇'}</button></div></header>`;
}
