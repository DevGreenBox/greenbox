// Кадры мест, где при шрифте 200 % на 390 текст шире блока: бургер, подписи переключателей демо, кнопка «Получить бесплатный макет».
import { BASE, launch, save, sleep } from './lib.mjs'

const browser = await launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await context.addInitScript(() => {
  const add = () => {
    const s = document.createElement('style')
    s.textContent = 'html{font-size:200%}'
    document.head.append(s)
  }
  if (document.head) add()
  else document.addEventListener('DOMContentLoaded', add)
})
const page = await context.newPage()
await page.goto(BASE + '/', { waitUntil: 'load' })
await sleep(5000)
const shot = async (name, locator) => {
  await locator.scrollIntoViewIfNeeded()
  await sleep(1600)
  const box = await locator.boundingBox()
  save(`xbrowser/font200-${name}.png`, await page.screenshot({ clip: { x: Math.max(0, box.x - 16), y: Math.max(0, box.y - 16), width: Math.min(390 - Math.max(0, box.x - 16), box.width + 32), height: box.height + 32 } }))
  return box
}
const out = {
  burger: await shot('burger', page.getByRole('button', { name: 'Меню', exact: true })),
  switches: await shot('switches', page.locator('#top [role=group]')),
  cta: await shot('why-cta', page.getByRole('link', { name: 'Получить бесплатный макет' })),
}
console.log(JSON.stringify(out))
await browser.close()
