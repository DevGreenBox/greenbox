// WebKit: что на главной связано с падениями. Режимы по 5 прогонов на 390: как есть, reduced-motion,
// без JS (скрипты вырезаны), без filter/backdrop-filter/mask, контроль — длинная синтетическая страница.
import { BASE, launch, save, sleep } from './lib.mjs'

const stripScripts = async (context) =>
  context.route('**/*', async (route) => {
    const req = route.request()
    if (req.resourceType() === 'script') return route.abort()
    if (req.resourceType() !== 'document') return route.continue()
    const res = await route.fetch()
    return route.fulfill({ response: res, body: (await res.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') })
  })

const NOFX = '*,*::before,*::after{filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;mask:none!important;-webkit-mask:none!important;mask-image:none!important;-webkit-mask-image:none!important}'
const NOANIM = '*,*::before,*::after{animation:none!important;transition:none!important}'
const synthetic = `<!doctype html><html lang="ru"><meta name="viewport" content="width=device-width"><body style="margin:0;font:16px/1.5 sans-serif">${Array.from({ length: 60 }, (_, i) => `<section style="padding:40px 20px;background:${i % 2 ? '#fafbfc' : '#0a0a14'};color:${i % 2 ? '#111' : '#eee'}"><h2>Секция ${i}</h2><p>${'Текст абзаца для длинной страницы. '.repeat(20)}</p><ul>${'<li>пункт</li>'.repeat(8)}</ul></section>`).join('')}</body></html>`

const all = {
  'как есть': {},
  'reduced-motion': { ctx: { reducedMotion: 'reduce' } },
  'без JS': { setup: stripScripts },
  'без filter/mask': { css: NOFX },
  'без анимаций и переходов': { css: NOANIM },
  'контроль: синтетика': { synthetic: true },
  // второй круг
  'только filter:none везде': { css: '*,*::before,*::after{filter:none!important}' },
  'только mask-image:none': { css: '*,*::before,*::after{mask-image:none!important;-webkit-mask-image:none!important}' },
  'filter:none у [data-reveal]': { css: '[data-reveal]{filter:none!important}' },
  'filter:none у h1 первого экрана': { css: '#hero-title{filter:none!important}' },
}
const pick = process.argv[2] ? new RegExp(process.argv[2]) : null
const modes = Object.fromEntries(Object.entries(all).filter(([k]) => !pick || pick.test(k)))

const out = {}
const browser = await launch('webkit')
for (const [name, m] of Object.entries(modes)) {
  out[name] = []
  for (let run = 1; run <= 5; run++) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(m.ctx ?? {}) })
    if (m.setup) await m.setup(context)
    if (m.css) {
      await context.addInitScript((css) => {
        const add = () => {
          const s = document.createElement('style')
          s.textContent = css
          document.head.append(s)
        }
        if (document.head) add()
        else document.addEventListener('DOMContentLoaded', add)
      }, m.css)
    }
    const page = await context.newPage()
    let last = 0
    try {
      if (m.synthetic) await page.setContent(synthetic)
      else await page.goto(BASE + '/', { waitUntil: 'load' })
      await sleep(800)
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += 300) {
        last = y
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
        await sleep(120)
      }
      out[name].push('OK')
    } catch (e) {
      out[name].push(`падение y=${last}`)
    }
    await context.close().catch(() => {})
  }
  console.log(name.padEnd(26), out[name].join(', '))
}
await browser.close()
save(`xbrowser/webkit-bisect${pick ? '-2' : ''}.json`, out)
