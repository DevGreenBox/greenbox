// Первый экран: автопроход переключателей демо (один раз, не при reduced-motion), витрина следует теме сайта,
// выноска видна и не перекрыта. Chromium; лента событий — опрос состояния каждые 50 мс из init-скрипта.
import { BASE, launch, save, sleep } from './lib.mjs'

// В странице: пишет изменения состояния демо с отметкой времени от начала загрузки.
function recorder() {
  window.__demo = []
  let last = ''
  const tick = () => {
    const fig = document.querySelector('#top figure')
    const promo = document.querySelector('#top [class*="__promoSwitch"]')
    const fresh = document.querySelector('#top [class*="__freshSwitch"]')
    if (fig && promo && fresh) {
      const s = { promo: promo.checked, fresh: fresh.checked, tour: 'tour' in fig.dataset, live: 'live' in fig.dataset }
      const k = JSON.stringify(s)
      if (k !== last) {
        window.__demo.push({ t: Math.round(performance.now()), scrollY: Math.round(scrollY), ...s })
        last = k
      }
    }
  }
  setInterval(tick, 50)
}

function hintInfo() {
  const fig = document.querySelector('#top figure')
  const hint = fig?.querySelector('p[class*="__hint"]')
  if (!hint) return { exists: false }
  const s = getComputedStyle(hint)
  const r = hint.getBoundingClientRect()
  const f = fig.getBoundingClientRect()
  const vw = document.documentElement.clientWidth
  // Не перекрыта: точки по строкам текста попадают в саму выноску
  const range = document.createRange()
  range.selectNodeContents(hint)
  const lines = [...range.getClientRects()].filter((q) => q.width > 4)
  const hits = lines.map((q) => {
    const el = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)
    return !!el && (hint.contains(el) || el === hint)
  })
  const font = [...document.fonts].filter((ff) => /mono/i.test(ff.family)).map((ff) => `${ff.family}:${ff.status}`)
  return {
    exists: true,
    text: hint.textContent.replace(/\s+/g, ' ').trim(),
    display: s.display,
    visibility: s.visibility,
    opacity: s.opacity,
    fontFamily: s.fontFamily.slice(0, 80),
    fontSize: s.fontSize,
    color: s.color,
    bg: s.backgroundColor,
    rect: { left: Math.round(r.left), top: Math.round(r.top + scrollY), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) },
    insideFigure: r.left >= f.left - 1 && r.right <= f.right + 1 && r.top >= f.top - 1 && r.bottom <= f.bottom + 1,
    insideViewportX: r.left >= 0 && r.right <= vw,
    lines: lines.length,
    notCovered: hits.length > 0 && hits.every(Boolean),
    monoFonts: font,
  }
}

function sceneInfo() {
  const fig = document.querySelector('#top figure')
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null)
  const store = fig?.querySelector('[data-scene]')
  const admin = fig?.querySelector('[class*="__admin"]')
  return {
    theme: document.documentElement.dataset.theme,
    body: bg(document.body),
    hero: bg(document.getElementById('top')),
    store: bg(store),
    storeText: store ? getComputedStyle(store).color : null,
    admin: bg(admin),
  }
}

const results = {}
const browser = await launch()

async function scenario(key, { width, height, reduced = false, theme = 'light', steps }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  await context.addInitScript(recorder)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
  await page.goto(BASE + '/', { waitUntil: 'load' })
  const r = { width, reduced, theme, marks: [] }
  const mark = async (label) => r.marks.push({ label, t: Math.round(await page.evaluate(() => performance.now())) })
  await steps(page, r, mark)
  r.timeline = await page.evaluate(() => window.__demo)
  r.promoOff = r.timeline.filter((x, i) => i > 0 && r.timeline[i - 1].promo && !x.promo).length
  r.promoOn = r.timeline.filter((x, i) => i > 0 && !r.timeline[i - 1].promo && x.promo).length
  r.freshChanges = r.timeline.filter((x, i) => i > 0 && r.timeline[i - 1].fresh !== x.fresh).length
  r.tourStarts = r.timeline.filter((x, i) => x.tour && !(r.timeline[i - 1]?.tour)).length
  r.errors = errors
  results[key] = r
  console.log(key, `выкл. акции: ${r.promoOff}, вкл.: ${r.promoOn}, «Новинки» менялись: ${r.freshChanges}, data-tour стартов: ${r.tourStarts}`, '\n  лента:', JSON.stringify(r.timeline), '\n  метки:', JSON.stringify(r.marks), errors.length ? '\n  ошибки: ' + errors.join(' | ') : '')
  await context.close()
}

