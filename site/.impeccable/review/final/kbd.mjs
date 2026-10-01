// Клавиатура: обход Tab по всей главной (1440, 390) с проверкой видимости фокуса по разнице кадров,
// мобильное меню, переключатели демо, квиз до отправки, FAQ, кейсы. Chromium.
import { createRequire } from 'node:module'
import { BASE, launch, save, scrollThrough, sleep } from './lib.mjs'

const require = createRequire(import.meta.url)
const sharp = require('/home/coder/novi/render-lab/node_modules/sharp')
const only = process.argv[2] // walk | menu | demo | quiz | faq | cases — для точечного перезапуска

// ---------- в странице ----------
function describe() {
  const el = document.activeElement
  if (!el || el === document.body || el === document.documentElement) return { body: true, scrollY: Math.round(scrollY) }
  const vw = document.documentElement.clientWidth
  const vh = innerHeight
  const r = el.getBoundingClientRect()
  const hiddenInput = el.matches('input[type=radio],input[type=checkbox]') && getComputedStyle(el).opacity === '0'
  const proxy = hiddenInput ? el.labels?.[0] ?? el.nextElementSibling ?? el : el
  let op = 1
  for (let n = proxy; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity)
  const txt = (s) => (s || '').replace(/\s+/g, ' ').trim()
  const name = txt(
    el.getAttribute('aria-label') ||
      (el.labels?.[0] && el.labels[0].textContent) ||
      (el.matches('input,textarea') ? el.name : '') ||
      el.textContent ||
      el.getAttribute('title'),
  ).slice(0, 70)
  const path = []
  for (let n = el; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
    let s = n.tagName.toLowerCase()
    if (n.id) {
      path.unshift(s + '#' + n.id)
      break
    }
    const cls = [...n.classList].filter((c) => !/[()[\]:]/.test(c)).slice(0, 2).join('.')
    if (cls) s += '.' + cls
    const same = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : []
    if (same.length > 1) s += `:nth-of-type(${same.indexOf(n) + 1})`
    path.unshift(s)
  }
  const pr = proxy.getBoundingClientRect()
  const cx = Math.min(Math.max(pr.left + pr.width / 2, 0), vw - 1)
  const cy = Math.min(Math.max(pr.top + pr.height / 2, 0), vh - 1)
  const top = document.elementFromPoint(cx, cy)
  const related = (n) => n && (el.contains(n) || n.contains(el) || [...(el.labels ?? [])].some((l) => l.contains(n)))
  const obscuredBy = !top || related(top) ? null : top.closest('#site-header') ? 'шапка' : top.tagName.toLowerCase() + '.' + ([...top.classList][0] ?? '')
  const zone = el.closest('dialog,header,footer,section')
  return {
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') ?? undefined,
    type: el.getAttribute('type') ?? undefined,
    name,
    path: path.join(' > '),
    zone: zone ? zone.id || zone.tagName.toLowerCase() : 'body',
    rect: { x: Math.round(pr.left), y: Math.round(pr.top), w: Math.round(pr.width), h: Math.round(pr.height) },
    docY: Math.round(pr.top + scrollY),
    scrollY: Math.round(scrollY),
    opacity: +op.toFixed(2),
    visibility: getComputedStyle(proxy).visibility,
    inView: pr.bottom > 0 && pr.top < vh && pr.right > 0 && pr.left < vw && pr.width > 0 && pr.height > 0,
    fullyInView: pr.top >= -1 && pr.left >= -1 && pr.bottom <= vh + 1 && pr.right <= vw + 1,
    obscuredBy,
    focusVisible: el.matches(':focus-visible'),
  }
}

