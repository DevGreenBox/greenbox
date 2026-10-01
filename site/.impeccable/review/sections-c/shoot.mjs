// Снимки и проверки секций C: Кейсы, Отзывы, Команда, Почему, Вопросы.
// Запуск (нужен dev-сервер):  node shoot.mjs http://localhost:3100 r1 [части, например 4,5,6]
// playwright-core — из render-lab монорепо, Chromium — из кэша Playwright, WebKit — встроенный.
// Контраст — axe-core из соседнего проекта монорепо (только чтение).
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('/home/coder/novi/render-lab/package.json')
const { chromium, webkit } = require('playwright-core')
const AXE = '/home/coder/novi/projects/old/33-nakleyki/storefront/node_modules/.pnpm/axe-core@4.12.1/node_modules/axe-core/axe.min.js'
const out = dirname(fileURLToPath(import.meta.url))
const base = process.argv[2] ?? 'http://localhost:3100'
const tag = process.argv[3] ?? 'r1'
const only = process.argv[4]?.split(',')
const part = (n) => !only || only.includes(String(n))
const IDS = ['cases', 'reviews', 'team', 'why', 'faq']
const HIDE_DEV = 'nextjs-portal{display:none!important}'
const HIDE_HEADER = '.site-header{visibility:hidden!important}'

const chrome = await chromium.launch({
  timeout: 300000,
  executablePath: '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome',
})
const safari = await webkit.launch({ timeout: 300000 })
const errors = []
const shot = (name) => join(out, `${name}-${tag}.png`)

async function open(browser, { width, height = 900, theme = 'light', motion = 'no-preference' }) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
    deviceScaleFactor: width < 600 ? 2 : 1,
  })
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const page = await context.newPage()
  page.setDefaultTimeout(240000)
  const where = `${browser === safari ? 'webkit' : 'chromium'} ${width} ${theme} ${motion}`
  page.on('pageerror', (e) => errors.push(`${where}: ${e.message.slice(0, 200)}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${where}: ${m.text().slice(0, 200)}`))
  await page.goto(base + '/', { waitUntil: 'load' })
  await page.addStyleTag({ content: HIDE_DEV })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1500)
  return { page, context }
}

/** Прокрутка всей страницы: срабатывают появления и ленивые картинки. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight
    for (let y = 0; y < H; y += innerHeight * 0.6) {
      scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 90))
    }
    await new Promise((r) => setTimeout(r, 1600))
  })
}

async function sections(page, ids, suffix) {
  const style = await page.addStyleTag({ content: HIDE_HEADER })
  for (const id of ids) {
    const el = page.locator('#' + id)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await el.screenshot({ path: shot(`sec-${id}-${suffix}`) })
  }
  await style.evaluate((node) => node.remove())
}

/** Кейсы на десктопе: прогресс ленты 0…1 → позиция прокрутки страницы. */
async function pinAt(page, p) {
  return page.evaluate(async (p) => {
    const s = document.getElementById('cases')
    const top = s.getBoundingClientRect().top + scrollY
    scrollTo({ top: top + (s.offsetHeight - innerHeight) * p, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 2000))
    return document.querySelector('[data-now]').textContent
  }, p)
}

async function openPrice(page) {
  await page.evaluate(async () => {
    const d = document.querySelector('#faq details')
    d.open = true
    document.getElementById('faq').scrollIntoView({ behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 800))
  })
}

