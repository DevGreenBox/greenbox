// Снимки дизайн-системы и каркаса главной + таблица контрастов токенов по сценам.
// Запуск (нужен dev-сервер, /ds в продакшене 404):  node shoot.mjs http://localhost:3100 r1
// playwright-core берётся из render-lab монорепо; Chromium — из кэша Playwright.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('/home/coder/novi/render-lab/package.json')
const { chromium } = require('playwright-core')
const out = dirname(fileURLToPath(import.meta.url))
const base = process.argv[2] ?? 'http://localhost:3100'
const tag = process.argv[3] ?? 'r1'

const browser = await chromium.launch({
  executablePath: '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome',
})
const hideDev = 'nextjs-portal{display:none!important}'

async function open(path, { width, theme, height = 900 }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: width < 600 ? 2 : 1 })
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const page = await context.newPage()
  page.on('pageerror', (e) => console.log('pageerror', path, e.message))
  page.on('console', (m) => m.type() === 'error' && console.log('console', path, m.text()))
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: hideDev })
  await page.evaluate(() => document.fonts.ready)
  return { page, context }
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = innerHeight * 0.6
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 120))
    }
    await new Promise((r) => setTimeout(r, 1600))
    scrollTo({ top: 0, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 700))
  })
}

const shots = []
for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    for (const path of ['/ds', '/']) {
      const { page, context } = await open(path, { width, theme })
      await scrollThrough(page)
      const name = `${path === '/' ? 'home' : 'ds'}-${width}-${theme}-full-${tag}.png`
      await page.screenshot({ path: join(out, name), fullPage: true })
      shots.push(name)
      if (path === '/') {
        const first = `home-${width}-${theme}-first-${tag}.png`
        await page.screenshot({ path: join(out, first) })
        shots.push(first)
        // Плотная шапка над светлой секцией
        await page.evaluate(() => document.getElementById('difference').scrollIntoView({ behavior: 'instant' }))
        await page.waitForTimeout(700)
        const scrolled = `home-${width}-${theme}-scrolled-${tag}.png`
        await page.screenshot({ path: join(out, scrolled) })
        shots.push(scrolled)
        if (width === 390) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
          await page.click('.burger')
          await page.waitForTimeout(900)
          const menu = `home-390-${theme}-menu-${tag}.png`
          await page.screenshot({ path: join(out, menu) })
          shots.push(menu)
          // Проверка: фокус внутри меню, Esc закрывает, прокрутка разблокирована
          const state = await page.evaluate(() => ({
            open: document.getElementById('mobile-menu').open,
            focus: document.activeElement?.textContent?.trim(),
            overflow: document.documentElement.style.overflow,
          }))
          await page.keyboard.press('Tab')
          const tabbed = await page.evaluate(() => document.activeElement.closest('dialog') !== null)
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)
          const after = await page.evaluate(() => ({
            open: document.getElementById('mobile-menu').open,
            focus: document.activeElement?.className,
            overflow: document.documentElement.style.overflow,
            expanded: document.querySelector('.burger').getAttribute('aria-expanded'),
          }))
          console.log('menu', theme, JSON.stringify({ state, tabbedInside: tabbed, after }))
        }
      }
      await context.close()
    }
  }
}

// Состояния крупно: наведение на основную кнопку, фокус с клавиатуры на вторичной и на поле
for (const theme of ['light', 'dark']) {
  const { page, context } = await open('/ds', { width: 1440, theme })
  for (const scene of ['light', 'dark', 'green']) {
    const host = page.locator(`#ds-${scene}`)
    const panel = host.locator('.panel').first()
    await panel.scrollIntoViewIfNeeded()
    await host.locator('.btn--primary').first().hover()
    await host.locator('.btn--primary').first().focus()
    await page.keyboard.press('Tab')
    await page.waitForTimeout(400)
    const name = `states-${scene}-${theme}-${tag}.png`
    await panel.screenshot({ path: join(out, name) })
    shots.push(name)
    const form = host.locator('form')
    await form.locator('input').first().focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await host.locator('.chip').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const fields = `states-fields-${scene}-${theme}-${tag}.png`
    await form.screenshot({ path: join(out, fields) })
    shots.push(fields)
  }
  await context.close()
}

