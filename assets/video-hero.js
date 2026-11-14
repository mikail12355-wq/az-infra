/* AZ-Infra — Scroll-Einstieg mit echtem Baustellen-Video.
   Aktiv, sobald assets/frames/manifest.js Einzelbilder meldet (siehe tools/video-einbauen.sh).
   Ohne Bilder bleibt die gezeichnete Szene aus scene.js aktiv. */
(() => {
  const F = window.AZ_FRAMES, hero = document.getElementById('hero');
  if (!F || !F.count || !hero) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Kapitel: Zeitpunkte im Video (Sekunden) → Text. Hier anpassen, falls der Schnitt abweicht.
  const CHAPTERS = [
    { t: [1, 6],      name: 'Absichern',  h: 'Erst sichern, dann bauen', p: 'Absperrung, Beschilderung, Fahrzeuge und Gerät stehen bereit – erst wenn die Baustelle gesichert ist, geht es los.' },
    { t: [6, 13],     name: 'Team',       h: 'Team und Technik',         p: 'Eigene Fahrzeuge, eigener Maschinenpark, erfahrene Kolonnen: Auf unseren Baustellen sitzt jeder Handgriff.' },
    { t: [13, 17],    name: 'Aushub',     h: 'Graben nach Maß',          p: 'Grabenaushub mit sauberen Kanten in allen Oberflächen und Bodenklassen – eingemessen und dokumentiert.' },
    { t: [17, 19.5],  name: 'Verlegung',  h: 'Leerrohre im Graben',      p: 'Speedpipes und Kabelschutzrohre werden verlegt – die Trasse für das Netz von morgen.' },
    { t: [19.5, 1e9], name: 'Oberfläche', h: 'Als wäre nichts gewesen',  p: 'Verfüllt, verdichtet, wiederhergestellt: Wir hinterlassen die Oberfläche fachgerecht.' },
  ];
  const PLAY = [.05, .93], OUTRO = .945;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, [a, b]) => clamp((p - a) / (b - a));
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  // ── Aufbau ──
  hero.classList.add('video');
  const stage = hero.querySelector('.stage');
  const bg = Object.assign(document.createElement('canvas'), { className: 'vbg', width: 48, height: Math.round(48 * F.h / F.w) });
  const main = Object.assign(document.createElement('canvas'), { className: 'vmain', width: F.w, height: F.h });
  main.setAttribute('role', 'img');
  main.setAttribute('aria-label', 'Video von einer AZ-Infra-Baustelle in Leipzig: Absperrung, Minibagger, Grabenaushub, Leerrohre und wiederhergestellte Oberfläche.');
  bg.setAttribute('aria-hidden', 'true');
  stage.prepend(main); stage.prepend(bg);
  const cMain = main.getContext('2d'), cBg = bg.getContext('2d');
  main.style.setProperty('--ar', F.w / F.h);
  hero.classList.toggle('landscape', F.w > F.h);

  const caps = $$('.cap');
  caps.forEach((el, i) => {
    const c = CHAPTERS[i]; if (!c) return;
    el.innerHTML = `<span class="mono"><span class="num">0${i + 1}</span> ${c.name}</span><h2>${c.h}</h2><p>${c.p}</p>`;
  });
  $('#intro p').textContent = 'Vom Absperren bis zur fertigen Oberfläche: Scrollen Sie durch unsere Baustelle in Leipzig.';
  const hudSpans = $$('#hud span'); if (hudSpans[1]) hudSpans[1].textContent = 'Ort';
  $('#hudDepth').textContent = 'Leipzig';

  // ── Bilder laden (erst grob, dann immer feiner) ──
  const N = F.count, imgs = new Array(N), ready = new Uint8Array(N);
  const order = [];
  for (let step = 16; step >= 1; step >>= 1) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
  let next = 0, shown = -1, want = 0;
  const load = () => {
    if (next >= order.length) return;
    const i = order[next++], im = new Image();
    im.decoding = 'async';
    im.onload = () => { ready[i] = 1; imgs[i] = im; if (shown < 0 || Math.abs(i - want) < Math.abs(shown - want)) draw(want); load(); };
    im.onerror = load;
    im.src = `assets/frames/f_${String(i + 1).padStart(4, '0')}.${F.ext}`;
  };
  for (let k = 0; k < 6; k++) load();

  const draw = i => {
    want = i;
    let j = -1;
    for (let d = 0; d < N; d++) { if (ready[i - d]) { j = i - d; break; } if (ready[i + d]) { j = i + d; break; } }
    if (j < 0 || j === shown) return;
    shown = j;
    cMain.drawImage(imgs[j], 0, 0, main.width, main.height);
    cBg.drawImage(imgs[j], 0, 0, bg.width, bg.height);
  };

  // ── Texte ──
  const ui = { intro: $('#intro'), outro: $('#outro'), hud: $('#hud'), rail: $('#rail'), segs: $$('#rail i'), hint: $('#hint'), phase: $('#hudPhase'), prog: $('#hudProg') };
  const dur = F.duration || N / 8;
  let lastPhase = -2;
  const render = p => {
    const k = seg(p, PLAY), t = k * dur;
    draw(Math.round(k * (N - 1)));
    let phase = -1;
    if (p >= OUTRO) phase = 5;
    else if (p >= .07) CHAPTERS.forEach((c, i) => { if (t >= c.t[0] && t < c.t[1]) phase = i; });
    if (reduce) phase = -1;
    if (phase !== lastPhase) {
      lastPhase = phase;
      caps.forEach((el, i) => el.classList.toggle('on', i === phase));
      ui.outro.classList.toggle('on', phase === 5);
      const on = phase >= 0 && phase < 5;
      ui.hud.classList.toggle('on', on); ui.rail.classList.toggle('on', on);
      ui.phase.textContent = on ? `0${phase + 1}/05 ${CHAPTERS[phase].name}` : '–';
    }
    ui.intro.classList.toggle('on', reduce || (phase === -1 && p < OUTRO));
    ui.hint.classList.toggle('off', p > .02);
    ui.segs.forEach((el, i) => { const c = CHAPTERS[i]; el.style.setProperty('--f', clamp((t - c.t[0]) / (Math.min(c.t[1], dur) - c.t[0])).toFixed(3)); });
    ui.prog.textContent = Math.round(k * 100) + ' %';
  };

  // ── Scroll → Fortschritt (geglättet) ──
  let target = 0, cur = -1, raf = 0;
  const measure = () => {
    const range = hero.offsetHeight - innerHeight;
    target = reduce ? .5 : range > 0 ? clamp((scrollY - hero.offsetTop) / range) : 0;
  };
  const tick = () => {
    raf = 0;
    if (cur < 0) cur = target;
    const diff = target - cur;
    cur = Math.abs(diff) < .0004 ? target : cur + diff * .18;
    render(cur);
    if (cur !== target) raf = requestAnimationFrame(tick);
  };
  const kick = () => { measure(); if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  measure(); cur = target; render(cur);
})();
