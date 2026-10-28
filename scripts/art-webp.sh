#!/usr/bin/env bash
# Regenerates the responsive WebP variants beside every art JPEG.
#
# The source photographs are 2688x1520 and were being served to a 390px phone unchanged: the
# Today hero alone was 605KB, and it is the LCP element. The variants are committed, so the
# build and the deploy need nothing extra - only this script needs cwebp, and only when the
# art itself changes.
#
#   brew install webp   # if cwebp is missing
#   ./scripts/art-webp.sh
set -euo pipefail
command -v cwebp >/dev/null || { echo "cwebp not found: brew install webp"; exit 1; }
cd "$(dirname "$0")/../apps/web/public/art"
made=0
while IFS= read -r src; do
  base="${src%.jpg}"
  for w in 800 1600; do
    out="${base}-${w}.webp"
    # Skip when the variant is already newer than its source.
    if [ -f "$out" ] && [ "$out" -nt "$src" ]; then continue; fi
    cwebp -quiet -q 82 -resize "$w" 0 "$src" -o "$out"
    made=$((made + 1))
  done
done < <(find . -name "*.jpg" | sort)
echo "wrote $made variants"
du -sh .
