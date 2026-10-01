// Снимки секций B (квиз, «Как мы работаем», финал) и страниц итога без JS.
// Запуск (нужен dev-сервер): node shoot.mjs http://localhost:3100 r1 [chromium|webkit]
// Ответы /api/lead в снимках состояний подменяются (ошибки полей, успех, 502): лог заявок не растёт.
// Живые отправки проверяются отдельно (см. отчёт агента B).
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { freezeHmr } from './hmr.mjs'

const require = createRequire('/home/coder/novi/render-lab/package.json')
const pw = require('playwright-core')
const out = dirname(fileURLToPath(import.meta.url))
const base = process.argv[2] ?? 'http://localhost:3100'
const tag = process.argv[3] ?? 'r1'
const engine = process.argv[4] ?? 'chromium'
const themes = (process.argv[5] ?? 'light,dark').split(',')
const widths = (process.argv[6] ?? '1440,390').split(',').map(Number)
const only = process.argv[7] // 'pages' — только страницы итога без JS
const browser =
  engine === 'webkit'
    ? await pw.webkit.launch()
    : await pw.chromium.launch({ executablePath: '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome' })
const prefix = engine === 'webkit' ? 'wk-' : ''
const hideDev = 'nextjs-portal{display:none!important}'
const shots = []
const problems = []

async function open(path, { width, theme, reduced = false, js = true, header = true }) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    deviceScaleFactor: width < 600 ? 2 : 1,
    // WebKit в этом окружении падает на долгой плавной прокрутке длинной страницы — снимаем его итоговые кадры.
    reducedMotion: reduced || engine === 'webkit' ? 'reduce' : 'no-preference',
    javaScriptEnabled: js,
  })
  if (js) await freezeHmr(context)
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const page = await context.newPage()
  page.on('pageerror', (e) => problems.push(`pageerror ${path} ${e.message}`))
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return
    if (/status of (400|502)|HMR|Fast Refresh/.test(m.text())) return // подменённые ответы и dev-сервер
    problems.push(`console ${m.type()} ${path} ${m.text().slice(0, 160)}`)
  })
  await page.goto(base + path, { waitUntil: 'load' })
  if (!js) return { page, context } // addStyleTag без JS роняет вкладку; оверлея Next без JS и нет
  if (path === '/') await page.waitForFunction(() => [...document.forms].filter((f) => f.noValidate).length === 2)
  // В снимках секций фиксированная шапка ложится поверх кадра — прячем; в полных кадрах она остаётся.
  await page.addStyleTag({ content: hideDev + (header ? '' : '.site-header{visibility:hidden!important}') })
  await page.evaluate(() => document.fonts.ready)
  return { page, context }
}

const name = (s) => `${prefix}${s}-${tag}.png`
async function shoot(target, file) {
  await target.screenshot({ path: join(out, file), animations: 'disabled' })
  shots.push(file)
}

/** Секция в кадре: пройти её прокруткой (Reveal проявляет всё, что ниже экрана), вернуться к началу. */
async function section(page, id, wait = 1800) {
  await page.evaluate(async (id) => {
    const el = document.getElementById(id)
    for (let y = 0; y < el.offsetHeight; y += innerHeight * 0.6) {
      scrollTo({ top: el.offsetTop + y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 120))
    }
    el.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, id)
  await page.waitForTimeout(wait)
  return page.locator(`#${id}`)
}

const fieldsReply = { ok: false, error: 'Проверьте поля формы', fields: { consent: 'Нужно согласие на обработку персональных данных' } }
const emptyReply = {
  ok: false,
  error: 'Проверьте поля формы',
  fields: { name: 'Укажите имя', contact: 'Укажите телефон, Telegram или email', consent: 'Нужно согласие на обработку персональных данных' },
}
const serverReply = { ok: false, error: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram @infogreenbox' }
const mock = (page, status, body) =>
  page.route('**/api/lead', (r) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }))

const answers = [['Дом и интерьер'], ['Интернет-магазин'], ['Онлайн-оплата', 'Фильтры и поиск', 'Акции и промокоды'], ['СДЭК', '1С', 'МойСклад'], ['1 000–10 000']]