/** Прямоугольник для кадра: сам элемент, его подпись и соседний «рисунок» (скрытые input). */
function focusBox() {
  const el = document.activeElement
  const rects = [el, ...(el.labels ?? []), el.nextElementSibling]
    .filter(Boolean)
    .map((n) => n.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
  if (!rects.length) return null
  const pad = 10
  const vw = document.documentElement.clientWidth
  const x0 = Math.max(0, Math.min(...rects.map((r) => r.left)) - pad)
  const y0 = Math.max(0, Math.min(...rects.map((r) => r.top)) - pad)
  const x1 = Math.min(vw, Math.max(...rects.map((r) => r.right)) + pad)
  const y1 = Math.min(innerHeight, Math.max(...rects.map((r) => r.bottom)) + pad)
  if (x1 - x0 < 2 || y1 - y0 < 2) return null
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/** Контраст кольца фокуса (outline у элемента, его подписи или соседа) к фону под ним. */
function ringContrast() {
  const el = document.activeElement
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const bgUnder = (n) => {
    const layers = []
    for (; n && n.nodeType === 1; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 0.99) break
    }
    let acc = [255, 255, 255]
    for (const c of layers.reverse()) acc = acc.map((v, i) => v * (1 - c[3]) + c[i] * c[3])
    return acc
  }
  for (const [where, n] of [
    ['self', el],
    ['next', el.nextElementSibling],
    ['label', el.labels?.[0]],
  ]) {
    if (!n) continue
    const s = getComputedStyle(n)
    if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0) continue
    const ring = rgba(s.outlineColor)
    const bg = bgUnder(parseFloat(s.outlineOffset) >= 0 ? n.parentElement : n)
    const [l1, l2] = [lum(ring), lum(bg)].sort((a, b) => b - a)
    return { where, outline: `${s.outlineWidth} ${s.outlineStyle} rgb(${ring.slice(0, 3).join(',')})`, offset: s.outlineOffset, bg: `rgb(${bg.map(Math.round).join(',')})`, ratio: +((l1 + 0.05) / (l2 + 0.05)).toFixed(2) }
  }
  const sh = getComputedStyle(el).boxShadow
  return sh && sh !== 'none' ? { where: 'self', shadow: sh.slice(0, 90) } : null
}

// ---------- в Node ----------
async function settle(page, extra = 0) {
  let last = ''
  for (let i = 0; i < 30; i++) {
    await sleep(60)
    const now = await page.evaluate(() => {
      const r = document.activeElement?.getBoundingClientRect()
      return `${Math.round(scrollY)}:${r ? Math.round(r.left) + ',' + Math.round(r.top) : ''}`
    })
    if (now === last) break
    last = now
  }
  if (extra) await sleep(extra)
}

async function pixels(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, info }
}

/** Видим ли фокус: кадр с фокусом против кадра после blur (тот же прямоугольник). Возвращает число изменившихся пикселей. */
async function focusDiff(page) {
  const box = await page.evaluate(focusBox)
  if (!box) return { diff: null, reason: 'нет прямоугольника в экране' }
  const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
  await sleep(250)
  const a = await page.screenshot({ clip })
  const handle = await page.evaluateHandle(() => document.activeElement)
  await page.evaluate((el) => el.blur(), handle)
  await sleep(300)
  const b = await page.screenshot({ clip })
  await page.evaluate((el) => el.focus({ preventScroll: true }), handle)
  await sleep(150)
  const [pa, pb] = await Promise.all([pixels(a), pixels(b)])
  if (pa.data.length !== pb.data.length) return { diff: null, reason: 'размер кадра изменился' }
  // Контраст «с фокусом / без фокуса» в изменившихся пикселях (WCAG 1.4.11: индикатор к соседнему цвету ≥ 3:1)
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const lum = (d, i) => 0.2126 * f(d[i]) + 0.7152 * f(d[i + 1]) + 0.0722 * f(d[i + 2])
  const ratios = []
  for (let i = 0; i < pa.data.length; i += 3) {
    if (Math.max(Math.abs(pa.data[i] - pb.data[i]), Math.abs(pa.data[i + 1] - pb.data[i + 1]), Math.abs(pa.data[i + 2] - pb.data[i + 2])) > 40) {
      const [l1, l2] = [lum(pa.data, i), lum(pb.data, i)].sort((x, y) => y - x)
      ratios.push((l1 + 0.05) / (l2 + 0.05))
    }
  }
  ratios.sort((x, y) => x - y)
  const n = ratios.length
  const p = (q) => (n ? +ratios[Math.min(n - 1, Math.floor(q * n))].toFixed(2) : null)
  return { diff: n, clip, shot: a, pxMedian: p(0.5), pxP90: p(0.9), share3: n ? +(ratios.filter((r) => r >= 3).length / n).toFixed(2) : null }
}

