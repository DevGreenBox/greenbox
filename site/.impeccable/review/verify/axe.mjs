// axe-core (WCAG 2.1 A/AA + best-practice отдельно) по страницам × ширинам × темам, Chromium.
import { createRequire } from 'node:module'
import { BASE, launch, save, scrollThrough, sleep } from './lib.mjs'

const require = createRequire(import.meta.url)
const AXE = require.resolve('axe-core/axe.min.js')
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const pages = [
  ['home', '/'],
  ['privacy', '/privacy'],
  ['lead-sent', '/lead/sent?from=quiz'],
  ['lead-error', '/lead/error?from=contact&field=name,consent'],
  ['lead-error-generic', '/lead/error?from=quiz'],
]
const widths = [
  [1440, 900],
  [390, 844],
]
const themes = ['light', 'dark']

const browser = await launch()
const summary = []
for (const [name, url] of pages) {
  for (const [width, height] of widths) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width, height } })
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
      const page = await context.newPage()
      await page.goto(BASE + url, { waitUntil: 'load' })
      await scrollThrough(page)
      await sleep(2000) // появления доходят до data-revealed="done"
      await page.addScriptTag({ path: AXE })
      const res = await page.evaluate(
        (tags) =>
          axe.run(document, {
            runOnly: { type: 'tag', values: [...tags, 'best-practice'] },
            resultTypes: ['violations', 'incomplete'],
          }),
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
          nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 200), summary: (n.failureSummary || '').slice(0, 300), data: n.any?.[0]?.data })),
        }))
      const row = {
        key,
        url,
        width,
        theme: await page.evaluate(() => document.documentElement.dataset.theme),
        violations: brief(res.violations),
        incomplete: res.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      }
      summary.push(row)
      console.log(key, 'violations:', row.violations.map((v) => `${v.id}(${v.nodes.length})${v.wcag ? '' : '[bp]'}`).join(', ') || '0', '| incomplete:', row.incomplete.map((v) => `${v.id}(${v.count})`).join(', '))
      await context.close()
    }
  }
}
await browser.close()
save('axe/summary.json', summary)
