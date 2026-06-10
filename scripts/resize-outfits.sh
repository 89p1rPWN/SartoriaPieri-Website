#!/usr/bin/env bash
# Generates web-sized (max edge 1024px, q72) copies of the numbered outfit
# photos for use as WebGL textures. Originals stay untouched and are used
# by the lightbox.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/campaign-landing/public/outfits"
DST="$ROOT/campaign-landing/public/outfits-web"

for dir in "$SRC"/*/; do
  sin="$(basename "$dir")"
  mkdir -p "$DST/$sin"
  for f in "$dir"*.jpg; do
    out="$DST/$sin/$(basename "$f")"
    magick "$f" -resize '1024x1024>' -quality 72 "$out"
    echo "wrote $out"
  done
done