const key = (d) => (d.body ? 'BODY' : d.path)

async function tabWalk(browser, width, height, theme = 'light') {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(5000) // вступительные анимации первого экрана
  await scrollThrough(page)
  await sleep(1500)
  const seq = []
  const seen = new Map()
  let firstKey
  for (let i = 0; i < 260; i++) {
    await page.keyboard.press('Tab')
    await settle(page)
    let d = await page.evaluate(describe)
    if (!d.body && d.zone === 'cases') {
      await sleep(1100) // лента догоняет прокрутку (scrub 0.7)
      d = await page.evaluate(describe)
    }
    const k = key(d)
    if (i === 0) firstKey = k
    else if (k === firstKey) {
      seq.push({ i, wrapped: true, ...d })
      break
    }
    if (!d.body) {
      const fd = await focusDiff(page)
      d.focusDiff = fd.diff
      d.pxMedian = fd.pxMedian
      d.pxP90 = fd.pxP90
      d.share3 = fd.share3
      if (fd.reason) d.focusDiffNote = fd.reason
      if (fd.diff !== null && fd.diff < 60) save(`kbd/nofocus-${width}-${i}.png`, fd.shot)
      d.ring = await page.evaluate(ringContrast)
    }
    d.i = i
    d.repeat = (seen.get(k) ?? 0) + 1
    seen.set(k, d.repeat)
    seq.push(d)
    if (d.repeat >= 3) {
      d.trap = true
      break
    }
  }
  await context.close()
  return seq
}

function walkIssues(seq, width) {
  const issues = []
  let prevDocY = -1
  for (const d of seq) {
    if (d.body || d.wrapped) continue
    const label = `#${d.i} ${d.tag}${d.type ? '[' + d.type + ']' : ''} «${d.name}» (${d.path})`
    if (!d.inView) issues.push({ width, kind: 'вне экрана', label, rect: d.rect })
    if (d.opacity < 0.5 || d.visibility !== 'visible') issues.push({ width, kind: 'невидимый элемент в фокусе', label, opacity: d.opacity })
    if (d.obscuredBy) issues.push({ width, kind: 'перекрыт', label, by: d.obscuredBy, rect: d.rect })
    if (d.focusDiff !== null && d.focusDiff !== undefined && d.focusDiff < 60) issues.push({ width, kind: 'нет видимого фокуса (кадры до/после blur совпадают)', label, diff: d.focusDiff })
    if (d.pxP90 !== null && d.pxP90 !== undefined && d.pxP90 < 3) issues.push({ width, kind: 'контраст индикатора фокуса к фону < 3:1 (по пикселям)', label, pxMedian: d.pxMedian, pxP90: d.pxP90, share3: d.share3 })
    if (!d.focusVisible) issues.push({ width, kind: ':focus-visible не сработал', label })
    if (d.trap) issues.push({ width, kind: 'ловушка фокуса', label })
    if (d.zone !== 'site-header' && d.zone !== 'cases' && prevDocY - d.docY > 200) issues.push({ width, kind: 'скачок порядка вверх', label, from: prevDocY, to: d.docY })
    if (d.zone !== 'site-header') prevDocY = d.docY
  }
  return issues
}

const results = {}
const browser = await launch()

