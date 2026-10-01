// Кейсы после правки иерархии сетки и моно-счётчика: снимки #cases и замеры. Один браузер за раз.
// Запуск: node .impeccable/review/fix-cases/shoot.mjs [http://localhost:3101]
import { chromium } from '/home/coder/novi/render-lab/node_modules/playwright-core/index.mjs'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] ?? 'http://localhost:3101'
const OUT = path.dirname(fileURLToPath(import.meta.url))
const CHROME = '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const only = process.env.ONLY?.split(',') // grid,nojs,ribbon,mobile — для точечного перезапуска
const want = (name) => !only || only.includes(name)
const report = { base: BASE }
let stage = 'start' // этап прогона — подписывает сообщения консоли

// Скрываем на снимках только то, чего нет у посетителя: плашку dev-режима Next. Шапку прячем лишь в снимках
// секции целиком (fixed-шапка легла бы поверх середины длинного кадра).
const NO_DEV_BADGE = 'nextjs-portal { display: none !important }'
const NO_HEADER = 'header { visibility: hidden !important }'

async function open(browser, opts, { url = '/', style = NO_DEV_BADGE } = {}) {
  const context = await browser.newContext(opts)
  const page = await context.newPage()
  page.setDefaultTimeout(120000)
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${stage}] ${m.type()}: ${m.text().slice(0, 1500)}`)
  })
  page.on('pageerror', (e) => errors.push(`[${stage}] pageerror: ${e.message.slice(0, 500)}`))
  stage = `open ${opts.viewport?.width}${opts.javaScriptEnabled === false ? ' no-js' : ''}${opts.reducedMotion ? ' reduced' : ''}`
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#cases', { state: 'attached' })
  if (opts.javaScriptEnabled !== false) {
    await page.waitForFunction(() => !!document.querySelector('#cases [data-live]'), null, { timeout: 60000 })
    await page.addStyleTag({ content: style })
  }
  return { context, page, errors }
}

/** Всем img — loading=eager и ждём загрузку и декодирование. */
async function eagerImages(page) {
  return page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('#cases img')]
    for (const img of imgs) img.loading = 'eager'
    await Promise.all(
      imgs.map(
        (img) =>
          (img.complete && img.naturalWidth) ||
          new Promise((res) => {
            img.addEventListener('load', res, { once: true })
            img.addEventListener('error', res, { once: true })
            setTimeout(res, 30000)
          }),
      ),
    )
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})))
    await document.fonts.ready
    return imgs.map((img) => ({ file: img.currentSrc.split('?')[0].split('/').pop(), ok: img.complete && img.naturalWidth > 0 }))
  })
}

/** Раскладка карточек в сетке: прямоугольники li, кадра и текста, стили сетки. */
const gridMetrics = () => {
  const track = document.querySelector('#cases [data-track]')
  const t = track.getBoundingClientRect()
  const r = (el) => {
    const b = el.getBoundingClientRect()
    return { x: Math.round(b.left - t.left), y: Math.round(b.top - t.top), w: Math.round(b.width), h: Math.round(b.height) }
  }
  return {
    track: { w: Math.round(t.width), display: getComputedStyle(track).display, cols: getComputedStyle(track).gridTemplateColumns, gap: getComputedStyle(track).gap },
    items: [...track.children].map((li) => {
      const card = li.querySelector('article')
      const frame = li.querySelector('[class*="frame"]')
      const body = li.querySelector('[class*="body"]')
      return { item: r(li), frame: r(frame), body: r(body), cardDisplay: getComputedStyle(card).display, cardCols: getComputedStyle(card).gridTemplateColumns, gridColumn: getComputedStyle(li).gridColumn }
    }),
  }
}

/** Ряды по верху li: каждый ряд занимает сетку от края до края без пробелов больше колоночного. */
const holes = () => {
  const track = document.querySelector('#cases [data-track]')
  const cs = getComputedStyle(track)
  const b0 = track.getBoundingClientRect()
  // содержимое сетки — без полей контейнера (padding трека)
  const t = { left: b0.left + parseFloat(cs.paddingLeft), right: b0.right - parseFloat(cs.paddingRight) }
  const gap = parseFloat(cs.columnGap)
  const rows = new Map()
  for (const li of track.children) {
    const b = li.getBoundingClientRect()
    const key = Math.round(b.top)
    rows.set(key, [...(rows.get(key) ?? []), b])
  }
  return [...rows.values()].map((row) => {
    row.sort((a, b) => a.left - b.left)
    const left = Math.round(row[0].left - t.left)
    const right = Math.round(t.right - row[row.length - 1].right)
    const between = row.slice(1).map((b, i) => Math.round(b.left - row[i].right))
    const ok = Math.abs(left) <= 1 && Math.abs(right) <= 1 && between.every((g) => Math.abs(g - gap) <= 1)
    return { n: row.length, w: row.map((b) => Math.round(b.width)), left, right, between, ok }
  })
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
try {
  // ---------- 1. Сетка при reduced-motion: 1440 и 1920 ----------
  for (const [w, h] of want('grid')
    ? [
        [1440, 900],
        [1920, 1080],
      ]
    : []) {
    const { context, page, errors } = await open(browser, { viewport: { width: w, height: h }, reducedMotion: 'reduce' }, { style: NO_DEV_BADGE + NO_HEADER })
    stage = `grid ${w}`
    const imgs = await eagerImages(page)
    const m = await page.evaluate(gridMetrics)
    const counter = await page.evaluate(() => {
      const p = document.querySelector('#cases [class*="progress"]')
      return { display: getComputedStyle(p).display }
    })
    report[`grid-${w}`] = { imgs, metrics: m, rows: await page.evaluate(holes), counter, errors }
    await page.locator('#cases').screenshot({ path: path.join(OUT, `grid-${w}.png`) })

    if (w === 1440) {
      // Число работ от 3 до 12: клонируем и режем li (CSS выбирает лидера и последнюю по :first-child / :last-child).
      const variants = {}
      for (let n = 3; n <= 12; n++) {
        await page.evaluate((n) => {
          const track = document.querySelector('#cases [data-track]')
          window.__orig ??= [...track.children].map((li) => li.cloneNode(true))
          track.replaceChildren(...Array.from({ length: n }, (_, i) => window.__orig[i % window.__orig.length].cloneNode(true)))
        }, n)
        const rows = await page.evaluate(holes)
        variants[n] = rows.map((r) => `${r.n}${r.ok ? '' : ' ДЫРА ' + JSON.stringify(r)}`).join(' | ')
        if (n === 4 || n === 7) {
          await eagerImages(page)
          await sleep(300)
          await page.locator('#cases').screenshot({ path: path.join(OUT, `grid-1440-n${n}.png`) })
        }
      }
      report['grid-1440-variants'] = variants
    }
    await context.close()
  }

  // ---------- 1б. Узкий десктоп и низкое окно: та же сетка ----------
  for (const [name, opts] of want('narrow')
    ? [
        ['grid-1024', { viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' }],
        ['short-1440x600', { viewport: { width: 1440, height: 600 } }], // с JS и движением, но ниже 640 px: закрепления нет
      ]
    : []) {
    const { context, page, errors } = await open(browser, opts, { style: NO_DEV_BADGE + NO_HEADER })
    stage = name
    await eagerImages(page)
    report[name] = { metrics: await page.evaluate(gridMetrics), rows: await page.evaluate(holes), errors }
    if (name === 'grid-1024') await page.locator('#cases').screenshot({ path: path.join(OUT, `${name}.png`) })
    await context.close()
  }

  // ---------- 2. Без JS (десктоп 1440): та же сетка ----------
  if (want('nojs')) {
    const { context, page } = await open(browser, { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    // Без JS ленивые кадры грузятся от прокрутки колесом: проходим секцию сверху вниз.
    const y0 = (await page.locator('#cases').boundingBox()).y
    const height = (await page.locator('#cases').boundingBox()).height
    await page.mouse.move(700, 400)
    await page.mouse.wheel(0, Math.max(0, y0 - 100))
    for (let y = 0; y < height; y += 500) {
      await page.mouse.wheel(0, 500)
      await sleep(500)
    }
    await sleep(1500)
    const track = await page.locator('#cases [data-track]').boundingBox()
    const items = []
    for (const li of await page.locator('#cases [data-item]').all()) {
      const b = await li.boundingBox()
      items.push({ x: Math.round(b.x - track.x), w: Math.round(b.width), y: Math.round(b.y - track.y), h: Math.round(b.height) })
    }
    const progress = await page.locator('#cases [class*="progress"]').evaluate((el) => getComputedStyle(el).display).catch(() => 'n/a')
    report['nojs-1440'] = { trackW: Math.round(track.width), items, progress }
    await page.locator('#cases').screenshot({ path: path.join(OUT, 'grid-1440-nojs.png') })
    await context.close()
  }

  // ---------- 3. Закреплённая лента 1440: два положения + клавиатура ----------
  if (want('ribbon')) {
    const { context, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } })
    stage = 'ribbon load'
    await eagerImages(page)
    const geo = await page.evaluate(() => {
      const pin = document.querySelector('#cases [data-live]')
      const r = pin.getBoundingClientRect()
      return { top: Math.round(r.top + scrollY), height: Math.round(r.height), vh: innerHeight }
    })
    const distance = geo.height - geo.vh
    const at = async (p) => {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), geo.top + p * distance)
      await sleep(1800)
      return page.evaluate(() => {
        const track = document.querySelector('#cases [data-track]')
        const now = document.querySelector('#cases [data-now]')
        const prog = document.querySelector('#cases [class*="progress"]')
        const cs = getComputedStyle(prog)
        const mono = [...document.fonts].filter((f) => f.status === 'loaded' && /mono/i.test(f.family)).map((f) => f.family)
        const items = [...track.children].map((li) => {
          const b = li.getBoundingClientRect()
          return { left: Math.round(b.left), right: Math.round(b.right) }
        })
        const card = track.children[0].querySelector('article')
        const body = track.children[0].querySelector('[class*="body"]')
        return {
          scrollY: Math.round(scrollY),
          counter: prog.textContent.replace(/\s+/g, ' ').trim(),
          now: now.textContent,
          fontFamily: cs.fontFamily.slice(0, 80),
          fontSize: cs.fontSize,
          color: cs.color,
          monoLoaded: mono,
          transform: getComputedStyle(track).transform,
          items,
          card1: { display: getComputedStyle(card).display, cols: getComputedStyle(card).gridTemplateColumns, align: getComputedStyle(card).alignItems, colGap: getComputedStyle(card).columnGap },
          body1: { alignSelf: getComputedStyle(body).alignSelf, paddingTop: getComputedStyle(body).paddingTop },
        }
      })
    }
    report['ribbon-1440'] = { geo }
    stage = 'ribbon p0'
    report['ribbon-1440'].p0 = await at(0)
    await page.screenshot({ path: path.join(OUT, 'ribbon-1440-a.png') })
    stage = 'ribbon p50'
    report['ribbon-1440'].p50 = await at(0.5)
    await page.screenshot({ path: path.join(OUT, 'ribbon-1440-b.png') })
    stage = 'ribbon p100'
    report['ribbon-1440'].p100 = await at(1)
    stage = 'ribbon tabs'

    // Клавиатура: Tab от заголовка секции по ссылкам «Открыть сайт»; ссылка каждой карточки должна оказаться в экране.
    await at(0)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.evaluate(({ y }) => window.scrollTo({ top: y, behavior: 'instant' }), { y: geo.top })
    await sleep(600)
    await page.evaluate(() => document.querySelector('#cases-title').setAttribute('tabindex', '-1'))
    await page.evaluate(() => document.querySelector('#cases-title').focus())
    const tabs = []
    for (let i = 1; i <= 6; i++) {
      stage = `ribbon tab ${i}`
      await page.keyboard.press('Tab')
      await sleep(1600)
      tabs.push(
        await page.evaluate(() => {
          const el = document.activeElement
          const r = el.getBoundingClientRect()
          const li = el.closest('[data-item]')
          const vw = document.documentElement.clientWidth
          return {
            el: (el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 28),
            card: li ? [...li.parentElement.children].indexOf(li) + 1 : null,
            inView: r.left >= 0 && r.right <= vw && r.top >= 0 && r.bottom <= innerHeight,
            left: Math.round(r.left),
            right: Math.round(r.right),
            scrollY: Math.round(scrollY),
            now: document.querySelector('#cases [data-now]')?.textContent,
          }
        }),
      )
    }
    report['ribbon-1440'].tabs = tabs
    report['ribbon-1440'].errors = errors
    await context.close()
  }

  // ---------- 4. Телефон 390: лента со scroll-snap ----------
  if (want('mobile')) {
    const { context, page, errors } = await open(
      browser,
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      { style: NO_DEV_BADGE + NO_HEADER },
    )
    await eagerImages(page)
    await sleep(600)
    const info = await page.evaluate(() => {
      const vp = document.querySelector('#cases [data-viewport]')
      const prog = document.querySelector('#cases [class*="progress"]')
      const cs = getComputedStyle(prog)
      const mono = [...document.fonts].filter((f) => f.status === 'loaded' && /mono/i.test(f.family)).map((f) => f.family)
      const head = document.querySelector('#cases [class*="head"]').getBoundingClientRect()
      const p = prog.getBoundingClientRect()
      return {
        counter: prog.textContent.replace(/\s+/g, ' ').trim(),
        fontFamily: cs.fontFamily.slice(0, 80),
        fontSize: cs.fontSize,
        monoLoaded: mono,
        progressBox: { left: Math.round(p.left), right: Math.round(p.right), top: Math.round(p.top), h: Math.round(p.height) },
        headBox: { left: Math.round(head.left), right: Math.round(head.right), h: Math.round(head.height) },
        snap: getComputedStyle(vp).scrollSnapType,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }
    })
    stage = 'mobile shot'
    report['mobile-390'] = { info }
    await page.locator('#cases').screenshot({ path: path.join(OUT, 'mobile-390.png') })

    stage = 'mobile swipe'
    // Прокрутка ленты пальцем к третьей карточке: счётчик и привязка.
    await page.evaluate(() => {
      const vp = document.querySelector('#cases [data-viewport]')
      const li = vp.querySelectorAll('[data-item]')[2]
      const pad = parseFloat(getComputedStyle(vp).scrollPaddingInlineStart) || 0
      vp.scrollTo({ left: li.offsetLeft - pad, behavior: 'instant' })
    })
    await sleep(500)
    report['mobile-390'].afterSwipe = await page.evaluate(() => ({
      counter: document.querySelector('#cases [class*="progress"]').textContent.replace(/\s+/g, ' ').trim(),
      scrollLeft: Math.round(document.querySelector('#cases [data-viewport]').scrollLeft),
    }))
    await page.locator('#cases').screenshot({ path: path.join(OUT, 'mobile-390-card3.png') })

    // Клавиатура: Tab по ссылкам, лента встаёт на карточку.
    await page.evaluate(() => {
      document.querySelector('#cases [data-viewport]').scrollTo({ left: 0, behavior: 'instant' })
      document.querySelector('#cases-title').scrollIntoView({ behavior: 'instant', block: 'center' })
      document.querySelector('#cases-title').setAttribute('tabindex', '-1')
      document.querySelector('#cases-title').focus()
    })
    const tabs = []
    for (let i = 1; i <= 5; i++) {
      stage = `mobile tab ${i}`
      await page.keyboard.press('Tab')
      await sleep(900)
      tabs.push(
        await page.evaluate(() => {
          const el = document.activeElement
          const r = el.getBoundingClientRect()
          const li = el.closest('[data-item]')
          const vp = document.querySelector('#cases [data-viewport]')
          return {
            card: li ? [...li.parentElement.children].indexOf(li) + 1 : null,
            visiblePx: Math.max(0, Math.min(r.right, document.documentElement.clientWidth) - Math.max(r.left, 0)),
            width: Math.round(r.width),
            scrollLeft: Math.round(vp.scrollLeft),
            now: document.querySelector('#cases [data-now]')?.textContent,
          }
        }),
      )
    }
    report['mobile-390'].tabs = tabs
    report['mobile-390'].errors = errors
    await context.close()
  }
} finally {
  await browser.close()
}

mkdirSync(OUT, { recursive: true })
const file = path.join(OUT, 'report.json')
const prev = only && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
writeFileSync(file, JSON.stringify({ ...prev, ...report }, null, 2))
console.log(JSON.stringify(report, null, 2))
