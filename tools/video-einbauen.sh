#!/bin/bash
# Zerlegt ein Video in Einzelbilder für den Scroll-Einstieg der Startseite.
# Aufruf:  tools/video-einbauen.sh /pfad/zum/video.mp4 [Bilder pro Sekunde, Standard 6]
# Zurück zur Illustration:  tools/video-einbauen.sh --aus
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$DIR/assets/frames"
mkdir -p "$OUT"
rm -f "$OUT"/f_*.jpg

if [ "${1:-}" = "--aus" ] || [ -z "${1:-}" ]; then
  echo "window.AZ_FRAMES = { count: 0 };" > "$OUT/manifest.js"
  echo "Video-Einstieg aus – die Seite zeigt wieder die Illustration."
  exit 0
fi

IN="$1"; FPS="${2:-6}"
# längere Kante 960 px, damit auch Querformat-Videos passen
ffmpeg -v error -y -i "$IN" -an \
  -vf "fps=$FPS,scale='if(gt(iw,ih),960,-2)':'if(gt(iw,ih),-2,960)':flags=lanczos" \
  -q:v 11 "$OUT/f_%04d.jpg"

COUNT=$(ls "$OUT"/f_*.jpg | wc -l | tr -d ' ')
SIZE=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$OUT/f_0001.jpg")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
cat > "$OUT/manifest.js" <<EOF
window.AZ_FRAMES = { count: $COUNT, w: ${SIZE%x*}, h: ${SIZE#*x}, ext: "jpg", duration: $DUR };
EOF
echo "$COUNT Bilder (${SIZE}) erzeugt, $(du -sh "$OUT" | cut -f1) gesamt."
