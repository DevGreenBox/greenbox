// Кейсы на ленте (до 1024 px): видна ли ссылка «Открыть сайт» чётной карточки после Tab. Кадры + scrollLeft.
// Плюс оформление ссылок в тексте (подчёркивание) для link-in-text-block.
import { BASE, launch, save, sleep } from './lib.mjs'

const results = {}
for (const engine of ['chromium', 'webkit']) {
  const browser = await launch(engine)
  for (const [w, h] of [
    [390, 844],
    [768, 1024],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(1200)
    await page.evaluate(() => document.getElementById('cases').scrollIntoView({ behavior: 'instant' }))
    await sleep(800)
    await page.locator('#cases-title').click()
    const rows = []
    for (let i = 1; i <= 4; i++) {
      await page.keyboard.press('Tab')
      await sleep(1500)
      const d = await page.evaluate(() => {
        const el = document.activeElement
        const vp = document.querySelector('#cases [data-viewport]')
        const r = el.getBoundingClientRect()
        const vw = document.documentElement.clientWidth
        const card = el.closest('[data-item]')
        const idx = card ? [...card.parentElement.children].indexOf(card) + 1 : null
        return {
          card: idx,
          text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
          linkLeft: Math.round(r.left),
          linkRight: Math.round(r.right),
          visiblePx: Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)),
          width: Math.round(r.width),
          scrollLeft: Math.round(vp.scrollLeft),
          snap: getComputedStyle(vp).scrollSnapType,
          counter: document.querySelector('#cases [data-now]')?.textContent,
        }
      })
      rows.push(d)
      save(`cases/${engine}-${w}-tab${i}.png`, await page.screenshot())
    }
    results[`${engine}-${w}`] = rows
    console.log(engine, w)
    for (const r of rows) console.log('   ', JSON.stringify(r))
    await context.close()
  }
  // ссылки в тексте: подчёркнуты ли
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  for (const url of ['/', '/privacy', '/lead/error?from=contact&field=consent', '/lead/sent?from=quiz']) {
    await page.goto(BASE + url, { waitUntil: 'load' })
    await sleep(500)
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('main a:not([class]), .check__label a')].map((a) => {
        const s = getComputedStyle(a)
        const p = getComputedStyle(a.parentElement)
        return { text: a.textContent.trim().slice(0, 40), decoration: s.textDecorationLine, color: s.color, parentColor: p.color, weight: s.fontWeight, parentWeight: p.fontWeight }
      }),
    )
    results[`${engine}-links-${url}`] = links
    console.log(engine, 'ссылки в тексте', url, JSON.stringify(links))
  }
  await context.close()
  await browser.close()
}
save('cases/results.json', results)
