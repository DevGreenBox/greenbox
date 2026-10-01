// Без JS (javaScriptEnabled: false): финальная форма уходит обычным POST и ведёт на /lead/sent.
// Инструменты Playwright, которым нужен JS в странице, тут висят — только клавиатура и сеть. Основа — verify/forms-nojs.mjs.
import { BASE, launch, save, sleep } from './lib.mjs'

const browser = await launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false, extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.41' } })
const page = await context.newPage()
const hops = []
page.on('response', (r) => {
  if (/\/api\/lead|\/lead\//.test(r.url())) hops.push(`${r.request().method()} ${r.url().replace(BASE, '')} → ${r.status()}${r.headers().location ? ' → ' + r.headers().location : ''}`)
})
const k = page.keyboard
const result = await Promise.race([
  (async () => {
    await page.goto(BASE + '/#contact', { waitUntil: 'load' })
    await k.press('Tab')
    await k.type('ТЕСТ final без JS')
    await k.press('Tab')
    await k.type('test-final-nojs@example.invalid')
    await k.press('Tab')
    await k.type('Итоговый замер без JS, удалить')
    await k.press('Tab')
    await k.press('Space') // согласие
    await k.press('Tab') // ссылка в подписи
    await k.press('Tab') // кнопка
    save('forms/nojs-filled.png', await page.screenshot())
    await Promise.all([page.waitForURL(/\/lead\//, { timeout: 15000 }), k.press('Enter')])
    await sleep(500)
    save('forms/nojs-sent.png', await page.screenshot())
    return { url: page.url().replace(BASE, '') }
  })(),
  sleep(40000).then(() => ({ error: 'таймаут 40 с' })),
]).catch((e) => ({ error: String(e).slice(0, 300) }))
await browser.close()

if (result.url) {
  const html = await (await fetch(BASE + result.url)).text()
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
  result.h1 = main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim()
  result.text = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
  result.links = [...main.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => `${m[2].replace(/<[^>]+>/g, '').trim()} → ${m[1]}`)
}
result.hops = hops
console.log(JSON.stringify(result, null, 1))
save('forms/results-nojs.json', result)
