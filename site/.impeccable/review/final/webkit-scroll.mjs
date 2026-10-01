// WebKit: прокрутка главной до низа, по 5 прогонов на 1280 и 390, без обходов. Основа — verify/webkit-crash.mjs.
import { BASE, launch, save, sleep } from './lib.mjs'

const out = []
const browser = await launch('webkit')
for (const [url, w, h, n] of [
  ['/', 1280, 800, 5],
  ['/', 390, 844, 5],
]) {
  for (let run = 1; run <= n; run++) {
    const context = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await context.newPage()
    let crashed = false
    page.on('crash', () => (crashed = true))
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
    let last = { y: 0, section: null }
    const t0 = Date.now()
    try {
      await page.goto(BASE + url, { waitUntil: 'load' })
      await sleep(800)
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += Math.round(h * 0.35)) {
        last = await page.evaluate((y) => {
          window.scrollTo({ top: y, behavior: 'instant' })
          const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
          return { y, section: el?.closest('section,footer,header')?.id || el?.closest('section,footer,header')?.tagName || null }
        }, y)
        await sleep(120)
      }
      out.push({ url, w, run, ok: true, ms: Date.now() - t0, errors })
      console.log(url, w, run, 'OK', errors.join(' | '))
    } catch (e) {
      out.push({ url, w, run, ok: false, crashed, last, ms: Date.now() - t0, error: String(e).split('\n')[0].slice(0, 160), errors })
      console.log(url, w, run, 'ПАДЕНИЕ', crashed ? '(crash)' : '', JSON.stringify(last), String(e).split('\n')[0].slice(0, 120))
    }
    await context.close().catch(() => {})
  }
}
await browser.close()
save('xbrowser/webkit-scroll.json', out)
console.log('итого без падений:', out.filter((r) => r.ok).length, 'из', out.length)
