# AZ-Infra – Website

Statische Website der AZ-Infra GmbH (Glasfaserausbau, Tief- und Leitungsbau).
Kein Build nötig: `index.html` und der Ordner `assets/` genügen.

## Lokal ansehen

```bash
python3 -m http.server 4173
```

Danach http://localhost:4173 öffnen.

## Aufbau

- `index.html` – alle Inhalte der Seite
- `assets/style.css` – Gestaltung (Farben stehen oben als Variablen)
- `assets/scene.js` – scroll-gesteuerte Baustellen-Animation im Einstieg
- `assets/main.js` – Navigation, Zähler, Video, Kontaktformular
- `assets/video-hero.js`, `tools/video-einbauen.sh` – optionaler Einstieg mit echtem Video statt Animation (standardmäßig aus)