// 1. Обход Tab
if (!only || only === 'walk') {
  for (const [w, h, theme] of [
    [1440, 900, 'light'],
    [1440, 900, 'dark'],
    [390, 844, 'light'],
    [390, 844, 'dark'],
  ]) {
    const seq = await tabWalk(browser, w, h, theme)
    const issues = walkIssues(seq, `${w}-${theme}`)
    const k = `walk-${w}-${theme}`
    results[k] = { stops: seq.filter((d) => !d.body && !d.wrapped).length, wrapped: seq.some((d) => d.wrapped), issues, seq }
    console.log(`\n== Tab ${w} ${theme}: остановок ${results[k].stops}, по кругу: ${results[k].wrapped}, проблем: ${issues.length}`)
    for (const d of seq) console.log(d.body ? `  ${d.i} BODY` : `  ${d.i} [${d.zone}] ${d.tag}${d.type ? '[' + d.type + ']' : ''} «${d.name.slice(0, 40)}» y=${d.rect.y} diff=${d.focusDiff} px≥3:${d.share3} p50=${d.pxMedian} p90=${d.pxP90} css=${d.ring?.ratio ?? (d.ring?.shadow ? 'shadow' : '-')}${d.obscuredBy ? ' ПЕРЕКРЫТ ' + d.obscuredBy : ''}${d.inView ? '' : ' ВНЕ ЭКРАНА'}`)
    for (const x of issues) console.log('  !', x.kind, x.label, x.by ?? '', x.diff ?? '', x.pxP90 ?? '')
  }
}

// 1б. Ссылка «Перейти к содержанию»: Enter, затем Tab — первый элемент внутри main
if (!only || only === 'skip') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(1500)
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => document.activeElement?.textContent.trim())
  await page.keyboard.press('Enter')
  await sleep(600)
  await page.keyboard.press('Tab')
  await settle(page)
  results.skip = {
    first,
    hash: await page.evaluate(() => location.hash),
    next: await page.evaluate(() => ({ text: document.activeElement?.textContent.trim().slice(0, 40), inMain: !!document.activeElement?.closest('main') })),
  }
  console.log('\n== Skip link', JSON.stringify(results.skip))
  await context.close()
}

// 2. Мобильное меню (390)
if (!only || only === 'menu') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(BASE + '/', { waitUntil: 'load' })
  await sleep(1500)
  const r = { steps: [] }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.matches('button[aria-haspopup=dialog]'))) break
  }
  r.burgerFocused = await page.evaluate(() => document.activeElement?.matches('button[aria-haspopup=dialog]'))
  r.burgerDiff = (await focusDiff(page)).diff
  await page.keyboard.press('Enter')
  await sleep(500)
  r.afterOpen = await page.evaluate(() => ({
    open: document.getElementById('mobile-menu').open,
    modal: document.getElementById('mobile-menu').matches(':modal'),
    active: document.activeElement?.textContent.trim(),
    expanded: document.querySelector('button[aria-haspopup=dialog]').getAttribute('aria-expanded'),
    htmlOverflow: document.documentElement.style.overflow,
  }))
  const inside = []
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab')
    await sleep(120)
    const d = await page.evaluate(() => ({
      inDialog: !!document.activeElement?.closest('#mobile-menu'),
      body: document.activeElement === document.body,
      name: (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    }))
    if (!d.body && d.inDialog) d.diff = (await focusDiff(page)).diff
    inside.push(d)
  }
  r.tabInside = inside
  r.focusLeftDialog = inside.some((d) => !d.inDialog && !d.body)
  // Переключатель темы в меню — Space
  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme)
  for (let i = 0; i < 10; i++) {
    if (await page.evaluate(() => document.activeElement?.matches('#mobile-menu [role=switch]'))) break
    await page.keyboard.press('Tab')
    await sleep(80)
  }
  r.themeSwitchFocused = await page.evaluate(() => document.activeElement?.matches('#mobile-menu [role=switch]'))
  await page.keyboard.press('Space')
  await sleep(600)
  r.themeToggle = { before: themeBefore, after: await page.evaluate(() => document.documentElement.dataset.theme), ariaChecked: await page.evaluate(() => document.activeElement?.getAttribute('aria-checked')) }
  await page.keyboard.press('Space') // вернуть тему
  await sleep(600)
  await page.keyboard.press('Escape')
  await sleep(500)
  r.afterEsc = await page.evaluate(() => ({
    open: document.getElementById('mobile-menu').open,
    activeIsBurger: document.activeElement?.matches('button[aria-haspopup=dialog]'),
    active: document.activeElement?.className,
    expanded: document.querySelector('button[aria-haspopup=dialog]').getAttribute('aria-expanded'),
    htmlOverflow: document.documentElement.style.overflow,
  }))
  // Ссылка меню по Enter: меню закрывается, страница едет к якорю
  await page.keyboard.press('Enter')
  await sleep(500)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab')
    await sleep(100)
    if (await page.evaluate(() => document.activeElement?.closest('#mobile-menu nav'))) break
  }
  const linkName = await page.evaluate(() => document.activeElement?.textContent.trim())
  await page.keyboard.press('Enter')
  await sleep(1500)
  r.afterLink = await page.evaluate((linkName) => ({
    link: linkName,
    open: document.getElementById('mobile-menu').open,
    hash: location.hash,
    scrollY: Math.round(scrollY),
    active: document.activeElement?.tagName,
    htmlOverflow: document.documentElement.style.overflow,
  }), linkName)
  results.menu = r
  console.log('\n== Меню 390', JSON.stringify(r, null, 1))
  await context.close()
}

