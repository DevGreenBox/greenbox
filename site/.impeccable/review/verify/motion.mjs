// Движение: reduced-motion (всё видно), без JS (контент, формы, тема из системы), простой первого экрана
// (rAF-счётчик, пересчёты стиля и раскладки, бегущие анимации) за 0–10 и 10–20 с после загрузки.
import { BASE, launch, save, sleep } from './lib.mjs'

/** Что спрятано: элементы с текстом, чья итоговая непрозрачность < 0.9 или сдвинуты/размыты появлением. */
function hiddenContent() {
  const out = []
  const effOpacity = (el) => {
    let op = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity)
    return op
  }
  for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a, main button, main label, main dt, main dd, main summary, main figcaption, footer p, footer a, header a')) {
    if (el.closest('[aria-hidden=true],.sr-only,[hidden],dialog:not([open])')) continue
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden') continue
    if (el.closest('details:not([open])') && !el.closest('summary')) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const op = effOpacity(el)
    if (op < 0.9) out.push({ el: el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 2).join('.'), text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 50), opacity: +op.toFixed(2) })
  }
  const reveal = [...document.querySelectorAll('[data-reveal]')].map((el) => {
    const s = getComputedStyle(el)
    return { opacity: s.opacity, transform: s.transform, filter: s.filter, clip: s.clipPath, revealed: el.dataset.revealed ?? null }
  })
  const badReveal = reveal.filter((r) => r.opacity !== '1' || (r.transform !== 'none' && r.transform !== 'matrix(1, 0, 0, 1, 0, 0)') || r.filter !== 'none' || (r.clip !== 'none' && r.clip !== 'inset(0px)'))
  return { hidden: out, revealCount: reveal.length, badReveal, htmlClass: document.documentElement.className, theme: document.documentElement.dataset.theme ?? null }
}

function scenes() {
  const bg = (sel) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el).backgroundColor : null
  }
  const vis = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return 'нет в DOM'
    const s = getComputedStyle(el)
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 0
  }
  return {
    body: bg('body'),
    quizScene: bg('#quiz'),
    faqScene: bg('#faq'),
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    quizSteps: [...document.querySelectorAll('#quiz fieldset')].map((f) => getComputedStyle(f).display !== 'none'),
    quizSubmit: vis('#quiz button[type=submit]'),
    quizNext: vis('#quiz button:not([type=submit])'),
    contactForm: vis('#contact form'),
    contactSubmit: vis('#contact button[type=submit]'),
    themeToggle: vis('#site-header .theme-toggle'),
    burger: vis('#site-header button[aria-haspopup=dialog]'),
    headerCta: vis('#site-header .site-header__cta'),
    headerNav: vis('#site-header .site-header__nav'),
    honeypotVisible: (() => {
      const i = document.querySelector('input[name=website]')
      const r = i?.getBoundingClientRect()
      return !!r && r.width > 2 && r.height > 2
    })(),
    faqOpenable: document.querySelectorAll('#faq details').length,
  }
}

const results = {}
let browser = await launch()

// 1. reduced-motion: сразу после загрузки, без прокрутки
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(300)
  const early = await page.evaluate(hiddenContent)
  // по секциям: прыжком, без ожидания
  const perSection = {}
  for (const id of ['difference', 'get', 'quiz', 'process', 'cases', 'reviews', 'team', 'why', 'faq', 'contact']) {
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), id)
    await sleep(120)
    const r = await page.evaluate(hiddenContent)
    perSection[id] = r.hidden.length + r.badReveal.length
  }
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName ?? a.constructor.name))
  const casesLayout = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#cases [data-item]')].map((i) => i.getBoundingClientRect())
    const vw = document.documentElement.clientWidth
    return { cards: items.length, allInsideWidth: items.every((r) => r.left >= -1 && r.right <= vw + 1), rows: new Set(items.map((r) => Math.round(r.top + scrollY))).size }
  })
  save(`motion/reduced-${w}-full.png`, await page.screenshot({ fullPage: w === 1440 }))
  results[`reduced-${w}`] = { early, perSection, runningAfter: running, casesLayout }
  console.log(`reduced ${w}: скрытых при загрузке ${early.hidden.length}, reveal не в покое ${early.badReveal.length}/${early.revealCount}, по секциям ${JSON.stringify(perSection)}, бегущих анимаций ${running.length}, кейсы ${JSON.stringify(casesLayout)}`)
  if (early.hidden.length) console.log('   ', JSON.stringify(early.hidden.slice(0, 8)))
  await context.close()
}