async function axe(page, label) {
  await page.addScriptTag({ path: AXE })
  const r = await page.evaluate(async (ids) => {
    const res = await window.axe.run(
      { include: ids.map((id) => `#${id}`) },
      { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    )
    return res.violations.map((v) => `${v.id} ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
  }, IDS)
  console.log(`axe ${label}:`, r.length ? r : 'нарушений нет')
}

// 1. Десктоп 1440, полное движение: секции, три положения ленты, открытый вопрос о цене
if (part(1)) for (const theme of ['light', 'dark']) {
  const { page, context } = await open(chrome, { width: 1440, theme })
  await scrollThrough(page)
  await sections(page, ['reviews', 'team', 'why', 'faq'], `1440-${theme}`)
  const positions = theme === 'light' ? [0, 0.5, 1] : [0]
  for (const p of positions) {
    const now = await pinAt(page, p)
    await page.screenshot({ path: shot(`cases-pin-${Math.round(p * 100)}-1440-${theme}`) })
    console.log(`pin ${theme} ${p}: счётчик ${now}`)
  }
  await openPrice(page)
  const style = await page.addStyleTag({ content: HIDE_HEADER })
  await page.locator('#faq').screenshot({ path: shot(`faq-price-open-1440-${theme}`) })
  await style.evaluate((node) => node.remove())
  await context.close()
}

// 2. Телефон 390: секции (кейсы — лента), лента после свайпа, открытый вопрос о цене
if (part(2)) for (const theme of ['light', 'dark']) {
  const { page, context } = await open(chrome, { width: 390, height: 844, theme })
  await scrollThrough(page)
  await sections(page, IDS, `390-${theme}`)
  const now = await page.evaluate(async () => {
    document.getElementById('cases').scrollIntoView({ behavior: 'instant' })
    const v = document.querySelector('[data-viewport]')
    v.scrollTo({ left: v.querySelectorAll('[data-item]')[2].offsetLeft - 20, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 900))
    return document.querySelector('[data-now]').textContent
  })
  await page.screenshot({ path: shot(`cases-ribbon-390-${theme}`) })
  console.log(`ribbon ${theme}: счётчик после свайпа ${now}`)
  await openPrice(page)
  const style = await page.addStyleTag({ content: HIDE_HEADER })
  await page.locator('#faq').screenshot({ path: shot(`faq-price-open-390-${theme}`) })
  await style.evaluate((node) => node.remove())
  await context.close()
}

// 3. reduced-motion: сетка кейсов, полные кадры, контраст (axe)
if (part(3)) for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    const { page, context } = await open(chrome, { width, height: width < 600 ? 844 : 900, theme, motion: 'reduce' })
    if (width === 1440) {
      const style = await page.addStyleTag({ content: HIDE_HEADER })
      await page.locator('#cases').screenshot({ path: shot(`cases-grid-reduce-1440-${theme}`) })
      await style.evaluate((node) => node.remove())
    }
    await scrollThrough(page) // ленивые картинки (кейсы, портреты) грузятся только у экрана
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: shot(`full-${width}-${theme}-reduce`), fullPage: true })
    await axe(page, `${width} ${theme}`)
    await context.close()
  }
}

// 4. WebKit: закреплённая лента, лента на телефоне, открытый вопрос
if (part(4)) {
  const { page, context } = await open(safari, { width: 1440 })
  await scrollThrough(page)
  console.log('webkit pin 0.4: счётчик', await pinAt(page, 0.4))
  await page.screenshot({ path: shot('webkit-cases-pin-40-1440') })
  await openPrice(page)
  await page.screenshot({ path: shot('webkit-faq-price-open-1440') })
  await context.close()
}
if (part(4)) {
  const { page, context } = await open(safari, { width: 390, height: 844 })
  const now = await page.evaluate(async () => {
    document.getElementById('cases').scrollIntoView({ behavior: 'instant' })
    const v = document.querySelector('[data-viewport]')
    v.scrollTo({ left: v.querySelectorAll('[data-item]')[1].offsetLeft - 20, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 900))
    return document.querySelector('[data-now]').textContent
  })
  await page.screenshot({ path: shot('webkit-cases-ribbon-390') })
  console.log('webkit ribbon: счётчик', now)
  await context.close()
}

// 5. Клавиатура: Tab по ссылкам кейсов (карточка за краем экрана подъезжает), FAQ с клавиатуры
if (part(5)) {
  const { page, context } = await open(chrome, { width: 1440 })
  await page.evaluate(() => {
    const all = [...document.querySelectorAll('a[href], button, input, summary, [tabindex]')].filter(
      (e) => e.tabIndex >= 0 && e.getClientRects().length,
    )
    all[all.indexOf(document.querySelector('#cases [data-item] a.btn')) - 1].focus()
  })
  const seen = []
  for (let k = 0; k < 8; k++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(1500)
    seen.push(
      await page.evaluate(() => {
        const b = document.activeElement.getBoundingClientRect()
        const ok = b.left >= 0 && b.right <= document.documentElement.clientWidth && b.top >= 68 && b.bottom <= innerHeight
        return `${document.querySelector('[data-now]').textContent}:${ok ? 'виден' : 'ЗА КРАЕМ'}`
      }),
    )
  }
  console.log('Tab по кейсам:', seen.join(' '))
  await page.evaluate(() => document.querySelector('#faq summary').focus())
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(700)
  const state = await page.evaluate(() => [...document.querySelectorAll('#faq details')].map((d) => (d.open ? 1 : 0)).join(''))
  console.log('FAQ Enter → Tab → Enter (открыт только второй):', state)
  await context.close()
}

// 6. Горизонтальная прокрутка страницы
if (part(6)) for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  const { page, context } = await open(chrome, { width, height: 800 })
  const over = await page.evaluate(async () => {
    let max = 0
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
      scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 25))
      max = Math.max(max, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    }
    return max
  })
  console.log(`overflow-x ${width}: ${over}`)
  await context.close()
}

console.log('console/page errors:', errors.length ? errors : 'нет')
await chrome.close()
await safari.close()
