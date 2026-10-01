// Контраст там, где axe на / сказал «не могу определить» (incomplete: элемент за краем ленты, перекрыт, градиент).
// Каждый такой элемент (кроме aria-hidden) выводится в центр экрана, axe color-contrast прогоняется на нём одном;
// если всё ещё incomplete — контраст по пикселям кадра: цвет текста из CSS против самого частого цвета фона в его рамке.
// reduced-motion (статичная раскладка), Chromium, 390 и 1440, обе темы.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { BASE, MODS, launch, save, sleep } from './lib.mjs'

const require = createRequire(import.meta.url)
const sharp = require('/home/coder/novi/render-lab/node_modules/sharp')
const AXE_SRC = readFileSync(`${MODS}/axe-core/axe.min.js`, 'utf8')

const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2)
}

const out = {}
const browser = await launch()
for (const [w, h] of [
  [390, 844],
  [1440, 900],
]) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
    await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(1500)
    await page.evaluate(AXE_SRC)
    const first = await page.evaluate(() => axe.run(document, { runOnly: ['color-contrast'], resultTypes: ['incomplete'] }))
    const nodes = (first.incomplete[0]?.nodes ?? []).map((n) => ({ target: n.target, key: n.any[0]?.data?.messageKey, html: n.html.replace(/\s+/g, ' ').slice(0, 90) }))
    const rows = []
    for (const n of nodes) {
      const info = await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const hidden = !!el.closest('[aria-hidden="true"]')
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
        return { hidden, text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 50), color: getComputedStyle(el).color, size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight }
      }, n.target[0])
      if (!info) continue
      const row = { ...n, ...info }
      if (info.hidden) {
        row.verdict = 'декоративный (aria-hidden)'
        rows.push(row)
        continue
      }
      await sleep(150)
      const again = await page.evaluate((sel) => axe.run({ include: [[sel]] }, { runOnly: ['color-contrast'], resultTypes: ['violations', 'incomplete', 'passes'] }), n.target[0])
      const pick = (list) => list.flatMap((v) => v.nodes).find((x) => x.target[0] === n.target[0])
      const pass = pick(again.passes)
      const fail = pick(again.violations)
      const inc = pick(again.incomplete)
      if (pass || fail) {
        const d = (pass ?? fail).any[0]?.data ?? {}
        row.verdict = pass ? 'axe: пройдено' : 'axe: НАРУШЕНИЕ'
        row.axe = { fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, expected: d.expectedContrastRatio }
      } else {
        // по пикселям: фон — самый частый цвет в рамке элемента
        const box = await page.evaluate((sel) => {
          const r = document.querySelector(sel).getBoundingClientRect()
          return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth - Math.max(0, r.left)), height: Math.min(r.height, innerHeight - Math.max(0, r.top)) }
        }, n.target[0])
        if (box.width < 2 || box.height < 2) {
          row.verdict = 'не в экране'
        } else {
          const buf = await page.screenshot({ clip: box })
          const { data } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
          const freq = new Map()
          for (let i = 0; i < data.length; i += 3) {
            const k = `${data[i]},${data[i + 1]},${data[i + 2]}`
            freq.set(k, (freq.get(k) ?? 0) + 1)
          }
          const bg = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number)
          const fg = info.color.match(/[\d.]+/g).slice(0, 3).map(Number)
          row.verdict = 'по пикселям'
          row.axeStill = inc?.any[0]?.data?.messageKey
          row.pixel = { fg: `rgb(${fg})`, bg: `rgb(${bg})`, bgShare: +(Math.max(...freq.values()) / (data.length / 3)).toFixed(2), ratio: ratio(fg, bg) }
        }
      }
      rows.push(row)
    }
    const key = `${w}-${theme}`
    out[key] = rows
    const summary = rows.reduce((m, r) => ((m[r.verdict] = (m[r.verdict] ?? 0) + 1), m), {})
    console.log(key, 'incomplete:', rows.length, JSON.stringify(summary))
    for (const r of rows.filter((r) => r.verdict !== 'декоративный (aria-hidden)' && r.verdict !== 'axe: пройдено')) console.log('   ', r.verdict, r.key, '«' + r.text + '»', r.size, JSON.stringify(r.axe ?? r.pixel ?? {}), r.axeStill ?? '')
    const passes = rows.filter((r) => r.verdict === 'axe: пройдено').map((r) => r.axe.ratio)
    if (passes.length) console.log('    axe после вывода в экран: пройдено', passes.length, 'мин.', Math.min(...passes))
    await context.close()
  }
}
await browser.close()
save('axe/contrast-incomplete.json', out)