// 3. Переключатели демо (Space) — 1440 и 390
if (!only || only === 'demo') {
  results.demo = {}
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(5000)
    const state = () =>
      page.evaluate(() => {
        const sw = [...document.querySelectorAll('#top input[role=switch]')]
        const hgt = (sel) => Math.round(document.querySelector(sel)?.getBoundingClientRect().height ?? -1)
        return { checked: sw.map((s) => s.checked), promoH: hgt('[class*="__promo"]'), freshH: hgt('[class*="__fresh"]') }
      })
    const r = { initial: await state(), steps: [] }
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      await settle(page)
      if (await page.evaluate(() => document.activeElement?.matches('#top input[role=switch]'))) break
    }
    r.focusedName = await page.evaluate(() => document.activeElement?.labels?.[0]?.textContent.trim())
    r.focusDiff = (await focusDiff(page)).diff
    r.ring = await page.evaluate(ringContrast)
    await page.keyboard.press('Space')
    await sleep(900)
    r.steps.push({ after: 'Space #1', ...(await state()) })
    await page.keyboard.press('Space')
    await sleep(900)
    r.steps.push({ after: 'Space #1 снова', ...(await state()) })
    await page.keyboard.press('Tab')
    await settle(page)
    r.second = await page.evaluate(() => document.activeElement?.labels?.[0]?.textContent.trim())
    r.secondDiff = (await focusDiff(page)).diff
    await page.keyboard.press('Space')
    await sleep(900)
    r.steps.push({ after: 'Space #2', ...(await state()) })
    await page.keyboard.press('Space')
    await sleep(900)
    r.steps.push({ after: 'Space #2 снова', ...(await state()) })
    results.demo[w] = r
    console.log(`\n== Демо ${w}`, JSON.stringify(r))
    await context.close()
  }
}

