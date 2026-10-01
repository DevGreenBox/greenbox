// Кто крутит requestAnimationFrame в простое на десктопе: стеки вызовов после 12 с на первом экране.
import { BASE, launch, save, sleep } from './lib.mjs'

const browser = await launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window)
  window.__stacks = new Map()
  window.__on = false
  window.requestAnimationFrame = (cb) => {
    if (window.__on) {
      const s = (new Error().stack ?? '').split('\n').slice(2, 5).map((l) => l.trim().replace(location.origin, '')).join(' | ')
      window.__stacks.set(s, (window.__stacks.get(s) ?? 0) + 1)
    }
    return raf(cb)
  }
})
const page = await context.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await sleep(12000)
await page.evaluate(() => (window.__on = true))
await sleep(5000)
const stacks = await page.evaluate(() => [...window.__stacks.entries()].sort((a, b) => b[1] - a[1]))
const gsapLoaded = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.initiatorType === 'script' || e.name.endsWith('.js')).map((e) => e.name.replace(location.origin, '')))
// Помогает ли остановка: есть ли в глобале gsap (нет — модульный чанк)
save('motion/raf-source.json', { stacks, scripts: gsapLoaded })
console.log('rAF за 5 с простоя (после 12 с):', JSON.stringify(stacks, null, 1))
// Какие чанки содержат gsap
for (const url of gsapLoaded.filter((u) => u.includes('/_next/static/chunks/'))) {
  const txt = await (await fetch(BASE + url)).text()
  if (/gsap|ScrollTrigger|_ticker|lagSmoothing/.test(txt)) console.log('GSAP-подобный код в', url, txt.length, 'байт')
}
await browser.close()
