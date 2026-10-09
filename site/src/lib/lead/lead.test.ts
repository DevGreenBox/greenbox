import assert from 'node:assert/strict'
import test from 'node:test'
// Node запускает .ts без сборки и требует расширение, а в tsconfig нет allowImportingTsExtensions.
// @ts-expect-error TS5097: расширение .ts нужно Node
import { formatMessage, formToObject, parseLead, resultPath, takeSlot } from './lead.ts'

const valid = {
  source: 'quiz',
  name: '  Иван \t Петров ',
  contact: '+7 999  123-45-67',
  comment: 'Магазин одежды\r\n\r\n\r\nнужен каталог\u0007',
  consent: 'on',
  page: '/',
  answers: { business: 'Одежда и обувь', features: ['Онлайн-оплата', 'Блог'], sdekContract: true },
}

test('валидная заявка нормализуется', () => {
  assert.deepEqual(parseLead(valid).lead, {
    source: 'quiz',
    name: 'Иван Петров',
    contact: '+7 999 123-45-67',
    comment: 'Магазин одежды\n\nнужен каталог',
    answers: { business: ['Одежда и обувь'], features: ['Онлайн-оплата', 'Блог'] },
    sdekContract: true,
    page: '/',
  })
})

test('без согласия — ошибка consent', () => {
  const { lead, fields } = parseLead({ ...valid, consent: undefined })
  assert.equal(lead, undefined)
  assert.deepEqual(Object.keys(fields ?? {}), ['consent'])
})

test('длинные поля отклоняются', () => {
  const { fields } = parseLead({ ...valid, name: 'я'.repeat(101), contact: '1'.repeat(201), comment: 'x'.repeat(2001) })
  assert.deepEqual(Object.keys(fields ?? {}), ['name', 'contact', 'comment'])
})

test('ответы: лишние ключи отброшены, значения и списки обрезаны', () => {
  const answers = { business: 'б'.repeat(150), hack: 'x', integrations: Array(20).fill('СДЭК'), volume: 5 }
  const { lead } = parseLead({ ...valid, answers })
  assert.ok(lead)
  assert.deepEqual(Object.keys(lead.answers), ['business', 'integrations'])
  assert.equal(lead.answers.business?.[0].length, 100)
  assert.equal(lead.answers.integrations?.length, 15)
  assert.equal(lead.sdekContract, false)
})

test('форма: мультивыбор повторяющимися ключами', () => {
  const form = new FormData()
  const entries = [
    ['source', 'contact'], ['name', 'Анна'], ['contact', '@anna'], ['consent', '1'],
    ['answers.features', 'Блог'], ['answers.features', 'Отзывы'], ['answers.sdekContract', 'on'], ['answers.x', 'y'],
  ]
  for (const [key, value] of entries) form.append(key, value)
  const { lead } = parseLead(formToObject(form))
  assert.deepEqual(lead?.answers, { features: ['Блог', 'Отзывы'] })
  assert.equal(lead?.sdekContract, true)
})

test('HTML в сообщении экранируется', () => {
  const { lead } = parseLead({ ...valid, name: '<b>Иван</b> & Co', comment: '<a href="x">тык</a>' })
  assert.ok(lead)
  const message = formatMessage(lead, new Date('2026-09-29T11:05:00Z'))
  assert.match(message, /^<b>Заявка: Опрос<\/b>\nИмя: &lt;b&gt;Иван&lt;\/b&gt; &amp; Co\n/)
  assert.ok(message.includes('Комментарий: &lt;a href=&quot;x&quot;&gt;тык&lt;/a&gt;'))
  assert.ok(message.includes('Договор со СДЭК: есть'))
  assert.ok(message.endsWith('Страница: /\nВремя: 29.09.2026, 14:05 МСК'))
})

test('honeypot: заявка — спам, даже если остальное невалидно', () => {
  assert.deepEqual(parseLead({ source: 'contact', website: 'https://spam.example' }), { source: 'contact', spam: true })
})

test('без JS: 303 на страницу итога, а не на главную', () => {
  assert.equal(resultPath('quiz', true), '/lead/sent?from=quiz')
  assert.equal(resultPath('contact', true), '/lead/sent?from=contact')
  const { source, fields } = parseLead({ source: 'quiz', name: ' ', contact: '@a' })
  assert.equal(resultPath(source ?? 'contact', false, fields), '/lead/error?from=quiz&field=name%2Ccontact%2Cconsent')
  assert.equal(resultPath('contact', false), '/lead/error?from=contact')
})