// Шапка на границах брейкпоинтов: ничего не переполняется
for (const width of [1280, 1279, 1024, 420, 390, 320]) {
  const { page, context } = await open('/', { width, theme: 'light' })
  const fit = await page.evaluate(() => {
    const row = document.querySelector('.site-header__row')
    const kids = [...row.children].map((el) => {
      const r = el.getBoundingClientRect()
      return [el.className.split(' ')[0], Math.round(r.left), Math.round(r.right)]
    })
    return {
      scroll: row.scrollWidth,
      client: row.clientWidth,
      kids,
      docOverflow: document.documentElement.scrollWidth - innerWidth,
    }
  })
  console.log('header', width, JSON.stringify(fit))
  await context.close()
}

// Контрасты: токены каждой сцены /ds в обеих темах, прозрачные цвета смешаны с фоном сцены.
const pairs = [
  ['--text', '--bg', 4.5],
  ['--text-2', '--bg', 4.5],
  ['--text-3', '--bg', 3],
  ['--accent-ink', '--bg', 4.5],
  ['--text', '--surface', 4.5],
  ['--text-2', '--surface', 4.5],
  ['--accent-ink', '--surface', 4.5],
  ['--text-2', '--inset', 4.5],
  ['--on-accent', '--accent', 4.5],
  ['--on-accent', '--accent-hover', 4.5],
  ['--error', '--bg', 4.5],
  ['--error', '--surface', 4.5],
  ['--line-control', '--bg', 3],
  ['--focus', '--bg', 3],
]
const rows = []
for (const theme of ['light', 'dark']) {
  const { page, context } = await open('/ds', { width: 1440, theme })
  for (const scene of ['light', 'light-2', 'dark', 'green']) {
    const res = await page.evaluate(
      ({ scene, pairs }) => {
        const host = document.getElementById(`ds-${scene}`)
        const probe = document.createElement('div')
        host.appendChild(probe)
        const read = (token) => {
          probe.style.color = `var(${token})`
          return getComputedStyle(probe).color
        }
        const parse = (c) => {
          const m = c.match(/[\d.]+/g).map(Number)
          if (c.startsWith('color(srgb')) return [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1]
          return [m[0], m[1], m[2], m[3] ?? 1]
        }
        const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]))
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((v) => {
            v /= 255
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const ratio = (a, b) => {
          const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
          return (x + 0.05) / (y + 0.05)
        }
        const bg = parse(read('--bg'))
        const solid = (token) => over(parse(read(token)), bg)
        const hex = (rgb) =>
          '#' +
          rgb
            .map((v) => Math.round(v).toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
        const out = pairs.map(([fg, back, min]) => {
          const b = back === '--bg' ? bg.slice(0, 3) : solid(back)
          const f = over(parse(read(fg)), b)
          const r = ratio(f, b)
          return { fg, back, fgHex: hex(f), bgHex: hex(b), ratio: Math.round(r * 100) / 100, min, ok: r >= min }
        })
        probe.remove()
        return out
      },
      { scene, pairs },
    )
    for (const r of res) rows.push({ theme, scene, ...r })
  }
  // Табличные цифры в Onest: одинаковая ширина «1111» и «0000»
  const tnum = await page.evaluate(() => {
    const s = document.createElement('span')
    s.style.cssText = 'position:absolute;font:400 40px var(--font-sans);font-variant-numeric:tabular-nums'
    document.body.appendChild(s)
    s.textContent = '1111'
    const a = s.getBoundingClientRect().width
    s.textContent = '0000'
    const b = s.getBoundingClientRect().width
    s.style.fontVariantNumeric = 'normal'
    const c = s.getBoundingClientRect().width
    s.textContent = '1111'
    const d = s.getBoundingClientRect().width
    s.remove()
    return { tabular: [a, b], proportional: [d, c] }
  })
  console.log('tnum', theme, JSON.stringify(tnum))
  await context.close()
}
const bad = rows.filter((r) => !r.ok)
const md = ['| Тема | Сцена | Цвет | Фон | Пара | Контраст | Порог |', '|---|---|---|---|---|---|---|']
for (const r of rows)
  md.push(
    `| ${r.theme} | ${r.scene} | ${r.fg} ${r.fgHex} | ${r.back} ${r.bgHex} | | ${r.ratio}${r.ok ? '' : ' ✗'} | ${r.min} |`,
  )
writeFileSync(join(out, `contrast-${tag}.md`), md.join('\n') + '\n')
writeFileSync(join(out, `contrast-${tag}.json`), JSON.stringify(rows, null, 1))
console.log('contrast rows', rows.length, 'fail', bad.length, JSON.stringify(bad))
console.log('shots', shots.length)
await browser.close()