const figureRatio = (page) =>
  page.evaluate(() => {
    const r = document.querySelector('#top figure').getBoundingClientRect()
    const vis = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0))
    return { top: Math.round(r.top), height: Math.round(r.height), visibleShare: +(vis / r.height).toFixed(2) }
  })

// 1. 1440: демо в первом экране. Проход должен случиться один раз; уход из экрана и возврат — без повтора.
await scenario('tour-1440', {
  width: 1440,
  height: 900,
  async steps(page, r, mark) {
    r.figure = await figureRatio(page)
    await sleep(2900)
    save('first/tour-1440-promo-off.png', await page.locator('#top figure').screenshot())
    await sleep(3600)
    await mark('после прохода')
    r.hint = await page.evaluate(hintInfo)
    r.scene = await page.evaluate(sceneInfo)
    save('first/first-1440-light.png', await page.screenshot())
    await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }))
    await sleep(1200)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await mark('вернулись к демо')
    await sleep(5000)
    await mark('конец')
  },
})

// 2. 390: демо ниже первого экрана — проход ждёт прокрутки, потом один раз; уход и возврат — без повтора.
await scenario('tour-390', {
  width: 390,
  height: 844,
  async steps(page, r, mark) {
    r.figureAtLoad = await figureRatio(page)
    await sleep(5000)
    await mark('5 с без прокрутки')
    await page.evaluate(() => document.querySelector('#top figure').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await mark('демо в экране')
    r.figure = await figureRatio(page)
    await sleep(900)
    save('first/tour-390-promo-off.png', await page.screenshot())
    await sleep(3500)
    r.hint = await page.evaluate(hintInfo)
    r.scene = await page.evaluate(sceneInfo)
    save('first/demo-390-light.png', await page.screenshot())
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('quiz').offsetTop, behavior: 'instant' }))
    await sleep(1200)
    await page.evaluate(() => document.querySelector('#top figure').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await mark('вернулись к демо')
    await sleep(5000)
    await mark('конец')
  },
})

// 3–4. reduced-motion: прохода нет совсем, выноска всё равно есть.
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  await scenario(`reduced-${w}`, {
    width: w,
    height: h,
    reduced: true,
    async steps(page, r, mark) {
      await page.evaluate(() => document.querySelector('#top figure').scrollIntoView({ block: 'center', behavior: 'instant' }))
      await mark('демо в экране')
      await sleep(8000)
      await mark('через 8 с')
      r.hint = await page.evaluate(hintInfo)
      r.running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
    },
  })
}

// 5. Тема: витрина на ноутбуке светлая/тёмная вслед за сайтом, админка светлая всегда; живое переключение в шапке.
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
    await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(1500)
    const key = `theme-${w}-${theme}`
    const r = { load: await page.evaluate(sceneInfo), hint: await page.evaluate(hintInfo) }
    save(`first/first-${w}-${theme}.png`, await page.screenshot())
    save(`first/demo-${w}-${theme}.png`, await page.locator('#top figure').screenshot())
    if (w === 1440) {
      await page.locator('#site-header .site-header__theme').click()
      await sleep(600)
      r.afterToggle = await page.evaluate(sceneInfo)
      save(`first/demo-${w}-${theme}-toggled.png`, await page.locator('#top figure').screenshot())
    }
    results[key] = r
    console.log(key, JSON.stringify(r.load), r.afterToggle ? '→ после переключателя ' + JSON.stringify(r.afterToggle) : '', '| выноска:', JSON.stringify({ display: r.hint.display, opacity: r.hint.opacity, notCovered: r.hint.notCovered, insideX: r.hint.insideViewportX, insideFig: r.hint.insideFigure, font: r.hint.fontFamily.slice(0, 30), text: r.hint.text }))
    await context.close()
  }
}

await browser.close()
save('first/results.json', results)
