/* AZ-Infra — Scroll-Szene: ein Tag auf der Glasfaser-Baustelle.
   Die gesamte Szene ist ein SVG, das vom Scroll-Fortschritt p (0…1) gesteuert wird. */
(() => {
  const svg = document.getElementById('scene');
  const hero = document.getElementById('hero');
  if (!svg || !hero) return;
  if (window.AZ_FRAMES && window.AZ_FRAMES.count) return; // echtes Video aktiv → video-hero.js
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Geometrie (Szenen-Einheiten) ──
  const G = 560;                 // Geländeoberkante
  const TX0 = 640, TX1 = 1760;   // Graben von … bis
  const TW = TX1 - TX0;
  const TB = 712;                // Grabensohle
  const PV = 40, NP = TW / PV;   // Pflastersteine
  const HOUSES = [670, 890, 1110, 1330, 1550].map((x, i) => ({ x, w: 190, h: [104, 124, 98, 118, 108][i] }));

  // ── Zeitachse ──
  const T = {
    excIn: [.03, .12], dig: [.12, .40], excOut: [.40, .48],
    bed: [.41, .45], pipe: [.44, .62], fibre: [.62, .78],
    fill: [.78, .84], pave: [.84, .93], clear: [.93, .98], outro: .935,
  };
  const PHASES = [[.10, .25], [.25, .42], [.42, .62], [.62, .78], [.78, T.outro]];
  const NAMES = ['Aufbruch', 'Aushub', 'Verlegung', 'Glasfaser', 'Oberfläche'];

  // ── Helfer ──
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, [a, b]) => clamp((p - a) / (b - a));
  const ease = t => t * t * (3 - 2 * t);
  const kf = (p, pts) => {
    if (p <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (p <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, ease((p - a) / (b - a))); }
    }
    return pts[pts.length - 1][1];
  };
  let s = 11; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;

  // ── Bausteine ──
  const worker = id => `
  <g id="${id}" opacity="0"><g class="flip">
    <rect x="-10" y="-50" width="9" height="50" fill="#e8641a"/><rect x="1" y="-50" width="9" height="50" fill="#e8641a"/>
    <rect x="-10" y="-22" width="9" height="4" fill="#d6d8da"/><rect x="1" y="-22" width="9" height="4" fill="#d6d8da"/>
    <rect x="-11" y="-5" width="14" height="5" rx="1" fill="#0d0d0e"/><rect x="0" y="-5" width="14" height="5" rx="1" fill="#0d0d0e"/>
    <g class="torso">
      <rect x="-12" y="-46" width="24" height="49" rx="5" fill="#d9e63a"/>
      <rect x="-12" y="-24" width="24" height="5" fill="#b4b8bb"/><rect x="-12" y="-13" width="24" height="5" fill="#b4b8bb"/>
      <circle cx="2" cy="-57" r="9.5" fill="#c99672"/>
      <path d="M-9 -58a11 11 0 0 1 22 0h5v3.4h-27z" fill="#f1f1ed"/>
      <g class="arm"><rect x="-4.5" y="-3" width="9" height="38" rx="4.5" fill="#c3d02c"/><g class="tool" opacity="0"><path d="M0 26V82" stroke="#8a6b45" stroke-width="3.2" stroke-linecap="round"/><path d="M-7 80h14l-2 15h-10z" fill="#9aa0a6"/></g></g>
    </g>
  </g></g>`;

  const barrier = (x, i) => `
  <g class="bar-el" data-i="${i}" transform="translate(${x},${G})">
    <rect x="6" y="-4" width="26" height="4" fill="#26282b"/><rect x="88" y="-4" width="26" height="4" fill="#26282b"/>
    <rect x="16" y="-58" width="5" height="56" fill="#aeb1b4"/><rect x="99" y="-58" width="5" height="56" fill="#aeb1b4"/>
    <rect x="4" y="-52" width="112" height="30" rx="2" fill="#f3f3f1"/>
    <rect x="4" y="-52" width="28" height="30" fill="#d0110f"/><rect x="60" y="-52" width="28" height="30" fill="#d0110f"/>
    ${i % 3 === 0 ? `<circle class="beacon" cx="18.5" cy="-66" r="6" fill="#ffb100"/>` : ''}
  </g>`;

  const house = (h, i) => {
    const { x, w, h: ht } = h, top = 500 - ht;
    let win = '';
    const rows = ht > 140 ? 3 : 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < 4; c++) {
      if (r === rows - 1 && c === 1) continue; // Tür
      win += `<rect class="win" data-h="${i}" x="${x + 22 + c * 40}" y="${top + 20 + r * 44}" width="22" height="26" fill="#9db3c0"/>`;
    }
    const roof = i % 2 ? `<path d="M${x - 6} ${top}L${x + w / 2} ${top - 40}L${x + w + 6} ${top}z" fill="#59606a"/>` : `<rect x="${x - 4}" y="${top - 8}" width="${w + 8}" height="8" fill="#59606a"/>`;
    return `<g>${roof}<rect x="${x}" y="${top}" width="${w}" height="${ht}" fill="${['#efe9dd', '#e6ded0', '#f1ece3', '#e3dccf', '#ece5d8'][i]}"/>${win}
      <rect x="${x + 62}" y="${500 - 40}" width="22" height="40" fill="#4d535a"/>
      <rect class="hup" data-h="${i}" x="${x + 92}" y="${500 - 20}" width="8" height="11" fill="#b4b9bd"/></g>`;
  };

  const tree = x => `<g stroke="#6f5d4c" stroke-linecap="round" fill="none"><path d="M${x} 500V398" stroke-width="7"/><path d="M${x} 440l-26-44M${x} 424l30-48M${x} 404l-14-40M${x} 410l18-30M${x - 26} 396l-10-22M${x + 30} 376l4-24" stroke-width="3.5"/></g>`;

  // ── Szene aufbauen ──
  let far = '';
  for (let x = -900; x < 3300;) { const w = 90 + rnd() * 150, h = 150 + rnd() * 150; far += `<rect x="${x | 0}" y="${(500 - h) | 0}" width="${(w + 2) | 0}" height="${(h + 2) | 0}"/>`; x += w; }
  let stones = '';
  for (let i = 0; i < 90; i++) { const x = -400 + rnd() * 3200, y = 600 + rnd() * 380, r = 2 + rnd() * 5; stones += `<ellipse cx="${x | 0}" cy="${y | 0}" rx="${r.toFixed(1)}" ry="${(r * .6).toFixed(1)}"/>`; }
  let pavers = '';
  for (let i = 0; i < NP; i++) pavers += `<rect class="pv" x="${TX0 + i * PV + 1}" y="${G}" width="${PV - 2}" height="17" fill="${i % 2 ? '#a6abb0' : '#989da2'}"/>`;
  let barriers = '';
  for (let i = 0, x = TX0 - 10; x < TX1 - 60; i++, x += 124) barriers += barrier(x, i);
  let stack = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) stack += `<rect class="stk" data-n="${r * 3 + c}" x="${478 + c * 24}" y="${G - 14 - r * 11}" width="22" height="9" fill="${(r + c) % 2 ? '#a6abb0' : '#989da2'}"/>`;
  const pipeYs = [697, 690, 683, 676], pipeCols = ['#ff6a13', '#ff6a13', '#2fa866', '#2f7de1'];
  const pipeD = y => `M${TX0 + 8} ${y}L${TX1 - 12} ${y}`;
  const feedD = y => `M592 ${G - 54}C${TX0 + 6} ${G - 54} ${TX0 - 10} ${y} ${TX0 + 60} ${y}`;
  const pipes = pipeYs.map((y, i) => `<path class="pipe" d="${pipeD(y)}" pathLength="1" stroke="${pipeCols[i]}" stroke-width="5" stroke-linecap="round" fill="none" stroke-dasharray="1" stroke-dashoffset="1"/>`).join('');
  const conns = HOUSES.map((h, i) => `<path class="conn" data-h="${i}" d="M${h.x + 96} ${pipeYs[1]}V${G + 18}" pathLength="1" stroke="#ff6a13" stroke-width="3" fill="none" stroke-dasharray="1" stroke-dashoffset="1"/>`).join('');

  svg.innerHTML = `
  <defs>
    <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9dde9"/><stop offset=".7" stop-color="#e4eef3"/><stop offset="1" stop-color="#f4f2ea"/></linearGradient>
    <linearGradient id="gSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b543f"/><stop offset="1" stop-color="#3b2d21"/></linearGradient>
    <radialGradient id="gGlow"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".2"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gLamp"><stop offset="0" stop-color="#ffd88a" stop-opacity="0"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient>
    <pattern id="pPave" width="40" height="17" patternUnits="userSpaceOnUse"><rect width="40" height="17" fill="#868b90"/><rect x="1" width="38" height="17" fill="#a0a5aa"/></pattern>
    <pattern id="pChev" width="26" height="14" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><rect width="26" height="14" fill="#e9e9e6"/><rect width="13" height="14" fill="#c8110f"/></pattern>
  </defs>

  <rect x="-3000" y="-700" width="8400" height="1260" fill="url(#gSky)"/>
  <ellipse id="glow" cx="1200" cy="520" rx="1300" ry="250" fill="url(#gGlow)" opacity="0"/>
  <g fill="#c5d0d7">${far}</g>
  ${[610, 1090, 1750, 1960, 380].map(tree).join('')}
  ${HOUSES.map(house).join('')}
  <rect x="-3000" y="500" width="8400" height="60" fill="#8fae6b"/>
  <rect x="-3000" y="500" width="8400" height="2" fill="#7c9a5b"/>
  <g><rect x="1432" y="372" width="5" height="188" fill="#555b62"/><rect x="1414" y="368" width="26" height="6" rx="2" fill="#555b62"/><circle cx="1418" cy="378" r="46" fill="url(#gLamp)"/><circle cx="1418" cy="376" r="3.5" fill="#e9ecee"/></g>

  <g id="barriers">${barriers}</g>

  <!-- Transporter -->
  <g transform="translate(250,${G})">
    <path d="M0 -16V-92q0-10 10-10h108q8 0 13 7l22 33 26 8q9 3 9 12v42z" fill="#fafaf8"/>
    <path d="M122 -94l20 32h-44v-32z" fill="#23272c"/><rect x="0" y="-36" width="188" height="14" fill="url(#pChev)"/>
    <path d="M22 -80l-12 26h8l4-9h10l-2 9h8l6-26z" fill="#c8110f"/><path d="M46 -80h22l-16 20h14l-2 6h-26l16-20h-10z" fill="#17181b"/>
    <circle cx="38" cy="-14" r="16" fill="#101113"/><circle cx="38" cy="-14" r="7" fill="#3a3d42"/><circle cx="148" cy="-14" r="16" fill="#101113"/><circle cx="148" cy="-14" r="7" fill="#3a3d42"/>
  </g>

  <!-- Boden -->
  <rect x="-3000" y="${G + 17}" width="8400" height="900" fill="url(#gSoil)"/>
  <g fill="none" stroke="#57432f" stroke-width="2" opacity=".7"><path d="M-400 640q300-22 620 4t640-8 620 10 640-6 700 4"/><path d="M-400 780q340 26 660 0t640 12 620-14 640 8 700-6"/></g>
  <g fill="#8a7359" opacity=".7">${stones}</g>
  <rect x="-3000" y="${G}" width="${3000 + TX0}" height="17" fill="url(#pPave)"/>
  <rect x="${TX1}" y="${G}" width="4000" height="17" fill="url(#pPave)"/>
  <rect x="${TX0}" y="${G}" width="${TW}" height="17" fill="#7a6248"/>
  <rect x="-3000" y="${G}" width="8400" height="1.5" fill="#fff" opacity=".07"/>

  <!-- Graben -->
  <rect id="void" x="${TX0}" y="${G}" width="0" height="${TB - G}" fill="#2b2018"/>
  <rect id="voidEdge" x="${TX0}" y="${G}" width="5" height="${TB - G}" fill="#8a6f52" opacity="0"/>
  <rect id="bed" x="${TX0}" y="${TB - 12}" width="0" height="12" fill="#dcc393"/>
  <rect id="fillSand" x="${TX0}" y="${TB}" width="${TW}" height="0" fill="#cdb283"/>
  <rect id="fillSoil" x="${TX0}" y="${TB}" width="${TW}" height="0" fill="#5d4836"/>
  <path id="tape" d="M${TX0 + 6} 636H${TX1 - 6}" stroke="#f2c21d" stroke-width="3" stroke-dasharray="22 9" opacity="0"/>
  <g id="staff" opacity="0" transform="translate(${TX0 + 34},0)">
    <rect x="-4" y="${G - 46}" width="8" height="${TB - G + 46}" fill="#ecece8"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="-4" y="${TB - 18 - i * 33}" width="8" height="16" fill="#c8110f"/>`).join('')}
    <rect x="-26" y="${G - 4}" width="60" height="5" fill="#ecece8"/>
    <text x="14" y="${TB - 8}" font-family="Plex Mono,monospace" font-size="15" fill="#ecece8" opacity=".85">−0,60</text>
  </g>

  <!-- Hausanschlüsse + Leerrohre + Licht -->
  <g>${conns}</g>
  <g>${pipes}</g>
  <g id="feed" opacity="0" fill="none" stroke-width="5" stroke-linecap="round">${pipeYs.map((y, i) => `<path d="${feedD(y)}" stroke="${pipeCols[i]}"/>`).join('')}</g>
  <g id="light" opacity="0">
    <path d="${pipeD(pipeYs[0])}" pathLength="1" stroke="#ff7a2a" stroke-width="13" stroke-linecap="round" fill="none" opacity=".22"/>
    <path class="pulse" d="${pipeD(pipeYs[0])}" pathLength="1" stroke="#fff4dc" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path class="pulse" d="${pipeD(pipeYs[2])}" pathLength="1" stroke="#eafff2" stroke-width="2" stroke-linecap="round" fill="none" style="animation-duration:2.1s"/>
  </g>

  <!-- Pflaster -->
  <g id="pavers">${pavers}</g>
  <g id="stack"><rect x="472" y="${G - 4}" width="82" height="4" fill="#6b5236"/>${stack}</g>

  <!-- Kabeltrommel -->
  <g id="drum" opacity="0" transform="translate(592,${G - 40})">
    <path d="M-30 40L0 -4L30 40" stroke="#3a3d42" stroke-width="5" fill="none"/>
    <g id="drumRot"><circle r="38" fill="#7a5c3a"/><circle r="38" fill="none" stroke="#5c442a" stroke-width="5"/><circle r="22" fill="#ff6a13"/><circle r="8" fill="#2a2c30"/><path d="M-36 0H36M0 -36V36" stroke="#5c442a" stroke-width="4"/></g>
  </g>

  <!-- Spleiß-/Messkoffer -->
  <g id="splice" opacity="0" transform="translate(${TX1 - 96},${G})"><rect x="-22" y="-26" width="44" height="26" rx="3" fill="#2a2d31"/><rect x="-16" y="-21" width="22" height="13" fill="#0c3b2a"/><path d="M-13 -12l5-5 4 4 6-6" stroke="#49e39a" stroke-width="1.6" fill="none"/><circle class="beacon" cx="14" cy="-15" r="2.6" fill="#49e39a"/></g>

  ${worker('wA')}
  ${worker('wB')}

  <!-- Rüttelplatte -->
  <g id="comp" opacity="0"><g class="shake"><rect x="-24" y="-8" width="48" height="8" rx="2" fill="#4a4d52"/><rect x="-15" y="-32" width="28" height="24" rx="3" fill="#c8110f"/><rect x="-9" y="-40" width="10" height="8" fill="#2a2c30"/><path d="M12 -28L44 -76" stroke="#2a2c30" stroke-width="4.5" stroke-linecap="round"/></g></g>

  <!-- Minibagger -->
  <g id="exc">
    <g id="boom"><path d="M2 -11L-166 -7L-166 7L2 12z" fill="#f4b942"/><path d="M-20 14L-118 4" stroke="#8d9196" stroke-width="5" stroke-linecap="round"/>
      <g id="stick" transform="translate(-162,0)"><path d="M-9 -16H9L6 128H-6z" fill="#e2a52f"/><path d="M10 -6L4 70" stroke="#8d9196" stroke-width="4" stroke-linecap="round"/>
        <g id="bucket" transform="translate(0,126)"><path d="M-12 -8H16L24 12Q12 36-20 28z" fill="#26282c"/><path d="M-20 28l-5 9 9-5zM-9 31l-3 9 9-6zM3 30l0 9 8-7z" fill="#8d9196"/></g>
      </g>
    </g>
    <rect x="-80" y="-34" width="160" height="34" rx="17" fill="#141518"/><rect x="-74" y="-28" width="148" height="22" rx="11" fill="none" stroke="#2c2e32" stroke-width="3"/>
    ${[-58, -20, 20, 58].map(x => `<circle cx="${x}" cy="-17" r="8" fill="#2c2e32"/>`).join('')}
    <rect x="-30" y="-46" width="60" height="12" fill="#1f2124"/>
    <path d="M-60 -46H68V-80q0-10-10-10H-60z" fill="#f4b942"/><rect x="46" y="-86" width="26" height="40" rx="7" fill="#d79c28"/>
    <path d="M-42 -88V-150q0-8 8-8h48q8 0 8 8v62z" fill="#1c1e21"/><path d="M-36 -92V-146q0-6 6-6h38v60z" fill="#6f8d9c" opacity=".42"/>
    <rect x="-22" y="-116" width="22" height="26" rx="4" fill="#e8641a"/><circle cx="-12" cy="-126" r="8.5" fill="#c99672"/><path d="M-22 -127a10 10 0 0 1 20 0h-24v-3z" fill="#f1f1ed"/>
    <circle class="beacon" cx="0" cy="-163" r="5" fill="#ffb100"/>
  </g>`;

  // ── Referenzen ──
  const $ = s => svg.querySelector(s), $$ = s => [...svg.querySelectorAll(s)];
  const el = {
    void: $('#void'), voidEdge: $('#voidEdge'), bed: $('#bed'), fillSand: $('#fillSand'), fillSoil: $('#fillSoil'), tape: $('#tape'), staff: $('#staff'),
    exc: $('#exc'), boom: $('#boom'), stick: $('#stick'), bucket: $('#bucket'),
    drum: $('#drum'), feed: $('#feed'), drumRot: $('#drumRot'), light: $('#light'), glow: $('#glow'), splice: $('#splice'), comp: $('#comp'),
    pavers: $$('.pv'), stack: $$('.stk'), bars: $$('.bar-el'), pipes: $$('.pipe'), conns: $$('.conn'), wins: $$('.win'), hups: $$('.hup'),
  };
  const mkWorker = id => { const g = $('#' + id); return { g, flip: g.querySelector('.flip'), torso: g.querySelector('.torso'), arm: g.querySelector('.arm'), tool: g.querySelector('.tool') }; };
  const wA = mkWorker('wA'), wB = mkWorker('wB');
  const setWorker = (w, x, dir, lean, arm, op, tool = 0) => {
    w.g.setAttribute('opacity', op);
    if (op <= 0) return;
    w.g.setAttribute('transform', `translate(${x.toFixed(1)},${G}) scale(1.16)`);
    w.flip.setAttribute('transform', `scale(${dir},1)`);
    w.torso.setAttribute('transform', `translate(0,-50) rotate(${lean.toFixed(1)})`);
    w.arm.setAttribute('transform', `translate(2,-38) rotate(${arm.toFixed(1)})`);
    w.tool.setAttribute('opacity', tool);
  };

  const ui = {
    intro: document.getElementById('intro'), outro: document.getElementById('outro'), caps: [...document.querySelectorAll('.cap')],
    hud: document.getElementById('hud'), rail: document.getElementById('rail'), railSegs: [...document.querySelectorAll('#rail i')],
    hint: document.getElementById('hint'), phase: document.getElementById('hudPhase'), depth: document.getElementById('hudDepth'), prog: document.getElementById('hudProg'),
  };

  // ── Kamera ──
  let vw = 1, vh = 1;
  const camera = p => {
    const aspect = vw / vh, narrow = aspect < 0.8;
    const VH = narrow ? 820 : 900, y0 = narrow ? 40 : -70;
    const w = VH * aspect;
    let cx = 1200;
    if (w < 1440) {
      const d = seg(p, T.dig), c = seg(p, T.pipe), u = seg(p, T.pave);
      let f;
      if (p < T.dig[0]) f = kf(p, [[0, 1200], [.05, 1200], [.12, TX0 + 70]]);
      else if (p < T.dig[1]) f = TX0 + TW * d + 60;
      else if (p < T.pipe[0]) f = kf(p, [[.40, TX1 + 60], [.44, TX0 - 20]]);
      else if (p < T.pipe[1]) f = TX0 - 20 + (TW + 20) * c;
      else if (p < T.fibre[1]) f = kf(p, [[.62, TX1], [.64, TX1 - 100], [.78, TX0 + 120]]);
      else if (p < T.pave[0]) f = kf(p, [[.78, TX0 + 120], [.84, TX1 - 40]]);
      else if (p < T.pave[1]) f = TX1 - 40 - (TW - 80) * u;
      else f = kf(p, [[.93, TX0 + 40], [1, 1200]]);
      const lo = 440 + w / 2, hi = 1960 - w / 2;
      cx = lo < hi ? clamp(f, lo, hi) : 1200;
    }
    svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(1)} ${y0} ${w.toFixed(1)} ${VH}`);
  };

  // ── Ein Frame ──
  let lastPhase = -2;
  const render = p => {
    camera(p);
    const d = seg(p, T.dig), c = seg(p, T.pipe), f = seg(p, T.fibre), b = seg(p, T.fill), u = seg(p, T.pave);
    const front = TX0 + TW * d;                     // Aushub-Front (→)
    const back = TX1 - TW * u;                      // Pflaster-Front (←)

    // Absperrung
    const bin = seg(p, [.02, .11]), bout = seg(p, T.clear);
    el.bars.forEach((g, i) => {
      const n = el.bars.length, a = ease(clamp(bin * 2 - i / n)), z = ease(clamp(bout * 2 - (n - 1 - i) / n));
      const o = a * (1 - z);
      g.setAttribute('opacity', o.toFixed(2));
      g.setAttribute('transform', `translate(${TX0 - 10 + i * 124},${G - (1 - a) * 46 - z * 46})`);
    });

    // Pflaster aufnehmen / wieder setzen
    let lifted = 0;
    el.pavers.forEach((r, i) => {
      const cx = TX0 + i * PV + PV / 2;
      const up = clamp((TX0 - 70 + (TW + 140) * d - cx) / 60) * (d > 0 ? 1 : 0);
      const down = clamp((cx - (TX1 + 70 - (TW + 140) * u)) / 60) * (u > 0 ? 1 : 0);
      const st = up * (1 - down);
      lifted += st;
      r.setAttribute('transform', `translate(0,${(-64 * Math.sin(st * Math.PI / 2)).toFixed(1)})`);
      r.setAttribute('opacity', (1 - st * st).toFixed(2));
    });
    const stk = lifted / NP * el.stack.length;
    el.stack.forEach((r, i) => r.setAttribute('opacity', clamp(stk - i).toFixed(2)));

    // Graben
    const vwid = Math.max(0, front - TX0);
    el.void.setAttribute('width', vwid.toFixed(1));
    el.voidEdge.setAttribute('x', (front - 5).toFixed(1));
    el.voidEdge.setAttribute('opacity', d > 0 && d < 1 ? .8 : 0);
    el.staff.setAttribute('opacity', (ease(seg(p, [.17, .2])) * (1 - seg(p, [.775, .79]))).toFixed(2));
    el.bed.setAttribute('width', (TW * ease(seg(p, T.bed))).toFixed(1));

    // Verfüllen
    const hs = 46 * ease(clamp(b / .45)), hsoil = (TB - 46 - G - 17) * ease(clamp((b - .3) / .7));
    el.fillSand.setAttribute('y', TB - hs); el.fillSand.setAttribute('height', hs.toFixed(1));
    el.fillSoil.setAttribute('y', TB - 46 - hsoil); el.fillSoil.setAttribute('height', hsoil.toFixed(1));
    el.tape.setAttribute('opacity', clamp((b - .35) * 6) * (hsoil > 30 ? .0 : 1) + (hsoil > 30 ? .55 : 0));

    // Bagger
    let ex;
    if (p < T.dig[0]) ex = lerp(2700, TX0 + 150, 1 - Math.pow(1 - seg(p, T.excIn), 3));
    else if (p < T.dig[1]) ex = front + 150;
    else ex = lerp(TX1 + 150, 2800, Math.pow(seg(p, T.excOut), 2));
    const digOn = ease(seg(p, [.12, .145])) * (1 - ease(seg(p, [.385, .41])));
    const k = (1 - Math.cos(d * Math.PI * 2 * 9)) / 2;
    const a1 = lerp(34, lerp(28, -32, k), digOn);
    const th = lerp(-14, lerp(50, 0, k), digOn);
    const a3 = lerp(-50, lerp(-30, 45, k), digOn);
    const moving = p < T.dig[0] || p > T.dig[1];
    el.exc.setAttribute('transform', `translate(${ex.toFixed(1)},${(G + (moving ? Math.sin(ex * .5) * .8 : 0)).toFixed(1)})`);
    el.boom.setAttribute('transform', `translate(-52,-84) rotate(${a1.toFixed(1)})`);
    el.stick.setAttribute('transform', `translate(-162,0) rotate(${(th - a1).toFixed(1)})`);
    el.bucket.setAttribute('transform', `translate(0,126) rotate(${a3.toFixed(1)})`);

    // Leerrohre + Trommel
    el.pipes.forEach((ln, i) => ln.setAttribute('stroke-dashoffset', (1 - clamp(c * 1.12 - i * .04)).toFixed(4)));
    el.drum.setAttribute('opacity', (ease(seg(p, [.40, .44])) * (1 - ease(seg(p, [.63, .67])))).toFixed(2));
    el.feed.setAttribute('opacity', (clamp(c * 30) * (1 - ease(seg(p, [.63, .67])))).toFixed(2));
    el.drumRot.setAttribute('transform', `rotate(${(c * 1900).toFixed(1)})`);

    // Glasfaser
    el.light.setAttribute('opacity', ease(clamp(f * 5)).toFixed(2));
    el.glow.setAttribute('opacity', ease(clamp((f - .2) * 1.6)).toFixed(2));
    el.splice.setAttribute('opacity', (ease(seg(p, [.615, .64])) * (1 - ease(seg(p, [.80, .83])))).toFixed(2));
    const n = HOUSES.length;
    const lit = HOUSES.map((_, i) => { const j = n - 1 - i; return clamp((f - .12 - j * .15) / .16); });
    el.conns.forEach(cn => cn.setAttribute('stroke-dashoffset', (1 - lit[+cn.dataset.h]).toFixed(3)));
    el.wins.forEach((w, i) => w.classList.toggle('lit', lit[+w.dataset.h] >= 1 && (i * 7) % 5 !== 0));
    el.hups.forEach(h => h.setAttribute('fill', lit[+h.dataset.h] >= 1 ? '#12a35f' : '#b4b9bd'));

    // Arbeiter A: Schaufel → später Rüttelplatte
    if (p < T.excOut[1]) {
      const x = p < T.dig[0] ? kf(p, [[.05, 430], [.12, TX0 - 40]]) : p < T.dig[1] ? Math.max(TX0 - 40, front - 250) : kf(p, [[.40, TX1 - 250], [.48, 2500]]);
      const work = digOn, sw = Math.sin(d * Math.PI * 2 * 22);
      setWorker(wA, x, 1, lerp(4, 20 + sw * 6, work), lerp(Math.sin(x * .09) * 24, -38 + sw * 20, work), ease(seg(p, [.05, .08])), work > .5 ? 1 : 0);
    } else if (p >= .80) {
      const x = p < T.pave[0] ? kf(p, [[.80, 2400], [.84, TX1 + 60]]) : p < T.pave[1] ? back + 96 : kf(p, [[.93, TX0 + 96], [.99, 400]]);
      const on = p >= T.pave[0] && p < T.pave[1];
      setWorker(wA, x, -1, on ? 12 : 3, on ? -52 : Math.sin(x * .09) * 22, 1);
    } else setWorker(wA, 0, 1, 0, 0, 0);
    const compOn = p >= .80 && p < .955;
    el.comp.setAttribute('opacity', compOn ? (1 - ease(seg(p, [.93, .955]))).toFixed(2) : 0);
    if (compOn) {
      const x = p < T.pave[0] ? kf(p, [[.80, 2350], [.84, TX1 + 6]]) : p < T.pave[1] ? back + 42 : TX0 + 42;
      el.comp.setAttribute('transform', `translate(${x.toFixed(1)},${G})`);
    }

    // Arbeiter B: Leerrohre → Messung → Pflaster
    if (p >= .38) {
      let x, dir = 1, lean = 4, arm = 0;
      if (p < T.pipe[0]) { x = kf(p, [[.38, 430], [.44, TX0 + 40]]); arm = Math.sin(x * .09) * 24; }
      else if (p < T.pipe[1]) { x = TX0 + 40 + (TW - 110) * c; lean = 34 + Math.sin(c * 90) * 5; arm = -30 + Math.sin(c * 90) * 16; }
      else if (p < T.pave[0]) { x = kf(p, [[.62, TX1 - 70], [.65, TX1 - 62]]); lean = kf(p, [[.62, 34], [.65, 22], [.80, 22], [.84, 30]]); arm = -46 + Math.sin(p * 400) * 6; }
      else if (p < T.pave[1]) { x = back - 34; dir = -1; lean = 40 + Math.sin(u * 120) * 8; arm = -24 + Math.sin(u * 120) * 22; }
      else { x = kf(p, [[.93, TX0 - 34], [.99, 330]]); dir = -1; arm = Math.sin(x * .09) * 20; }
      setWorker(wB, x, dir, lean, arm, ease(seg(p, [.38, .41])));
    } else setWorker(wB, 0, 1, 0, 0, 0);

    // ── Texte ──
    let phase = -1;
    PHASES.forEach(([a, z], i) => { if (p >= a && p < z) phase = i; });
    if (p >= T.outro) phase = 5;
    if (reduce) phase = -1;
    if (phase !== lastPhase) {
      lastPhase = phase;
      ui.intro.classList.toggle('on', reduce || p < .085);
      ui.caps.forEach((cEl, i) => cEl.classList.toggle('on', i === phase));
      ui.outro.classList.toggle('on', phase === 5);
      const hudOn = phase >= 0 && phase < 5;
      ui.hud.classList.toggle('on', hudOn); ui.rail.classList.toggle('on', hudOn);
      ui.phase.textContent = hudOn ? `0${phase + 1}/05 ${NAMES[phase]}` : '–';
    }
    ui.intro.classList.toggle('on', reduce || p < .085);
    ui.hint.classList.toggle('off', p > .02);
    ui.railSegs.forEach((sEl, i) => sEl.style.setProperty('--f', seg(p, PHASES[i]).toFixed(3)));
    const depth = .6 * clamp(d * 9) * (1 - ease(clamp(b / .9)));
    ui.depth.textContent = (depth > 0.005 ? '−' : '') + depth.toFixed(2).replace('.', ',') + ' m';
    ui.prog.textContent = Math.round(seg(p, [.10, T.outro]) * 100) + ' %';
  };

  // ── Scroll → Fortschritt (geglättet) ──
  let target = 0, cur = -1, raf = 0;
  const measure = () => {
    const st = svg.parentElement; vw = st.clientWidth; vh = st.clientHeight;
    const range = hero.offsetHeight - innerHeight;
    target = reduce ? 1 : range > 0 ? clamp((scrollY - hero.offsetTop) / range) : 0;
  };
  const tick = () => {
    raf = 0;
    if (cur < 0) cur = target;
    const diff = target - cur;
    cur = Math.abs(diff) < .0004 ? target : cur + diff * .16;
    render(cur);
    if (cur !== target) raf = requestAnimationFrame(tick);
  };
  const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { measure(); cur = target; render(cur); });
  measure(); cur = target; render(cur);
  window.__azScene = { render, set: v => { target = cur = v; render(v); } };
})();
