#!/usr/bin/env bash
# Диагностика LCP: тот же мобильный профиль, но с prefers-reduced-motion (анимации появления выключены CSS сайта).
cd "$(dirname "$0")"
export CHROME_PATH=/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome
for i in 1 2 3; do
  ./node_modules/.bin/lighthouse http://localhost:3100/ --quiet --chrome-flags="--headless=new --no-sandbox --force-prefers-reduced-motion" --only-categories=performance --output=json --output-path=lh/diag-mobile-reduced-$i.json && echo "diag $i ok"
done
node -e "
const med = (a) => [...a].sort((x, y) => x - y)[1]
const rs = [1,2,3].map(i => require('./lh/diag-mobile-reduced-' + i + '.json'))
const g = (r, id) => r.audits[id].numericValue
console.log('reduced-motion mobile: perf', med(rs.map(r => r.categories.performance.score * 100)), 'LCP', Math.round(med(rs.map(r => g(r, 'largest-contentful-paint')))), 'FCP', Math.round(med(rs.map(r => g(r, 'first-contentful-paint')))), 'TBT', Math.round(med(rs.map(r => g(r, 'total-blocking-time')))), 'SI', Math.round(med(rs.map(r => g(r, 'speed-index')))))
for (const r of rs) { const d = r.audits['lcp-breakdown-insight'].details.items; console.log(' LCP el:', d.find(i => i.type === 'node')?.selector, JSON.stringify(d.find(i => i.type === 'table')?.items.map(p => p.label + ' ' + Math.round(p.duration)))) }
"