for (const theme of themes) {
  for (const width of widths) {
    const w = `${width}-${theme}`

    // ---------- Квиз: шаги, ошибки, ошибка сервера, успех ----------
    if (!only) {
      const { page, context } = await open('/', { width, theme, header: false })
      let quiz = await section(page, 'quiz')
      for (let i = 0; i < 5; i++) {
        for (const value of answers[i]) await quiz.locator(`input.chip__input[value="${value}"]`).check()
        if (i === 3) await quiz.locator('input[name="answers.sdekContract"]').check()
        await page.waitForTimeout(300)
        await shoot(quiz, name(`quiz-${w}-step${i + 1}`))
        await quiz.getByRole('button', { name: 'Далее' }).click()
        await page.waitForTimeout(900)
        quiz = await section(page, 'quiz', 200)
      }
      await shoot(quiz, name(`quiz-${w}-step6-contacts`))
      // пустые контакты → три ошибки у полей
      await mock(page, 400, emptyReply)
      await quiz.getByRole('button', { name: 'Отправить' }).click()
      await quiz.locator('.field__error').first().waitFor()
      await page.waitForTimeout(700)
      await shoot(quiz, name(`quiz-${w}-errors`))
      // заполнено, без согласия → ошибка согласия
      await quiz.getByLabel('Имя').fill('Анна')
      await quiz.getByLabel('Как с вами связаться').fill('@anna_shop')
      await quiz.getByLabel('Комментарий').fill('Магазин мебели, сейчас продаём на маркетплейсах')
      await page.unroute('**/api/lead')
      await mock(page, 400, fieldsReply)
      await quiz.getByRole('button', { name: 'Отправить' }).click()
      await quiz.locator('.field__error').first().waitFor()
      await page.waitForTimeout(700)
      await shoot(quiz, name(`quiz-${w}-error-consent`))
      // отправка: кнопка с загрузкой (ответ задержан)
      await quiz.locator('input[name="consent"]').check()
      await page.unroute('**/api/lead')
      let release
      await page.route('**/api/lead', async (r) => {
        await new Promise((ok) => (release = ok))
        await r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify(serverReply) })
      })
      await quiz.getByRole('button', { name: 'Отправить' }).click()
      await page.waitForTimeout(400)
      await shoot(quiz.locator('[class*="__nav"]').first(), name(`quiz-${w}-sending`))
      release()
      await quiz.getByRole('alert').waitFor()
      await page.waitForTimeout(700)
      await shoot(quiz, name(`quiz-${w}-server-error`))
      await page.unroute('**/api/lead')
      await mock(page, 200, { ok: true })
      await quiz.getByRole('button', { name: 'Попробовать ещё раз' }).click()
      await quiz.getByText('Заявка отправлена.').waitFor()
      await page.waitForTimeout(900)
      const focus = await page.evaluate(() => document.activeElement?.textContent?.trim())
      if (!focus?.startsWith('Заявка отправлена')) problems.push(`focus after success ${w}: ${focus}`)
      await shoot(await section(page, 'quiz', 300), name(`quiz-${w}-success`))
      await context.close()
    }

    // ---------- «Как мы работаем»: середина появления (свежая вкладка) и итог ----------
    if (!only) {
      const { page, context } = await open('/', { width, theme, header: false })
      await page.evaluate(() => document.getElementById('process').scrollIntoView({ block: 'start', behavior: 'instant' }))
      await page.waitForTimeout(700)
      await page.screenshot({ path: join(out, name(`process-${w}-reveal-midway`)) })
      shots.push(name(`process-${w}-reveal-midway`))
      await shoot(await section(page, 'process', 2600), name(`process-${w}`))
      await context.close()
    }

    // ---------- Финал: пусто, ошибки, ошибка сервера, успех ----------
    if (!only) {
      const { page, context } = await open('/', { width, theme, header: false })
      let contact = await section(page, 'contact')
      await shoot(contact, name(`contact-${w}`))
      await mock(page, 400, emptyReply)
      await contact.getByRole('button', { name: 'Отправить' }).click()
      await contact.locator('.field__error').first().waitFor()
      await page.waitForTimeout(700)
      await shoot(await section(page, 'contact', 200), name(`contact-${w}-errors`))
      await contact.getByLabel('Имя').fill('Анна')
      await contact.getByLabel('Как с вами связаться').fill('+7 900 123-45-67')
      await contact.getByLabel('Пара слов о задаче').fill('Нужен каталог с заявками для оптовых клиентов')
      await contact.locator('input[name="consent"]').check()
      await page.unroute('**/api/lead')
      await mock(page, 502, serverReply)
      await contact.getByRole('button', { name: 'Отправить' }).click()
      await contact.getByRole('alert').waitFor()
      await page.waitForTimeout(700)
      await shoot(await section(page, 'contact', 200), name(`contact-${w}-server-error`))
      await page.unroute('**/api/lead')
      await mock(page, 200, { ok: true })
      await contact.getByRole('button', { name: 'Попробовать ещё раз' }).click()
      await contact.getByText('Заявка отправлена.').waitFor()
      await page.waitForTimeout(900)
      contact = await section(page, 'contact', 300)
      await shoot(contact, name(`contact-${w}-success`))
      await context.close()
    }

    // ---------- Полная страница, reduced-motion ----------
    if (!only) {
      const { page, context } = await open('/', { width, theme, reduced: true })
      await page.waitForTimeout(500)
      await page.screenshot({ path: join(out, name(`home-${w}-full-reduced`)), fullPage: true })
      shots.push(name(`home-${w}-full-reduced`))
      await context.close()
    }

    // ---------- Без JS: квиз одной формой, страницы итога ----------
    {
      // Без JS тему даёт система; reducedMotion — без плавной прокрутки, иначе снимок элемента «плавает».
      const { page, context } = await open('/', { width, theme, js: false, reduced: true })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      // Без JS стиль в страницу не вставить: шапку ставим в поток через ответ с CSS, иначе она ложится на кадр.
      await page.route(/\.css(\?|$)/, async (route) => {
        const res = await route.fetch()
        await route.fulfill({ response: res, body: (await res.text()) + '\n.site-header{position:absolute!important}' })
      })
      await page.reload({ waitUntil: 'load' })
      await shoot(page.locator('#quiz'), name(`quiz-${w}-nojs`))
      await page.unroute(/\.css(\?|$)/)
      for (const path of ['/lead/sent?from=quiz', '/lead/error?from=contact&field=name%2Cconsent', '/lead/error?from=quiz']) {
        await page.goto(base + path, { waitUntil: 'load' })
        const kind = path.startsWith('/lead/sent') ? 'lead-sent' : path.includes('field=') ? 'lead-error-fields' : 'lead-error-server'
        const file = name(`${kind}-${width}-nojs-${theme}`)
        await page.screenshot({ path: join(out, file) })
        shots.push(file)
      }
      await context.close()
    }
  }
}

console.log('problems', problems.length ? '\n' + problems.join('\n') : 'нет')
console.log('shots', shots.length)
await browser.close()
