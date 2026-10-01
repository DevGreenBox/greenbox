// axe по состояниям, которых нет при загрузке: шаг «Контакты» квиза, ошибки форм, открытое меню,
// шапка после прокрутки, кейсы сеткой (reduced-motion), версия без JS. Chromium.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { BASE, launch, save, scrollThrough, sleep } from './lib.mjs'

const require = createRequire(import.meta.url)
const AXE_SRC = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function run(page, include) {
  await page.evaluate(AXE_SRC)
  return page.evaluate(
    ({ include, tags }) =>
      axe.run(include ? { include: [include] } : document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] }),
    { include, tags: TAGS },
  )
}

const brief = (res) => ({
  violations: res.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 180), data: n.any?.[0]?.data })) })),
  incomplete: res.incomplete.map((v) => `${v.id}(${v.nodes.length})`),
})

const scenarios = [
  {
    name: 'quiz-contacts',
    viewport: [1440, 900],
    async prepare(page) {
      await page.locator('#quiz').scrollIntoViewIfNeeded()
      await sleep(1500)
      await page.getByRole('button', { name: 'Сразу оставить контакты' }).click()
      await sleep(1200)
    },
    include: '#quiz',
  },
  {
    name: 'quiz-errors',
    viewport: [1440, 900],
    async prepare(page) {
      await page.locator('#quiz').scrollIntoViewIfNeeded()
      await sleep(1500)
      await page.getByRole('button', { name: 'Сразу оставить контакты' }).click()
      await sleep(800)
      await page.locator('#quiz button[type=submit]').click()
      await page.waitForSelector('#quiz [aria-invalid=true]', { timeout: 8000 })
      await sleep(800)
    },
    include: '#quiz',
  },
  {
    name: 'contact-errors',
    viewport: [1440, 900],
    async prepare(page) {
      await page.locator('#contact').scrollIntoViewIfNeeded()
      await sleep(1800)
      await page.locator('#contact button[type=submit]').click()
      await page.waitForSelector('#contact [aria-invalid=true]', { timeout: 8000 })
      await sleep(800)
    },
    include: '#contact',
  },
  {
    name: 'menu-open',
    viewport: [390, 844],
    async prepare(page) {
      await page.getByRole('button', { name: 'Меню', exact: true }).click()
      await sleep(900)
    },
    include: '#mobile-menu',
  },
  {
    name: 'header-scrolled',
    viewport: [1440, 900],
    async prepare(page) {
      await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }))
      await sleep(1200)
    },
    include: '#site-header',
  },
  {
    name: 'cases-reduced',
    viewport: [1440, 900],
    reducedMotion: 'reduce',
    async prepare(page) {
      await page.evaluate(() => document.getElementById('cases').scrollIntoView({ behavior: 'instant' }))
      await sleep(800)
    },
    include: '#cases',
  },
  {
    name: 'cases-390',
    viewport: [390, 844],
    async prepare(page) {
      await scrollThrough(page)
      await page.evaluate(() => document.getElementById('cases').scrollIntoView({ behavior: 'instant' }))
      await sleep(1500)
    },
    include: '#cases',
  },
  { name: 'nojs-home', viewport: [1440, 900], js: false, async prepare() {}, include: null },
  { name: 'nojs-home-390', viewport: [390, 844], js: false, async prepare() {}, include: null },
]

const only = process.argv[2] ? new RegExp(process.argv[2]) : null
const browser = await launch()
const out = {}
for (const sc of scenarios.filter((x) => !only || only.test(x.name))) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: sc.viewport[0], height: sc.viewport[1] },
      reducedMotion: sc.reducedMotion ?? 'no-preference',
      // Без JS: скрипты вырезаются из HTML (axe всё равно нужен JS, поэтому не javaScriptEnabled:false).
      colorScheme: theme, // без JS тема из системы
      extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.21' },
    })
    await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
    if (sc.js === false) {
      await context.route('**/*', async (route) => {
        const req = route.request()
        if (req.resourceType() === 'script') return route.abort()
        if (req.resourceType() !== 'document') return route.continue()
        const res = await route.fetch()
        const html = (await res.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        return route.fulfill({ response: res, body: html })
      })
    }
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(1500)
    const key = `${sc.name}-${theme}`
    try {
      const res = await Promise.race([
        (async () => {
          await sc.prepare(page)
          return run(page, sc.include)
        })(),
        sleep(90000).then(() => {
          throw new Error('таймаут 90 с')
        }),
      ])
      save(`axe/states/axe-${key}.json`, res)
      out[key] = brief(res)
      console.log(key, '→', out[key].violations.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.map((n) => n.target + ' ' + JSON.stringify(n.data ?? {}).slice(0, 160)).join(' ; ')}`).join(' | ') || '0 нарушений', '| incomplete:', out[key].incomplete.join(', '))
    } catch (e) {
      out[key] = { error: String(e).slice(0, 300) }
      console.log(key, 'ОШИБКА', String(e).slice(0, 300))
    }
    await context.close()
  }
}
await browser.close()
save('axe/states/summary.json', out)
