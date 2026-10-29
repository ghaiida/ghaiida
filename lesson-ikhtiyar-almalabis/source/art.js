// Flat vector illustrations (SVG -> PNG) for the deck
const sharp = require("sharp");

// long-sleeve maxi dress, drawn in a 200 x 300 box, top of shoulders at y≈18
function dressPath(len = 290) {
  return `M78,18 Q100,40 122,18 L150,26 L184,122 L166,130 L142,64 L140,110 L${178 + (len - 290) * 0.1},${len} L${22 - (len - 290) * 0.1},${len} L60,110 L58,64 L34,130 L16,122 L50,26 Z`;
}
function coatPath() {
  return `M76,18 L100,48 L124,18 L152,26 L184,140 L166,146 L146,74 L150,232 L50,232 L54,74 L34,146 L16,140 L48,26 Z`;
}
function tunicPath() {
  return `M80,18 Q100,36 120,18 L150,26 L182,118 L164,126 L142,64 L146,196 L54,196 L58,64 L36,126 L18,118 L50,26 Z`;
}
function hanger(stroke) {
  return `<path d="M100,4 L100,-8 C100,-20 116,-20 116,-10" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
  <path d="M100,4 L44,24 L156,24 Z" fill="none" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>`;
}
function garment(kind, fill, trim, extra = "") {
  if (kind === "dress") return `<path d="${dressPath()}" fill="${fill}"/>${extra}
    <path d="M60,110 L140,110" stroke="${trim}" stroke-width="7"/>`;
  if (kind === "abaya") return `<path d="${dressPath(292)}" fill="${fill}"/>
    <path d="M100,40 L100,292" stroke="${trim}" stroke-width="5"/>
    <path d="M166,130 L184,122" stroke="${trim}" stroke-width="6"/><path d="M34,130 L16,122" stroke="${trim}" stroke-width="6"/>`;
  if (kind === "coat") return `<path d="${coatPath()}" fill="${fill}"/>
    <path d="M100,48 L100,232" stroke="${trim}" stroke-width="3"/>
    ${[90, 130, 170, 210].map((y) => `<circle cx="110" cy="${y}" r="5" fill="${trim}"/>`).join("")}
    <path d="M76,18 L92,70 L100,48 M124,18 L108,70 L100,48" fill="none" stroke="${trim}" stroke-width="3"/>`;
  if (kind === "tunic") return `<path d="${tunicPath()}" fill="${fill}"/>
    ${[76, 100, 124].map((x) => `<circle cx="${x}" cy="160" r="6" fill="${trim}"/>`).join("")}
    <path d="M58,140 L144,140" stroke="${trim}" stroke-width="4" stroke-dasharray="8 6"/>`;
  return "";
}

function rackSVG(P) {
  const items = [
    ["coat", P.plum, P.gold],
    ["dress", P.rose, P.blush],
    ["abaya", P.ink, P.gold],
    ["tunic", P.teal, P.mint],
    ["dress", P.gold, P.rose],
  ];
  const g = items
    .map(([k, f, t], i) => `<g transform="translate(${70 + i * 152},64) scale(0.78)">${hanger(P.silver)}${garment(k, f, t)}</g>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="420" viewBox="0 0 900 420">
  <ellipse cx="450" cy="402" rx="420" ry="14" fill="${P.shadow}" opacity="0.35"/>
  <rect x="40" y="40" width="820" height="14" rx="7" fill="${P.silver}"/>
  <rect x="52" y="40" width="12" height="350" rx="6" fill="${P.silver}"/>
  <rect x="836" y="40" width="12" height="350" rx="6" fill="${P.silver}"/>
  <rect x="20" y="384" width="90" height="12" rx="6" fill="${P.silver}"/>
  <rect x="790" y="384" width="90" height="12" rx="6" fill="${P.silver}"/>
  ${g}</svg>`;
}

// season garments: light cotton dress vs dark wool coat
function seasonSVG(kind, P) {
  const body =
    kind === "summer"
      ? `<g transform="translate(20,40)">${hanger(P.silver)}${garment("dress", P.sky, P.white)}</g>`
      : `<g transform="translate(20,40)">${hanger(P.silver)}${garment("coat", P.plumDeep, P.gold)}
         ${[[70, 120], [120, 170], [80, 210], [130, 100]].map(([x, y]) => `<path d="M${x - 7},${y} L${x + 7},${y} M${x - 4},${y - 6} L${x + 4},${y + 6} M${x - 4},${y + 6} L${x + 4},${y - 6}" stroke="${P.white}" stroke-width="2.2" opacity="0.6"/>`).join("")}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="350" viewBox="0 0 240 350">${body}</svg>`;
}

// three dress silhouettes with line patterns (القوام)
function figureSVG(kind, P) {
  const defs = {
    h: `<pattern id="p" width="20" height="22" patternUnits="userSpaceOnUse"><rect width="20" height="22" fill="${P.blush}"/><rect y="0" width="20" height="9" fill="${P.rose}"/></pattern>`,
    v: `<pattern id="p" width="22" height="20" patternUnits="userSpaceOnUse"><rect width="22" height="20" fill="${P.mint}"/><rect x="0" width="9" height="20" fill="${P.teal}"/></pattern>`,
    s: `<pattern id="p" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="${P.lav}"/><rect x="0" width="5" height="26" fill="${P.violet}"/><circle cx="16" cy="13" r="3" fill="${P.violet}"/></pattern>`,
  }[kind];
  const sx = { h: 0.8, v: 1.0, s: 1.15 }[kind];
  const sy = { h: 1.06, v: 0.86, s: 0.96 }[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="340" viewBox="0 0 260 340"><defs>${defs}</defs>
  <g transform="translate(${130 - 100 * sx},${10}) scale(${sx},${sy})"><path d="${dressPath()}" fill="url(#p)" stroke="${P.ink}" stroke-opacity="0.25" stroke-width="2"/></g></svg>`;
}

async function png(svg, width) {
  const buf = await sharp(Buffer.from(svg)).resize({ width }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

module.exports = { rackSVG, seasonSVG, figureSVG, png };
