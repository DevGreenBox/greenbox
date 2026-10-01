// Контраст текста секций B в обеих темах и в состояниях форм: каждый текстовый узел против
// фактического фона (полупрозрачные слои смешиваются с подложкой). Порог 4.5, крупный текст — 3.
// Запуск: node contrast.mjs http://localhost:3100 [chromium|webkit]
import { createRequire } from 'node:module'
import { freezeHmr } from './hmr.mjs'

const require = createRequire('/home/coder/novi/render-lab/package.json')
const pw = require('playwright-core')
const base = process.argv[2] ?? 'http://localhost:3100'
const browser = await pw.chromium.launch({ executablePath: '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome' })

function audit(ids) {
  const parse = (c) => {
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
    if (c.startsWith('color(srgb')) return [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1]
    return [m[0], m[1], m[2], m[3] ?? 1]
  }
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]))
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      v /= 255
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  // Фон под элементом: слои от корня к элементу, каждый полупрозрачный — поверх предыдущего.
  const background = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) layers.push(parse(getComputedStyle(n).backgroundColor))
    let bg = [255, 255, 255]
    for (const layer of layers.reverse()) if (layer[3] > 0) bg = over(layer, bg)
    return bg
  }
  const rows = []
  for (const id of ids) {
    const root = document.getElementById(id)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim()
      const el = node.parentElement
      if (!text || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      if (el.closest('.sr-only,[aria-hidden="true"]:not([class*="progress"])')) continue
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      const size = parseFloat(cs.fontSize)
      const bold = Number(cs.fontWeight) >= 700
      const large = size >= 24 || (bold && size >= 18.66)
      const bg = background(el)
      const fg = over(parse(cs.color), bg)
      const value = ratio(fg, bg)
      rows.push({ id, text: text.slice(0, 40), size, value: Math.round(value * 100) / 100, min: large ? 3 : 4.5 })
    }
  }
  return rows
}

const report = []
for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await freezeHmr(context)
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const page = await context.newPage()
  await page.goto(base + '/', { waitUntil: 'load' })
  await page.waitForFunction(() => [...document.forms].filter((f) => f.noValidate).length === 2)
  const quiz = page.locator('#quiz')
  const collect = async (state, ids) => {
    for (const row of await page.evaluate(audit, ids)) report.push({ theme, state, ...row })
  }
  await collect('покой', ['quiz', 'process', 'contact'])
  // шаг 4: выбранные чипы и плашка СДЭК
  for (let i = 0; i < 3; i++) await quiz.getByRole('button', { name: 'Далее' }).click()
  await quiz.locator('input.chip__input[value="СДЭК"]').check()
  await quiz.locator('input[name="answers.sdekContract"]').check()
  await collect('квиз: шаг 4', ['quiz'])
  // контакты: ошибки полей, ошибка сервера, успех (ответы подменены)
  await quiz.getByRole('button', { name: 'Сразу оставить контакты' }).click()
  const reply = (status, body) => page.route('**/api/lead', (r) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }))
  await reply(400, { ok: false, fields: { name: 'Укажите имя', contact: 'Укажите телефон, Telegram или email', consent: 'Нужно согласие на обработку персональных данных' } })
  await quiz.getByRole('button', { name: 'Отправить' }).click()
  await quiz.locator('.field__error').first().waitFor()
  await page.locator('#contact').getByRole('button', { name: 'Отправить' }).click()
  await page.locator('#contact .field__error').first().waitFor()
  await collect('ошибки полей', ['quiz', 'contact'])
  await page.unroute('**/api/lead')
  await reply(502, { ok: false, error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram @infogreenbox' })
  await quiz.getByLabel('Имя').fill('Анна')
  await quiz.getByLabel('Как с вами связаться').fill('@anna')
  await quiz.locator('input[name="consent"]').check()
  await quiz.getByRole('button', { name: 'Отправить' }).click()
  await quiz.getByRole('alert').waitFor()
  const contact = page.locator('#contact')
  await contact.getByLabel('Имя').fill('Анна')
  await contact.getByLabel('Как с вами связаться').fill('@anna')
  await contact.locator('input[name="consent"]').check()
  await contact.getByRole('button', { name: 'Отправить' }).click()
  await contact.getByRole('alert').waitFor()
  await collect('ошибка сервера', ['quiz', 'contact'])
  await page.unroute('**/api/lead')
  await reply(200, { ok: true })
  await quiz.getByRole('button', { name: 'Попробовать ещё раз' }).click()
  await contact.getByRole('button', { name: 'Попробовать ещё раз' }).click()
  await contact.getByText('Заявка отправлена.').waitFor()
  await quiz.getByText('Заявка отправлена.').waitFor()
  await collect('успех', ['quiz', 'contact'])
  await context.close()
}

const bad = report.filter((r) => r.value < r.min)
const byState = {}
for (const r of report) {
  const key = `${r.theme} · ${r.state}`
  byState[key] = Math.min(byState[key] ?? 99, r.value)
}
console.log('проверено текстов', report.length)
console.log('минимум по состояниям', JSON.stringify(byState, null, 1))
console.log('ниже порога', bad.length ? JSON.stringify(bad, null, 1) : 'нет')
await browser.close()
