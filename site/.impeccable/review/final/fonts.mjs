// Шрифты на /: какие файлы и когда грузятся (без прокрутки и после прокрутки до низа), что предзагружено. Chromium.
import { readdirSync, statSync } from 'node:fs'
import { BASE, launch, save, scrollThrough, sleep } from './lib.mjs'

const MEDIA = '/tmp/claude-1001/-home-coder-novi/bfc0bfb6-05b9-4e57-869a-a26cb55cba25/scratchpad/serve-3100/.next/static/media'
const files = Object.fromEntries(readdirSync(MEDIA).filter((f) => f.endsWith('.woff2')).map((f) => [f, statSync(`${MEDIA}/${f}`).size]))
const html = await (await fetch(BASE + '/')).text()
const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+\.woff2)"[^>]*>/g)].map((m) => m[1].split('/').pop())

const out = { files, preloads, runs: {} }
const browser = await launch()
for (const [w, h] of [
  [390, 844],
  [1440, 900],
]) {
  const context = await browser.newContext({ viewport: { width: w, height: h } })
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(4000)
  const list = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((r) => r.name.endsWith('.woff2'))
        .map((r) => ({ file: r.name.split('/').pop(), startMs: Math.round(r.startTime), endMs: Math.round(r.responseEnd), transfer: r.transferSize, body: r.encodedBodySize, initiator: r.initiatorType })),
    )
  const atLoad = await list()
  const faces = await page.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`))
  await scrollThrough(page)
  await sleep(1500)
  const afterScroll = await list()
  out.runs[w] = { atLoad, afterScroll, faces, atLoadKB: +(atLoad.reduce((s, r) => s + r.body, 0) / 1024).toFixed(1), afterScrollKB: +(afterScroll.reduce((s, r) => s + r.body, 0) / 1024).toFixed(1) }
  console.log(w, 'без прокрутки:', atLoad.map((r) => `${r.file.slice(0, 32)} ${(r.body / 1024).toFixed(1)} КБ ${r.startMs}–${r.endMs} мс (${r.initiator})`).join(' | '))
  console.log('   после прокрутки:', afterScroll.length, 'файлов,', out.runs[w].afterScrollKB, 'КБ; FontFace:', faces.join(', '))
  await context.close()
}
await browser.close()
console.log('на диске:', JSON.stringify(files), '\nпредзагрузка:', preloads.join(', '))
save('fonts/results.json', out)
