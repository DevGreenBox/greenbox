// Кросс-браузер: Chromium и WebKit на 7 ширинах — горизонтальная прокрутка, ошибки консоли и сети,
// поля 100 px от 1280, шрифт 200 % на 390. Браузеры по очереди. Основа — verify/xbrowser.mjs (без обхода WK_NOBLUR и устройств).
import { BASE, launch, save, scrollThrough, sleep } from './lib.mjs'

const sizes = [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]

function measure() {
  const de = document.documentElement
  const vw = de.clientWidth
  // Кто торчит за правый/левый край страницы (не считая тех, кого обрезает предок с overflow)
  const clipped = (el) => {
    for (let n = el.parentElement; n && n !== de; n = n.parentElement) {
      const s = getComputedStyle(n)
      if (s.overflowX !== 'visible' || s.contain.includes('paint')) return true
    }
    return false
  }
  const offenders = []
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el) && getComputedStyle(el).position !== 'fixed') {
      offenders.push({ el: el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 2).join('.'), left: Math.round(r.left), right: Math.round(r.right) })
    }
  }
  const box = (sel) => document.querySelector(sel)?.getBoundingClientRect()
  const logo = box('#site-header .site-header__logo')
  const cta = box('#site-header .site-header__cta')
  const burger = box('#site-header button[aria-haspopup=dialog]')
  const title = box('#difference-title')
  const footerLogo = box('.site-footer__logo')
  const vis = (sel) => {
    const el = document.querySelector(sel)
    return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0
  }
  return {
    scrollWidth: de.scrollWidth,
    clientWidth: vw,
    bodyScrollWidth: document.body.scrollWidth,
    hScroll: de.scrollWidth > vw,
    offenders: offenders.slice(0, 12),
    offendersCount: offenders.length,
    margins: {
      logoLeft: logo && Math.round(logo.left),
      ctaRight: cta && cta.width ? Math.round(vw - cta.right) : null,
      burgerRight: burger && burger.width ? Math.round(vw - burger.right) : null,
      titleLeft: title && Math.round(title.left),
      footerLogoLeft: footerLogo && Math.round(footerLogo.left),
    },
    header: { nav: vis('#site-header .site-header__nav'), cta: vis('#site-header .site-header__cta'), burger: vis('#site-header button[aria-haspopup=dialog]'), partner: vis('#site-header .site-header__partner') },
    pageHeight: de.scrollHeight,
  }
}

/** Текст, который не помещается в свой блок (вылезает или обрезан), при крупном шрифте. */
function overflowText() {
  const vw = document.documentElement.clientWidth
  const out = []
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,button,label,li,dt,dd,summary,legend,span,input,textarea')) {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || el.closest('[aria-hidden=true]') || el.closest('.sr-only')) continue
    const over = el.scrollWidth - el.clientWidth
    const outside = r.right > vw + 1 || r.left < -1
    if ((over > 2 && s.display !== 'inline' && s.overflowX !== 'auto' && s.overflowX !== 'scroll') || outside) {
      // ленты с прокруткой (кейсы, отзывы) — не дефект
      let scroller = false
      for (let n = el.parentElement; n; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX
        if (ox === 'auto' || ox === 'scroll') {
          scroller = true
          break
        }
      }
      if (outside && scroller) continue
      out.push({ el: el.tagName.toLowerCase() + '.' + [...el.classList].slice(0, 2).join('.'), text: (el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 50), over, left: Math.round(r.left), right: Math.round(r.right), overflowX: s.overflowX })
    }
  }
  return out
}

async function probe(browser, name, contextOptions, { font200 = false, shots = [] } = {}) {
  const context = await browser.newContext(contextOptions)
  if (font200) {
    await context.addInitScript(() => {
      const add = () => {
        const s = document.createElement('style')
        s.textContent = 'html{font-size:200%}'
        document.head.append(s)
      }
      if (document.head) add()
      else document.addEventListener('DOMContentLoaded', add)
    })
  }
  const page = await context.newPage()
  const logs = []
  page.on('crash', () => logs.push('CRASH: страница упала'))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text().slice(0, 300)}`)
  })
  page.on('pageerror', (e) => logs.push(`pageerror: ${String(e).slice(0, 300)}`))
  page.on('requestfailed', (r) => {
    if (!r.url().includes('_rsc=')) logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`)
  })
  page.on('response', (r) => {
    if (r.status() >= 400) logs.push(`http ${r.status()}: ${r.url()}`)
  })
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(1200)
  const first = await page.evaluate(measure)
  await scrollThrough(page, { pause: 150 })
  await sleep(1500)
  const after = await page.evaluate(measure)
  let text = null
  if (font200) text = await page.evaluate(overflowText)
  for (const [label, sel] of shots) {
    if (sel) await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: 'instant', block: 'start' }), sel)
    await sleep(900)
    save(`xbrowser/${name}-${label}.png`, await page.screenshot())
  }
  await context.close()
  return { first, after, logs, text }
}

const results = {}
const engines = process.argv[2] ? [process.argv[2]] : ['chromium', 'webkit']
const safe = async (key, fn) => {
  try {
    return await fn()
  } catch (e) {
    console.log(key, 'ОШИБКА', String(e).split('\n')[0].slice(0, 200))
    return { error: String(e).slice(0, 400) }
  }
}
for (const engine of engines) {
  let browser = await launch(engine)
  for (const [w, h] of sizes) {
    const key = `${engine}-${w}`
    if (!browser.isConnected()) browser = await launch(engine)
    results[key] = await safe(key, () => probe(browser, key, { viewport: { width: w, height: h } }, { shots: [['first', null]] }))
    const r = results[key]
    if (r.error) continue
    console.log(
      key.padEnd(16),
      `hScroll=${r.first.hScroll}/${r.after.hScroll} sw=${r.after.scrollWidth} cw=${r.after.clientWidth}`,
      `поля: лого ${r.after.margins.logoLeft} cta ${r.after.margins.ctaRight} бургер ${r.after.margins.burgerRight} h2 ${r.after.margins.titleLeft} подвал ${r.after.margins.footerLogoLeft}`,
      `шапка ${JSON.stringify(r.after.header)}`,
      `вылезают: ${r.after.offendersCount}`,
      r.logs.length ? `\n   консоль/сеть: ${r.logs.join(' | ')}` : '',
    )
    if (r.after.offendersCount) console.log('   ', JSON.stringify(r.after.offenders.slice(0, 6)))
  }
  // Шрифт 200 % на 390
  const key = `${engine}-390-font200`
  if (!browser.isConnected()) browser = await launch(engine)
  results[key] = await safe(key, () => probe(browser, key, { viewport: { width: 390, height: 844 } }, {
    font200: true,
    shots: [
      ['hero', null],
      ['difference', '#difference'],
      ['quiz', '#quiz'],
      ['process', '#process'],
      ['cases', '#cases'],
      ['reviews', '#reviews'],
      ['team', '#team'],
      ['faq', '#faq'],
      ['contact', '#contact'],
      ['footer', 'footer'],
    ],
  }))
  const r = results[key]
  if (r.error) {
    await browser.close().catch(() => {})
    continue
  }
  console.log(key, `hScroll=${r.after.hScroll} sw=${r.after.scrollWidth} cw=${r.after.clientWidth} вылезают: ${r.after.offendersCount} текст не помещается: ${r.text.length}`, r.logs.join(' | '))
  for (const t of r.text.slice(0, 25)) console.log('    ', JSON.stringify(t))
  await browser.close()
}

save(`xbrowser/results-${engines.join('-')}.json`, results)
