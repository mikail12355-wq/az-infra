/* AZ-Infra — Seitenlogik (Navigation, Einblendungen, Zähler, Formular, Video) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Kopfzeile
  const top = $('#top'), hero = $('#hero');
  const onScroll = () => top.classList.toggle('solid', scrollY > hero.offsetHeight - innerHeight * 0.9);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobiles Menü
  const burger = $('#burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // Zähler
  const fmt = (v, dec) => v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const count = el => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    if (reduce) { el.textContent = fmt(to, dec); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(to * e, dec);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Einblenden beim Scrollen
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // Baustellen-Video: läuft stumm, sobald es im Bild ist, und pausiert außerhalb
  const reelVideo = $('#reelVideo');
  if (reelVideo && !reduce) {
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) reelVideo.play().catch(() => {});
      else reelVideo.pause();
    }), { threshold: 0.5 }).observe(reelVideo);
  }

  // Kontaktformular → E-Mail-Programm
  const form = $('#form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const body = [
      `Name: ${d.get('name')}`, `Stadt/PLZ: ${d.get('ort') || '–'}`,
      `Telefon: ${d.get('tel') || '–'}`, `E-Mail: ${d.get('email')}`, '', d.get('msg'),
    ].join('\n');
    location.href = `mailto:kontakt@az-infra.de?subject=${encodeURIComponent('Anfrage über az-infra.de')}&body=${encodeURIComponent(body)}`;
    $('#formNote').textContent = 'Ihr E-Mail-Programm wurde geöffnet – bitte dort auf „Senden“ klicken.';
  });

  $('#year').textContent = new Date().getFullYear();
})();