// 2. Без JS. Настоящий javaScriptEnabled:false для кадров + вырезанные скрипты для замеров (evaluate без JS не работает).
for (const scheme of ['light', 'dark']) {
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    const key = `nojs-${scheme}-${w}`
    const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })
    await context.route('**/*', async (route) => {
      const req = route.request()
      if (req.resourceType() === 'script') return route.abort()
      if (req.resourceType() !== 'document') return route.continue()
      const res = await route.fetch()
      const html = (await res.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      return route.fulfill({ response: res, body: html })
    })
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(500)
    const content = await page.evaluate(hiddenContent)
    const sc = await page.evaluate(scenes)
    results[key] = { content, scenes: sc }
    console.log(`${key}: html.class="${content.htmlClass}" theme=${content.theme} скрытых ${content.hidden.length} reveal не в покое ${content.badReveal.length}/${content.revealCount}`, JSON.stringify(sc))
    await context.close()

    const real = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, javaScriptEnabled: false })
    const p2 = await real.newPage()
    await p2.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(400)
    save(`motion/${key}-first.png`, await p2.screenshot())
    await p2.goto(BASE + '/#quiz', { waitUntil: 'load' })
    await sleep(300)
    save(`motion/${key}-quiz.png`, await p2.screenshot())
    await p2.goto(BASE + '/#contact', { waitUntil: 'load' })
    await sleep(300)
    save(`motion/${key}-contact.png`, await p2.screenshot())
    await real.close()
  }
}

// 3. Простой: rAF, пересчёты, бегущие анимации (1440 и 390, Chromium; плюс состояние после прокрутки к кейсам)
async function idle(w, h, { scrollTo } = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h } })
  await context.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window)
    window.__raf = []
    window.requestAnimationFrame = (cb) => {
      window.__raf.push(performance.now())
      return raf(cb)
    }
  })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
  await page.goto(BASE + '/', { waitUntil: 'load' })
  if (scrollTo) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), scrollTo)
  }
  const t0 = await page.evaluate(() => performance.now())
  const m0 = await metrics()
  await sleep(10000)
  const t1 = await page.evaluate(() => performance.now())
  const m1 = await metrics()
  const anims1 = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === 'running').map((a) => ({ name: a.animationName ?? a.transitionProperty ?? 'web-animation', iterations: a.effect?.getComputedTiming().iterations, target: a.effect?.target?.className?.toString().slice(0, 60) })),
  )
  await sleep(10000)
  const t2 = await page.evaluate(() => performance.now())
  const m2 = await metrics()
  const anims2 = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName ?? 'web-animation'))
  const raf = await page.evaluate(({ t0, t1, t2 }) => ({ a: window.__raf.filter((t) => t >= t0 && t < t1).length, b: window.__raf.filter((t) => t >= t1 && t < t2).length }), { t0, t1, t2 })
  const d = (a, b, k) => +(b[k] - a[k]).toFixed(3)
  const res = {
    window0_10: { raf: raf.a, rafPerSec: +(raf.a / 10).toFixed(1), layouts: d(m0, m1, 'LayoutCount'), styles: d(m0, m1, 'RecalcStyleCount'), taskSec: d(m0, m1, 'TaskDuration'), scriptSec: d(m0, m1, 'ScriptDuration'), runningAt10s: anims1 },
    window10_20: { raf: raf.b, rafPerSec: +(raf.b / 10).toFixed(1), layouts: d(m1, m2, 'LayoutCount'), styles: d(m1, m2, 'RecalcStyleCount'), taskSec: d(m1, m2, 'TaskDuration'), scriptSec: d(m1, m2, 'ScriptDuration'), runningAt20s: anims2 },
  }
  await context.close()
  return res
}
for (const [w, h, scrollTo] of [
  [1440, 900],
  [390, 844],
  [1440, 900, 'cases'],
]) {
  const key = `idle-${w}${scrollTo ? '-' + scrollTo : ''}`
  results[key] = await idle(w, h, { scrollTo })
  console.log(key, JSON.stringify(results[key]))
}
await browser.close()

// WebKit: reduced-motion, 390 — контент виден сразу
browser = await launch('webkit')
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(300)
  const early = await page.evaluate(hiddenContent)
  results['webkit-reduced-390'] = early
  console.log(`webkit reduced 390: скрытых ${early.hidden.length}, reveal не в покое ${early.badReveal.length}/${early.revealCount}`)
  await context.close()
}
await browser.close()
save('motion/results.json', results)
