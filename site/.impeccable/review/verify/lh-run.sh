#!/usr/bin/env bash
# Lighthouse: по 3 прогона мобильного (по умолчанию) и десктопного профиля по /, потом a11y-прогоны прочих страниц.
set -u
cd "$(dirname "$0")"
export CHROME_PATH=/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome
LH=./node_modules/.bin/lighthouse
FLAGS=(--quiet --chrome-flags="--headless=new --no-sandbox" --output=json)
CATS=--only-categories=performance,accessibility,best-practices,seo
for i in 1 2 3; do
  $LH http://localhost:3100/ "${FLAGS[@]}" $CATS --output-path=lh/lh-mobile-$i.json && echo "mobile $i ok"
done
for i in 1 2 3; do
  $LH http://localhost:3100/ "${FLAGS[@]}" $CATS --preset=desktop --output-path=lh/lh-desktop-$i.json && echo "desktop $i ok"
done
for p in privacy lead/sent lead/error; do
  n=${p//\//-}
  $LH "http://localhost:3100/$p" "${FLAGS[@]}" --only-categories=accessibility,best-practices,seo --output-path=lh/lh-a11y-$n.json && echo "a11y $p ok"
done
echo DONE
