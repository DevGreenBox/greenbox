// Снимки и проверки секций агента A: первый экран, «Не просто сайт», «Что вы получаете».
// Запуск (нужен dev-сервер):  node shoot.mjs http://localhost:3100 r1 [части через запятую]
// Части: shots (Chromium: темы × ширины), webkit, plan-chromium, plan-webkit, film, checks. Без списка — все.
// playwright-core — из render-lab монорепо, Chromium — из кэша Playwright, WebKit — webkit.launch().
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('/home/coder/novi/render-lab/package.json')
const { chromium, webkit } = require('playwright-core')
const sharp = require('sharp')
const out = dirname(fileURLToPath(import.meta.url))
const base = process.argv[2] ?? 'http://localhost:3100'
const tag = process.argv[3] ?? 'r1'
const parts = process.argv[4]?.split(',')
const run = (part) => !parts || parts.includes(part)
const log = []
const say = (...a) => {
  const line = a.join(' ')
  console.log(line)
  log.push(line)
}
const file = (name) => join(out, `${name}-${tag}.png`)

const engines = {
  chromium: () => chromium.launch({ executablePath: '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome' }),
  webkit: () => webkit.launch(),
}

async function open(browser, { width, height = 900, theme = 'dark', reduce = true }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width < 600 ? 2 : 1,
    reducedMotion: reduce ? 'reduce' : 'no-preference',
  })
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const warm = await context.newPage() // первая компиляция dev-сервера не попадает в отсчёт времени
  await warm.goto(base + '/', { waitUntil: 'load', timeout: 240000 })
  await warm.close()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message))
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()} ${m.text().slice(0, 200)}`))
  const t0 = Date.now()
  await page.goto(base + '/', { waitUntil: 'commit', timeout: 240000 })
  await page.waitForFunction(() => document.fonts.status === 'loaded' && document.querySelector('[data-live]'), null, {
    timeout: 60000,
  })
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
  return { page, context, errors, t0 }
}

const switches = (page) => page.locator('#top input[role=switch]')
async function setSwitches(page, on) {
  for (const input of await switches(page).all()) if ((await input.isChecked()) !== on) await input.click()
  await page.waitForTimeout(900)
}

// 1. Chromium: темы × ширины — первый экран (переключатели вкл/выкл), полная страница, свои секции
// Каждая часть — в своём браузере: при нехватке памяти падает одна часть, а не весь прогон.
if (run('shots')) {
const chrome = await engines.chromium()
for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    const { page, context, errors } = await open(chrome, { width, theme })
    await page.waitForTimeout(600)
    await page.screenshot({ path: file(`first-${width}-${theme}-chromium-on`) })
    await setSwitches(page, false)
    await page.screenshot({ path: file(`first-${width}-${theme}-chromium-off`) })
    await setSwitches(page, true)
    // полная страница: прокрутка до конца (ленивые картинки соседей), потом кадр целиком
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) {
        scrollTo({ top: y, behavior: 'instant' })
        await new Promise((r) => setTimeout(r, 120))
      }
      scrollTo({ top: 0, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 600))
    })
    const full = file(`full-${width}-${theme}`)
    await page.screenshot({ path: full, fullPage: true })
    const boxes = await page.evaluate(() =>
      ['top', 'difference', 'get'].map((id) => {
        const r = document.getElementById(id).getBoundingClientRect()
        return { id, top: r.top + scrollY, height: r.height }
      }),
    )
    const scale = width < 600 ? 2 : 1
    for (const b of boxes) {
      if (b.id === 'top') continue
      await sharp(full)
        .extract({ left: 0, top: Math.round(b.top * scale), width: width * scale, height: Math.round(b.height * scale) })
        .toFile(file(`${b.id}-${width}-${theme}`))
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    say(`chromium ${width} ${theme}: overflow ${overflow}px; console: ${errors.join(' | ') || 'чисто'}`)
    await context.close()
  }
}
await chrome.close()
}

// 2. WebKit: первый экран, оба положения переключателей
if (run('webkit')) {
const safari = await engines.webkit()
for (const width of [1440, 390]) {
  const { page, context, errors } = await open(safari, { width })
  await page.waitForTimeout(600)
  await page.screenshot({ path: file(`first-${width}-dark-webkit-on`) })
  await setSwitches(page, false)
  await page.screenshot({ path: file(`first-${width}-dark-webkit-off`) })
  say(`webkit ${width}: console: ${errors.join(' | ') || 'чисто'}`)
  await context.close()
}
await safari.close()
}

// 3. Фон «Сетка макета» в движении: через 1 и 6 с после начала загрузки
for (const name of ['chromium', 'webkit']) {
  if (!run(`plan-${name}`)) continue
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const browser = await engines[name]()
    const { page, context, t0 } = await open(browser, { width, height, reduce: false })
    const live = Date.now() - t0
    for (const s of [1, 6]) {
      const wait = s * 1000 - (Date.now() - t0)
      if (wait > 0) await page.waitForTimeout(wait)
      await page.screenshot({ path: file(`plan-${width}-${name}-${s}s`) })
    }
    say(`plan ${name} ${width}: замер (data-live) через ${live} мс после начала загрузки`)
    await context.close()
    await browser.close()
  }
}

// 4. Хореография входа (кадры 0.1–2.4 с, все анимации на паузе и перемотаны) и появление «Что вы получаете»
if (run('film')) {
  const chrome = await engines.chromium()
  const { page, context } = await open(chrome, { width: 1440, reduce: false })
  await page.waitForTimeout(6000)
  await page.evaluate(() => {
    const html = document.documentElement
    html.classList.remove('js')
    void html.offsetWidth
    html.classList.add('js')
    document.getAnimations().forEach((a) => a.pause())
  })
  const frames = []
  for (const t of [100, 350, 700, 1000, 1250, 1500, 1800, 2400]) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => (a.currentTime = t)), t)
    await page.waitForTimeout(60)
    frames.push(await page.screenshot({ clip: { x: 0, y: 150, width: 1440, height: 600 } }))
  }
  await stack(frames, file('hero-entrance-film-1440'))
  await context.close()
  await chrome.close()
}
if (run('film')) {
  const chrome = await engines.chromium()
  const { page, context } = await open(chrome, { width: 1440, theme: 'light', reduce: false })
  await page.addStyleTag({ content: '.site-header{visibility:hidden!important}' })
  await page.waitForTimeout(1500)
  await page.evaluate(() => scrollTo({ top: document.getElementById('get').offsetTop - 60, behavior: 'instant' }))
  await page.waitForFunction(() => document.querySelector('#get [data-revealed="in"]'), null, { timeout: 10000 })
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
  const frames = []
  for (const t of [0, 300, 600, 1300]) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => (a.currentTime = t)), t)
    await page.waitForTimeout(60)
    frames.push(await page.screenshot())
  }
  await stack(frames, file('get-reveal-film-1440'))
  await context.close()
  await chrome.close()
}

async function stack(buffers, path) {
  const imgs = await Promise.all(buffers.map((b) => sharp(b).resize({ width: 720 }).png().toBuffer({ resolveWithObject: true })))
  let y = 0
  const layers = imgs.map(({ data, info }) => {
    const layer = { input: data, top: y, left: 0 }
    y += info.height + 6
    return layer
  })
  await sharp({ create: { width: 720, height: y, channels: 3, background: '#00E5FF' } }).composite(layers).png().toFile(path)
}

// 5. Клавиатура, дерево доступности, контраст текста секций (обе темы)
if (run('checks')) {
  const chrome = await engines.chromium()
  const { page, context } = await open(chrome, { width: 1440 })
  const order = []
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab')
    const f = await page.evaluate(() => {
      const a = document.activeElement
      const name = (a.getAttribute('aria-label') || a.closest('label')?.textContent || a.textContent).trim()
      return { role: a.getAttribute('role') || a.tagName.toLowerCase(), name: name.slice(0, 32), hero: !!a.closest('#top') }
    })
    order.push(`${f.role} «${f.name}»${f.hero ? '*' : ''}`)
    if (f.role === 'switch' && f.hero && f.name.startsWith('Блок')) break
  }
  say('Tab (* — первый экран): ' + order.join(' → '))
  const state = () => page.evaluate(() => [...document.querySelectorAll('#top input[role=switch]')].map((i) => i.checked))
  await page.keyboard.press('Space')
  const afterSpace = await state()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Space')
  say(`Space: «Новинки» → ${JSON.stringify(afterSpace)}, затем «Акция» → ${JSON.stringify(await state())}`)
  say('ARIA первого экрана:\n' + (await page.locator('#top').ariaSnapshot()))
  await context.close()
for (const theme of ['light', 'dark']) {
  const { page, context } = await open(chrome, { width: 1440, theme })
  const rows = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/[\d.]+/g).map(Number)
      return c.startsWith('color(srgb') ? [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1] : [m[0], m[1], m[2], m[3] ?? 1]
    }
    const over = (f, b) => f.slice(0, 3).map((v, i) => v * f[3] + b[i] * (1 - f[3]))
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
      return (x + 0.05) / (y + 0.05)
    }
    const bgOf = (el) => {
      const stack = []
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor)
        if (c[3] > 0) stack.push(c)
        if (c[3] >= 1) break
      }
      return stack.reverse().reduce((bg, c) => over(c, bg), [255, 255, 255])
    }
    const out = []
    for (const id of ['top', 'difference', 'get']) {
      const walker = document.createTreeWalker(document.getElementById(id), NodeFilter.SHOW_TEXT)
      const seen = new Set()
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement
        if (!n.textContent.trim() || seen.has(el) || el.closest('[aria-hidden="true"], .sr-only, [hidden]')) continue
        seen.add(el)
        const cs = getComputedStyle(el)
        const size = parseFloat(cs.fontSize)
        const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700)
        const bg = bgOf(el)
        const r = parse(cs.webkitTextFillColor)[3] === 0
          ? Math.min(ratio([0, 200, 83], bg), ratio([0, 229, 255], bg)) // градиент #00C853 → #00E5FF
          : ratio(over(parse(cs.color), bg), bg)
        out.push({ id, text: n.textContent.trim().slice(0, 30), size, r: Math.round(r * 100) / 100, min: large ? 3 : 4.5 })
      }
    }
    return out
  })
  const fails = rows.filter((r) => r.r < r.min)
  const tight = [...rows].sort((a, b) => a.r / a.min - b.r / b.min).slice(0, 3)
  say(
    `контраст ${theme}: ${rows.length} текстов, не проходят ${fails.length}${fails.length ? ' ' + JSON.stringify(fails) : ''}; ` +
      `впритык: ${tight.map((t) => `«${t.text}» ${t.size}px ${t.r}:1 (порог ${t.min})`).join('; ')}`,
  )
  await context.close()
}
await chrome.close()
}

writeFileSync(join(out, `checks-${tag}-${parts ? parts.join('+') : 'all'}.txt`), log.join('\n') + '\n')
