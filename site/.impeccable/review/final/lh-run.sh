#!/usr/bin/env bash
# Lighthouse по /: мобильный и десктоп вперемешку, по N прогонов (по умолчанию 3), префикс файлов — $1.
set -u
cd "$(dirname "$0")"
MODS=${MODS:-/tmp/claude-1001/-home-coder-novi/bfc0bfb6-05b9-4e57-869a-a26cb55cba25/scratchpad/final/node_modules}
export CHROME_PATH=/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome
PREFIX=${1:-a}
N=${2:-3}
mkdir -p lh
FLAGS=(--quiet --chrome-flags="--headless=new --no-sandbox" --output=json --only-categories=performance,accessibility,best-practices,seo)
for i in $(seq 1 "$N"); do
  "$MODS/.bin/lighthouse" http://localhost:3100/ "${FLAGS[@]}" --output-path="lh/$PREFIX-mobile-$i.json" && echo "mobile $i ok"
  "$MODS/.bin/lighthouse" http://localhost:3100/ "${FLAGS[@]}" --preset=desktop --output-path="lh/$PREFIX-desktop-$i.json" && echo "desktop $i ok"
done
echo DONE
