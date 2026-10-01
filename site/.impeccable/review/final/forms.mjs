// Формы с JS: финальная форма — ошибка согласия, затем одна успешная отправка; honeypot — ответ «успех», в лог не пишется.
// Квиз отправляется один раз в kbd.mjs (только клавиатура). Chromium. Основа — verify/forms.mjs.
import { existsSync, readFileSync } from 'node:fs'
import { BASE, LEADS, launch, save, sleep } from './lib.mjs'

const logLines = () => (existsSync(LEADS) ? readFileSync(LEADS, 'utf8').split('\n').filter(Boolean) : [])
const results = {}
const browser = await launch()

async function openContact(ip) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': ip } })
  const page = await context.newPage()
  const api = []
  page.on('response', async (r) => {
    if (r.url().endsWith('/api/lead')) api.push({ status: r.status(), body: await r.text().catch(() => '') })
  })
  await page.goto(BASE + '/#contact', { waitUntil: 'load' })
  // остров формы гидратируется у экрана
  await page.waitForFunction(() => document.querySelector('#contact form')?.noValidate === true, null, { timeout: 15000 })
  await sleep(500)
  return { context, page, api, form: page.locator('#contact form') }
}

// 1. Финальная форма: без согласия → ошибка; с согласием → одна отправка
{
  const before = logLines().length
  const { context, page, api, form } = await openContact('198.51.100.31')
  await form.getByLabel('Имя').fill('ТЕСТ final форма')
  await form.getByLabel('Как с вами связаться').fill('test-final-form@example.invalid')
  await form.getByLabel('Пара слов о задаче').fill('Итоговый замер, удалить')
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
      errorsShown: [...document.querySelectorAll('#contact .field__error, #contact [id$="-error"]')].map((e) => e.textContent.trim()).filter(Boolean),
      valuesKept: [...document.querySelectorAll('#contact input[name=name], #contact input[name=contact]')].map((i) => i.value),
    }
  })
  const logAfterError = logLines().length - before
  save('forms/contact-consent-error.png', await page.locator('#contact').screenshot())
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
  const added = logLines().slice(before)
  results.contact = { consentError, logAfterError, errorClearedOnChange, success, api, logAdded: added.length, logLine: added[0] ? JSON.parse(added[0]) : null }
  console.log('Финальная форма:', JSON.stringify(results.contact, null, 1))
  await context.close()
}

// 2. Honeypot: скрытое поле website заполнено — посетителю «успех», заявка в лог не попадает
{
  const before = logLines().length
  const { context, page, api, form } = await openContact('198.51.100.32')
  const hp = await page.evaluate(() => {
    const i = document.querySelector('#contact input[name=website]')
    const r = i.getBoundingClientRect()
    return { tabIndex: i.tabIndex, ariaHiddenWrap: !!i.closest('[aria-hidden=true]'), size: `${Math.round(r.width)}×${Math.round(r.height)}` }
  })
  await form.getByLabel('Имя').fill('ТЕСТ final бот')
  await form.getByLabel('Как с вами связаться').fill('test-final-bot@example.invalid')
  await page.evaluate(() => {
    document.querySelector('#contact input[name=website]').value = 'https://spam.example'
  })
  await form.locator('input[name=consent]').check()
  await form.locator('button[type=submit]').click()
  await page.waitForFunction(() => /отправлена/i.test(document.querySelector('#contact h3')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => {})
  await sleep(800)
  const heading = await page.evaluate(() => document.querySelector('#contact h3')?.textContent.trim())
  results.honeypot = { field: hp, api, heading, logAdded: logLines().length - before }
  console.log('Honeypot:', JSON.stringify(results.honeypot, null, 1))
  await context.close()
}

await browser.close()
save('forms/results.json', results)
