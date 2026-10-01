// axe-core, WCAG 2.1 A/AA (best-practice отдельно): страницы × 390/1440 × светлая/тёмная, Chromium. Основа — verify/axe.mjs.
import { BASE, MODS, launch, save, scrollThrough, sleep } from './lib.mjs'

const AXE = `${MODS}/axe-core/axe.min.js`
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const pages = [
  ['home', '/'],
  ['privacy', '/privacy'],
  ['lead-sent', '/lead/sent?from=quiz'],
  ['lead-error', '/lead/error?from=contact&field=name,consent'],
  ['lead-error-generic', '/lead/error?from=quiz'],
  ['404', '/no-such-page'],
]
const widths = [
  [390, 844],
  [1440, 900],
]

const browser = await launch()
const summary = []
for (const [name, url] of pages) {
  for (const [width, height] of widths) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height } })
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
      const page = await context.newPage()
      const res0 = await page.goto(BASE + url, { waitUntil: 'load' })
      await scrollThrough(page)
      await sleep(1500)
      await page.addScriptTag({ path: AXE })
      const res = await page.evaluate(
        (tags) => axe.run(document, { runOnly: { type: 'tag', values: [...tags, 'best-practice'] }, resultTypes: ['violations', 'incomplete'] }),
        WCAG,
      )
      const key = `${name}-${width}-${theme}`
      save(`axe/axe-${key}.json`, res)
      const brief = (list) =>
        list.map((v) => ({
          id: v.id,
          impact: v.impact,
          wcag: v.tags.some((t) => WCAG.includes(t)),
          help: v.help,
          nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 200), data: n.any?.[0]?.data })),
        }))
      const row = {
        key,
        url,
        status: res0?.status(),
        width,
        theme: await page.evaluate(() => document.documentElement.dataset.theme),
        passes: res.passes?.length,
        violations: brief(res.violations),
        incomplete: res.incomplete.map((v) => ({ id: v.id, count: v.nodes.length, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')) })),
      }
      summary.push(row)
      console.log(key.padEnd(30), `http ${row.status} тема ${row.theme}`, '| нарушений:', row.violations.map((v) => `${v.id}(${v.nodes.length})${v.wcag ? '' : '[bp]'}`).join(', ') || '0', '| incomplete:', row.incomplete.map((v) => `${v.id}(${v.count})`).join(', '))
      await context.close()
    }
  }
}
await browser.close()
save('axe/summary.json', summary)
