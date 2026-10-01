// Кандидаты LCP по порядку при реальном (не симулированном) троттлинге: 4× CPU, 150 мс RTT, 1,6 Мбит/с.
// Показывает, какой элемент и когда становится LCP, и когда пришли шрифты и закончилась гидратация.
import { BASE, launch, save, sleep } from './lib.mjs'

const browser = await launch()
const runs = []
for (const [label, reduced] of [
  ['обычный', 'no-preference'],
  ['reduced-motion', 'reduce'],
]) {
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true, reducedMotion: reduced })
    await context.addInitScript(() => {
      window.__lcp = []
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const el = e.element
          window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: el ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' «' + (el.textContent || '').trim().slice(0, 30) + '»' : e.url })
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 })
    await sleep(4000)
    const d = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      const fonts = performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.woff2')).map((r) => `${r.name.split('/').pop().slice(0, 16)} ${Math.round(r.responseEnd)}`)
      const js = performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js'))
      return { fcp: Math.round(fcp), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), lastJs: Math.round(Math.max(...js.map((r) => r.responseEnd))), fonts, lcp: window.__lcp }
    })
    runs.push({ label, ...d })
    console.log(label, `FCP ${d.fcp} DCL ${d.dcl} load ${d.load} последний JS ${d.lastJs}`, '| шрифты:', d.fonts.join(', '))
    for (const e of d.lcp) console.log('    LCP-кандидат', e.t, 'мс', e.size, e.el)
    await context.close()
  }
}
await browser.close()
save('lcp/lcp-entries.json', runs)
