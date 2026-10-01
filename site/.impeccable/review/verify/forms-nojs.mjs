// Формы без JS (javaScriptEnabled: false). Инструменты Playwright, которым нужен JS в странице, тут висят,
// поэтому только клавиатура и сеть: переход на якорь формы, Tab по полям, ввод, Enter на кнопке.
import { BASE, launch, save, sleep } from './lib.mjs'

const browser = await launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false, extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.41' } })
const page = await context.newPage()
const hops = []
page.on('response', (r) => {
  if (/\/api\/lead|\/lead\//.test(r.url())) hops.push(`${r.request().method()} ${r.url().replace(BASE, '')} → ${r.status()}${r.headers().location ? ' → ' + r.headers().location : ''}`)
})
const guard = (fn) => Promise.race([fn(), sleep(30000).then(() => ({ error: 'таймаут' }))]).catch((e) => ({ error: String(e).slice(0, 200) }))
const k = page.keyboard

const results = {}
// 1. Согласие не отмечено: браузер сам не отправляет (required)
results.required = await guard(async () => {
  await page.goto(BASE + '/#contact', { waitUntil: 'load' })
  const before = hops.length
  await k.press('Tab')
  await k.type('ТЕСТ verify required')
  await k.press('Tab')
  await k.type('test-required@example.invalid')
  await k.press('Tab') // комментарий
  await k.press('Tab') // согласие — не отмечаем
  await k.press('Tab') // ссылка в подписи
  await k.press('Tab') // кнопка
  await k.press('Enter')
  await sleep(2000)
  save('forms/nojs-required.png', await page.screenshot())
  return { url: page.url().replace(BASE, ''), posted: hops.length > before }
})
// 2. Финальная форма → /lead/sent
results.sent = await guard(async () => {
  await page.goto(BASE + '/privacy', { waitUntil: 'load' }) // сбросить форму
  await page.goto(BASE + '/#contact', { waitUntil: 'load' })
  await k.press('Tab')
  await k.type('ТЕСТ verify без JS')
  await k.press('Tab')
  await k.type('test-nojs@example.invalid')
  await k.press('Tab')
  await k.type('Проверка без JS, удалить')
  await k.press('Tab')
  await k.press('Space') // согласие
  await k.press('Tab')
  await k.press('Tab')
  await Promise.all([page.waitForURL(/\/lead\//, { timeout: 15000 }), k.press('Enter')])
  await sleep(500)
  save('forms/nojs-sent.png', await page.screenshot())
  return { url: page.url().replace(BASE, '') }
})
// 3. Квиз: имя из пробелов (required пропускает, сервер — нет) → /lead/error
results.error = await guard(async () => {
  await page.goto(BASE + '/#quiz-contacts', { waitUntil: 'load' })
  await k.press('Tab')
  await k.type('   ')
  await k.press('Tab')
  await k.type('test-nojs-err@example.invalid')
  await k.press('Tab')
  await k.press('Tab')
  await k.press('Space')
  await k.press('Tab')
  await k.press('Tab')
  await Promise.all([page.waitForURL(/\/lead\//, { timeout: 15000 }), k.press('Enter')])
  await sleep(500)
  save('forms/nojs-error.png', await page.screenshot())
  return { url: page.url().replace(BASE, '') }
})
results.hops = hops
console.log(JSON.stringify(results, null, 1))
await browser.close()

// Текст итоговых страниц — обычным запросом (тот же HTML, что получил браузер)
for (const key of ['sent', 'error']) {
  const url = results[key]?.url
  if (!url) continue
  const html = await (await fetch(BASE + url)).text()
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
  results[key].h1 = main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim()
  results[key].text = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)
  results[key].links = [...main.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => `${m[2].replace(/<[^>]+>/g, '').trim()} → ${m[1]}`)
}
save('forms/results-nojs.json', results)
console.log(JSON.stringify({ sent: results.sent, error: results.error }, null, 1))
