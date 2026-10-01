// Формы через интерфейс: финальная форма — ошибка согласия, затем успех; без JS — /lead/sent и /lead/error.
// Успешная отправка квиза уже сделана с клавиатуры в kbd.mjs (ТЕСТ verify квиз). Chromium.
import { BASE, launch, save, sleep } from './lib.mjs'

const results = {}
const browser = await launch()

// 1. Финальная форма с JS
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.31' } })
  const page = await context.newPage()
  const api = []
  page.on('response', async (r) => {
    if (r.url().endsWith('/api/lead')) api.push({ status: r.status(), body: await r.text().catch(() => '') })
  })
  await page.goto(BASE + '/#contact', { waitUntil: 'load' })
  await sleep(2000)
  const form = page.locator('#contact form')
  await form.getByLabel('Имя').fill('ТЕСТ verify форма')
  await form.getByLabel('Как с вами связаться').fill('test-form@example.invalid')
  await form.getByLabel('Пара слов о задаче').fill('Проверка формы, удалить')
  // без согласия
  await form.locator('button[type=submit]').click()
  await page.waitForSelector('#contact [aria-invalid=true]', { timeout: 8000 }).catch(() => {})
  await sleep(300)
  const consentError = await page.evaluate(() => {
    const cb = document.querySelector('#contact input[name=consent]')
    const ids = (cb?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
    return {
      invalid: cb?.getAttribute('aria-invalid'),
      describedBy: ids.map((id) => document.getElementById(id)?.textContent.trim()),
      activeIsConsent: document.activeElement === cb,
      errorsShown: [...document.querySelectorAll('#contact .field__error')].map((e) => e.textContent.trim()),
      alert: [...document.querySelectorAll('#contact [role=alert]')].map((e) => e.textContent.trim()),
      valuesKept: [...document.querySelectorAll('#contact input[name=name], #contact input[name=contact]')].map((i) => i.value),
    }
  })
  save('forms/contact-consent-error.png', await page.locator('#contact').screenshot())
  // согласие и повтор
  await form.locator('input[name=consent]').check()
  await sleep(200)
  const errorClearedOnChange = await page.evaluate(() => document.querySelector('#contact input[name=consent]')?.getAttribute('aria-invalid') === null)
  await form.locator('button[type=submit]').click()
  await page.waitForFunction(() => /отправлена/i.test(document.querySelector('#contact h3')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => {})
  await sleep(500)
  const success = await page.evaluate(() => ({
    heading: document.querySelector('#contact h3')?.textContent.trim(),
    focused: document.activeElement?.tagName + ' ' + document.activeElement?.textContent.trim().slice(0, 40),
    summary: [...document.querySelectorAll('#contact dl div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()),
  }))
  save('forms/contact-success.png', await page.locator('#contact').screenshot())
  results.contactJs = { consentError, errorClearedOnChange, success, api }
  console.log('Финальная форма (JS):', JSON.stringify(results.contactJs, null, 1))
  await context.close()
}

// 2. Без JS: финальная форма → /lead/sent, квиз с именем из пробелов → /lead/error
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false, extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.32' } })
  const page = await context.newPage()
  const hops = []
  page.on('response', (r) => {
    if (/\/api\/lead|\/lead\//.test(r.url())) hops.push(`${r.request().method()} ${r.url().replace(BASE, '')} → ${r.status()}${r.headers().location ? ' ' + r.headers().location : ''}`)
  })
  const run = async (label, fn) => {
    try {
      return await Promise.race([fn(), sleep(30000).then(() => ({ error: 'таймаут 30 с' }))])
    } catch (e) {
      return { error: String(e).slice(0, 300) }
    }
  }
  results.noJsSent = await run('sent', async () => {
    await page.goto(BASE + '/#contact', { waitUntil: 'load' })
    const form = page.locator('#contact form')
    await form.locator('input[name=name]').fill('ТЕСТ verify без JS')
    await form.locator('input[name=contact]').fill('test-nojs@example.invalid')
    await form.locator('input[name=consent]').check()
    await Promise.all([page.waitForURL(/\/lead\//, { timeout: 15000 }), form.locator('button[type=submit]').click()])
    const h1 = await page.locator('h1').textContent()
    const back = await page.locator('main a').evaluateAll((as) => as.map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`))
    save('forms/nojs-sent.png', await page.screenshot())
    return { url: page.url().replace(BASE, ''), h1, links: back }
  })
  results.noJsError = await run('error', async () => {
    await page.goto(BASE + '/#quiz', { waitUntil: 'load' })
    const form = page.locator('#quiz form')
    await form.locator('input[name=name]').fill('   ')
    await form.locator('input[name=contact]').fill('test-nojs-err@example.invalid')
    await form.locator('input[name=consent]').check()
    await Promise.all([page.waitForURL(/\/lead\//, { timeout: 15000 }), form.locator('button[type=submit]').click()])
    const h1 = await page.locator('h1').textContent()
    const text = (await page.locator('main').textContent()).replace(/\s+/g, ' ').trim().slice(0, 400)
    const back = await page.locator('main a').evaluateAll((as) => as.map((a) => `${a.textContent.trim()} → ${a.getAttribute('href')}`))
    save('forms/nojs-error.png', await page.screenshot())
    return { url: page.url().replace(BASE, ''), h1, text, links: back }
  })
  // Браузер без JS сам не пускает форму без согласия (required)
  results.noJsRequired = await run('required', async () => {
    await page.goto(BASE + '/#contact', { waitUntil: 'load' })
    const form = page.locator('#contact form')
    await form.locator('input[name=name]').fill('ТЕСТ verify required')
    await form.locator('input[name=contact]').fill('test@example.invalid')
    await form.locator('button[type=submit]').click()
    await sleep(1500)
    return { stayed: page.url().replace(BASE, ''), consentValid: await form.locator('input[name=consent]').evaluate((i) => i.validity.valid).catch((e) => 'evaluate без JS: ' + String(e).slice(0, 80)) }
  })
  results.noJsHops = hops
  console.log('Без JS:', JSON.stringify({ sent: results.noJsSent, error: results.noJsError, required: results.noJsRequired, hops }, null, 1))
  await context.close()
}

await browser.close()
save('forms/results.json', results)