test('лимит: 5 заявок за 10 минут с одного IP', () => {
  const t = Date.now()
  for (let i = 0; i < 5; i++) assert.ok(takeSlot('203.0.113.7', t))
  assert.equal(takeSlot('203.0.113.7', t + 1), false)
  assert.ok(takeSlot('203.0.113.8', t + 1))
  assert.ok(takeSlot('203.0.113.7', t + 10 * 60_000))
})

test('оффер: из белого списка попадает в заявку и в сообщение, чужой отбрасывается', () => {
  const lead = parseLead({ ...valid, source: 'contact', offer: 'mockup' }).lead!
  assert.equal(lead.offer, 'mockup')
  assert.match(formatMessage(lead), /<b>Заявка: Форма<\/b>\nОффер: макет за 2 дня\nИмя:/)
  assert.equal('offer' in parseLead({ ...valid, offer: 'toString' }).lead!, false)
  assert.equal('offer' in parseLead({ ...valid, offer: '<b>' }).lead!, false)
})

test('способ связи: выбранный, если похоже; иначе определённый по значению; иначе ошибка по выбранному', () => {
  const base = { ...valid, source: 'contact' }
  const phone = parseLead({ ...base, contact: '+7 (900) 123-45-67', channel: 'phone' }).lead!
  assert.equal(phone.channel, 'phone')
  assert.match(formatMessage(phone), /Контакт: \+7 \(900\) 123-45-67 \(телефон\)/)
  // выбрали телефон, вписали ник — заявка принята как Telegram
  assert.equal(parseLead({ ...base, contact: '@ivan_petrov', channel: 'phone' }).lead!.channel, 'telegram')
  assert.equal(parseLead({ ...base, contact: 'ivan@mail.ru', channel: 'telegram' }).lead!.channel, 'email')
  assert.equal(parseLead({ ...base, contact: 't.me/ivan_petrov', channel: 'telegram' }).lead!.channel, 'telegram')
  // ни на что не похоже — ошибка с подсказкой выбранного способа
  assert.equal(parseLead({ ...base, contact: '12345', channel: 'phone' }).fields!.contact, 'В номере не хватает цифр: например, +7 900 000-00-00')
  assert.equal(parseLead({ ...base, contact: 'ivan@', channel: 'email' }).fields!.contact, 'Проверьте почту: например, name@mail.ru')
  assert.equal(parseLead({ ...base, contact: '', channel: 'telegram' }).fields!.contact, 'Укажите ник в Telegram')
  // старая форма без способа — как раньше, от 3 символов, без пометки
  assert.equal('channel' in parseLead({ ...base, contact: 'abc' }).lead!, false)
  assert.equal('channel' in parseLead({ ...base, contact: 'x', channel: 'fax' }).fields!, false)
})

const partner = {
  source: 'partner',
  name: ' Иванов Иван ',
  phone: '+7 (900) 000-00-00',
  email: 'ivan@mail.ru',
  position: 'Руководитель отдела продаж',
  comment: 'Франчайзи СДЭК, Краснодар',
  consent: 'on',
  page: '/partner',
}

test('партнёр: анкета нормализуется, в сообщении ФИО, телефон, почта, должность и запрос', () => {
  const { lead } = parseLead(partner)
  assert.deepEqual(lead?.partner, { email: 'ivan@mail.ru', position: 'Руководитель отдела продаж' })
  assert.equal(lead?.name, 'Иванов Иван')
  assert.equal(lead?.contact, '+7 (900) 000-00-00')
  const text = formatMessage(lead!, new Date('2026-10-01T09:00:00Z'))
  assert.match(text, /^<b>Заявка: Партнёрство<\/b>\nФИО: Иванов Иван\nТелефон: \+7 \(900\) 000-00-00\nПочта: ivan@mail\.ru\nДолжность: Руководитель отдела продаж\nЗапрос: Франчайзи СДЭК, Краснодар\n\nСтраница: \/partner\n/)
})

test('партнёр: телефон, почта и должность обязательны и проверяются по формату', () => {
  const { lead, fields } = parseLead({ ...partner, phone: '12', email: 'ivan', position: ' ' })
  assert.equal(lead, undefined)
  assert.deepEqual(Object.keys(fields ?? {}).sort(), ['email', 'phone', 'position'])
  assert.equal(resultPath('partner', false, fields), '/lead/error?from=partner&field=phone%2Cemail%2Cposition')
})
