// Правка ритма секций (30.09.2026): пары #get + #quiz и #faq + #contact, 1440 и 390, обе темы, reduced-motion.
// Плюс состояния: квиз на шаге 2 и на контактах, FAQ с открытым ответом о цене. Один браузер на весь прогон.
// caret: 'initial' — иначе Playwright на время снимка ставит input'ам инлайн caret-color, и остров формы,
// гидратированный во время снимка, ругается на расхождение style (артефакт снимка, не сайта).
// Запуск: node site/.impeccable/review/fix-rhythm/shoot.mjs [http://localhost:3101]
import { chromium } from '/home/coder/novi/render-lab/node_modules/playwright-core/index.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] ?? 'http://localhost:3101'
const OUT = path.dirname(fileURLToPath(import.meta.url))
const CHROME = '/home/coder/.cache/ms-playwright/chromium-1244/chrome-linux64/chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Снимок от верха секции a до низа секции b (координаты страницы). */
async function pair(page, a, b, file) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }), a)
  await sleep(400)
  await page.evaluate(() => document.fonts.ready)
  const clip = await page.evaluate(
    ([a, b]) => {
      const top = document.getElementById(a).getBoundingClientRect().top + scrollY
      const bottom = document.getElementById(b).getBoundingClientRect().bottom + scrollY
      return { x: 0, y: Math.round(top), width: document.documentElement.clientWidth, height: Math.round(bottom - top) }
    },
    [a, b],
  )
  await page.screenshot({ path: path.join(OUT, file), fullPage: true, clip, caret: 'initial', timeout: 120000 })
}

/** Остров квиза гидратирован (его код грузится у экрана). */
const hydrated = (page) =>
  page.waitForFunction(() => {
    const form = document.querySelector('#quiz form')
    return form && Object.keys(form).some((k) => k.startsWith('__react'))
  }, null, { timeout: 60000 })

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const report = []
try {
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: theme })
      const page = await context.newPage()
      const errors = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
      page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
      // Заявку не отправляем: ответ сервера подменён, форма показывает «отправлено».
      await page.route('**/api/lead', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
      await page.goto(BASE + '/', { waitUntil: 'load', timeout: 120000 })
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }) // значок dev-оверлея Next
      const tag = `${w}-${theme}`

      await pair(page, 'get', 'quiz', `get-quiz-${tag}.png`)
      await hydrated(page)
      await pair(page, 'faq', 'contact', `faq-contact-${tag}.png`)

      // Квиз: шаг 2, контакты, «отправлено». Шапка скрыта: кадры секций, а не экрана.
      await page.addStyleTag({ content: '#site-header { visibility: hidden !important; }' })
      await page.evaluate(() => document.getElementById('quiz').scrollIntoView({ behavior: 'instant' }))
      await page.locator('#quiz input[name="answers.business"]').first().check({ force: true })
      await page.locator('#quiz button', { hasText: 'Далее' }).click()
      await sleep(300)
      const quiz = page.locator('#quiz')
      await quiz.screenshot({ path: path.join(OUT, `quiz-step2-${tag}.png`), caret: 'initial' })
      const step2 = await page.evaluate(() => document.querySelector('#quiz form b')?.textContent)
      await page.locator('#quiz button', { hasText: 'Сразу оставить контакты' }).click()
      await sleep(300)
      await quiz.screenshot({ path: path.join(OUT, `quiz-contacts-${tag}.png`), caret: 'initial' })
      const contacts = await page.evaluate(() => document.querySelector('#quiz form b')?.textContent)
      await page.fill('#quiz-name', 'Тест')
      await page.fill('#quiz-contact', '@test')
      await page.locator('#quiz button[type=submit]').click()
      await page.waitForFunction(() => document.activeElement?.tagName === 'H3' && !!document.activeElement.closest('#quiz'))
      await sleep(300)
      await quiz.screenshot({ path: path.join(OUT, `quiz-sent-${tag}.png`), caret: 'initial' })
      const sentPick = await page.evaluate(() => !!document.querySelector('#quiz form b'))

      // FAQ: открыт ответ о цене (заглушка [цена]).
      await page.locator('#faq summary').first().click()
      await sleep(300)
      await page.locator('#faq').screenshot({ path: path.join(OUT, `faq-open-${tag}.png`), caret: 'initial' })
      const open = await page.evaluate(() => [...document.querySelectorAll('#faq details')].map((d) => d.open))

      report.push({ tag, step2, contacts, sentPick, open: open.map(Number).join(''), errors })
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(report, null, 1))
