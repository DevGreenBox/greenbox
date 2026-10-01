#!/usr/bin/env bash
# Добор мобильных прогонов, пока в каждом режиме первого кадра (задержан / сразу) не наберётся по 3 (не больше 9 прогонов).
set -u
cd "$(dirname "$0")"
MODS=${MODS:-/tmp/claude-1001/-home-coder-novi/bfc0bfb6-05b9-4e57-869a-a26cb55cba25/scratchpad/final/node_modules}
export CHROME_PATH=/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome
count() { node -e "
const fs=require('fs');let d=0,i=0;for(const f of fs.readdirSync('lh').filter(f=>/^[ab]-mobile-\d+\.json$/.test(f))){const r=JSON.parse(fs.readFileSync('lh/'+f));(r.audits.metrics.details.items[0].observedFirstContentfulPaint>700?d++:i++)}console.log(d+' '+i)"; }
for n in $(seq 1 9); do
  read d i < <(count)
  echo "задержан $d, сразу $i"
  if [ "$d" -ge 3 ] && [ "$i" -ge 3 ]; then break; fi
  "$MODS/.bin/lighthouse" http://localhost:3100/ --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --only-categories=performance,accessibility,best-practices,seo --output-path="lh/b-mobile-$n.json" && echo "b-mobile $n ok"
done
echo DONE