// 4. Квиз с клавиатуры от начала до отправки (1440)
if (!only || only === 'quiz') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'x-forwarded-for': '198.51.100.11' } })
  const page = await context.newPage()
  await page.goto(BASE + '/#quiz', { waitUntil: 'load' })
  await sleep(2500)
  const log = []
  const at = async (label) => {
    const d = await page.evaluate(() => {
      const el = document.activeElement
      const step = el?.closest('[data-step]')?.getAttribute('data-step')
      return {
        tag: el?.tagName.toLowerCase(),
        type: el?.getAttribute('type'),
        name: el?.getAttribute('name'),
        text: (el?.labels?.[0]?.textContent || el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        checked: el?.checked,
        step,
        progress: document.querySelector('#quiz [class*="__progress"] span')?.textContent,
      }
    })
    log.push({ label, ...d })
    return d
  }
  const tabTo = async (pred, max = 20) => {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab')
      await sleep(80)
      if (await page.evaluate(pred)) return true
    }
    return false
  }
  await page.locator('#quiz-title').click()
  const diffs = []
  // шаг 1
  await page.keyboard.press('Tab')
  await settle(page)
  await at('Tab → первый вариант шага 1')
  diffs.push(['chip radio', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  // что ещё фокусируется на шаге 1 до выхода из формы
  const step1Stops = []
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    await sleep(80)
    const d = await page.evaluate(() => ({
      inQuiz: !!document.activeElement?.closest('#quiz form'),
      text: (document.activeElement?.labels?.[0]?.textContent || document.activeElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      step: document.activeElement?.closest('[data-step]')?.getAttribute('data-step'),
    }))
    step1Stops.push(d)
    if (!d.inQuiz) break
  }
  await page.locator('#quiz-title').click()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await at('Space → выбран')
  await page.keyboard.press('Enter')
  await sleep(900)
  await at('Enter → шаг 2 (фокус на вопросе)')
  // «Назад» с клавиатуры
  const foundBack = await tabTo(() => document.activeElement?.textContent.trim() === 'Назад', 15)
  await page.keyboard.press('Enter')
  await sleep(900)
  await at(`Назад (найдена: ${foundBack}) → шаг 1`)
  const keptChoice = await page.evaluate(() => document.querySelector('input[name="answers.business"]:checked')?.value)
  const foundNext = await tabTo(() => document.activeElement?.textContent.trim() === 'Далее', 15)
  await page.keyboard.press('Enter')
  await sleep(900)
  await at(`Далее (найдена: ${foundNext}) → шаг 2`)
  // шаг 2
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await at('шаг 2: выбран')
  await page.keyboard.press('Enter')
  await sleep(900)
  await at('Enter → шаг 3')
  // шаг 3 (несколько)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await at('шаг 3: два флажка')
  diffs.push(['chip checkbox', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  await page.keyboard.press('Enter')
  await sleep(900)
  await at('Enter → шаг 4')
  // шаг 4: СДЭК + договор
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  const foundSdek = await tabTo(() => document.activeElement?.name === 'answers.sdekContract', 15)
  diffs.push(['sdekContract checkbox', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  await page.keyboard.press('Space')
  await at(`шаг 4: договор СДЭК (найден: ${foundSdek})`)
  await page.keyboard.press('Enter')
  await sleep(900)
  await at('Enter → шаг 5')
  // шаг 5
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await page.keyboard.press('Enter')
  await sleep(900)
  await at('Enter → контакты')
  // контакты
  await page.keyboard.press('Tab')
  await at('Tab → имя')
  diffs.push(['input name', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  await page.keyboard.type('ТЕСТ verify квиз')
  await page.keyboard.press('Tab')
  await page.keyboard.type('test-quiz@example.invalid')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Проверка с клавиатуры, удалить')
  await page.keyboard.press('Tab')
  await at('Tab → согласие')
  diffs.push(['consent checkbox', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  await page.keyboard.press('Space')
  const foundSubmit = await tabTo(() => document.activeElement?.matches('#quiz button[type=submit]'), 6)
  await at(`кнопка отправки (найдена: ${foundSubmit})`)
  diffs.push(['submit', (await focusDiff(page)).diff, await page.evaluate(ringContrast)])
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.activeElement?.tagName === 'H3' && /отправлена/i.test(document.activeElement.textContent), null, { timeout: 10000 }).catch(() => {})
  await at('Enter → итог')
  const summary = await page.evaluate(() => [...document.querySelectorAll('#quiz dl div')].map((d) => d.textContent.replace(/\s+/g, ' ').trim()))
  results.quiz = { log, step1Stops, keptChoice, summary, diffs }
  console.log('\n== Квиз', JSON.stringify(results.quiz, null, 1))
  await context.close()
}

// 5. FAQ (1440)
if (!only || only === 'faq') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(BASE + '/#faq', { waitUntil: 'load' })
  await sleep(2500)
  const openStates = () => page.evaluate(() => [...document.querySelectorAll('#faq details')].map((d) => d.open))
  await page.locator('#faq-title').click()
  const r = { count: (await openStates()).length, steps: [] }
  await page.keyboard.press('Tab')
  await settle(page)
  r.first = await page.evaluate(() => document.activeElement?.tagName + ' ' + document.activeElement?.textContent.trim().slice(0, 50))
  r.firstDiff = (await focusDiff(page)).diff
  r.ring = await page.evaluate(ringContrast)
  await page.keyboard.press('Enter')
  await sleep(600)
  r.steps.push({ after: 'Enter на 1', open: await openStates() })
  await page.keyboard.press('Tab')
  await settle(page)
  r.second = await page.evaluate(() => document.activeElement?.tagName + ' ' + document.activeElement?.textContent.trim().slice(0, 50))
  await page.keyboard.press('Space')
  await sleep(600)
  r.steps.push({ after: 'Space на 2', open: await openStates() })
  await page.keyboard.press('Enter')
  await sleep(600)
  r.steps.push({ after: 'Enter на 2', open: await openStates() })
  // Все вопросы проходятся Tab подряд
  await page.locator('#faq-title').click()
  const tabs = []
  for (let i = 0; i < r.count + 1; i++) {
    await page.keyboard.press('Tab')
    await sleep(60)
    tabs.push(await page.evaluate(() => document.activeElement?.tagName))
  }
  r.tabs = tabs
  results.faq = r
  console.log('\n== FAQ', JSON.stringify(r))
  await context.close()
}

// 6. Кейсы: фокус на ссылке карточки за экраном (1440 — закреплённая лента, 390 — лента со скроллом)
if (!only || only === 'cases') {
  results.cases = {}
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await context.newPage()
    await page.goto(BASE + '/', { waitUntil: 'load' })
    await sleep(1500)
    await page.evaluate(() => document.getElementById('cases').scrollIntoView({ behavior: 'instant' }))
    await sleep(1200)
    await page.locator('#cases-title').click()
    const rows = []
    const probe = () =>
      page.evaluate(() => {
        const el = document.activeElement
        const card = el?.closest('[data-item]')
        const vw = document.documentElement.clientWidth
        const r = el?.getBoundingClientRect()
        const c = card?.getBoundingClientRect()
        return {
          text: el?.textContent.replace(/\s+/g, ' ').trim().slice(0, 50),
          inCard: !!card,
          link: r && { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) },
          card: c && { left: Math.round(c.left), right: Math.round(c.right) },
          linkVisible: !!r && r.left >= 0 && r.right <= vw && r.top >= 0 && r.bottom <= innerHeight,
          counter: document.querySelector('#cases [data-now]')?.textContent,
          scrollY: Math.round(scrollY),
        }
      })
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab')
      await settle(page, 1200)
      const d = await probe()
      rows.push(d)
      if (!d.inCard) break
    }
    // назад Shift+Tab по кейсам
    const back = []
    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Shift+Tab')
      await settle(page, 1200)
      const d = await probe()
      back.push(d)
      if (!d.inCard) break
    }
    results.cases[w] = { forward: rows, backward: back }
    console.log(`\n== Кейсы ${w}`)
    for (const d of rows) console.log('  →', d.text, d.inCard, JSON.stringify(d.link), 'видна:', d.linkVisible, d.counter)
    for (const d of back) console.log('  ←', d.text, d.inCard, JSON.stringify(d.link), 'видна:', d.linkVisible, d.counter)
    await context.close()
  }
}

await browser.close()
save(`kbd/results${only ? '-' + only : ''}.json`, results)
