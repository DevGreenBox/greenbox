// Заявка с сайта: разбор и проверка, текст для Telegram, ограничение частоты.
// Здесь нет секретов, 'server-only' и импортов: модуль гоняют тесты прямо на Node (node --test).

/** Ответы квиза: белый список ключей и подписи для сообщения. Значения — текст вариантов как есть. */
const ANSWERS = {
  business: 'Бизнес',
  siteType: 'Тип сайта',
  features: 'Функции',
  integrations: 'Интеграции',
  volume: 'Объём',
} as const
type AnswerKey = keyof typeof ANSWERS
const ANSWER_KEYS = Object.keys(ANSWERS) as AnswerKey[]

/** Оффер, по кнопке которого пришли к форме (якорь #mockup / #sdek, content/site.ts): подпись в сообщении. */
const OFFERS = {
  mockup: 'бесплатный макет за 24 часа',
  sdek: 'скидка 60% по договору со СДЭК',
} as const
export type Offer = keyof typeof OFFERS

/** Способ связи из переключателя формы: подпись в сообщении. */
const CHANNELS = {
  phone: 'телефон',
  telegram: 'Telegram',
  email: 'почта',
} as const
export type Channel = keyof typeof CHANNELS

/** Что похоже на контакт каждого вида. Телефон — от 10 цифр и только цифры со скобками, пробелами, «+» и «-». */
const LOOKS: Record<Channel, (v: string) => boolean> = {
  phone: (v) => /^[\d\s()+-]+$/.test(v) && v.replace(/\D/g, '').length >= 10,
  telegram: (v) => /^(?:@|(?:https?:\/\/)?t\.me\/)?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(v),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
}
/** Ошибка, если строка не похожа ни на что: подсказка — по выбранному способу. */
const CHANNEL_ERROR: Record<Channel, string> = {
  phone: 'В номере не хватает цифр: например, +7 900 000-00-00',
  telegram: 'Проверьте ник: например, @username',
  email: 'Проверьте почту: например, name@mail.ru',
}
const CHANNEL_EMPTY: Record<Channel, string> = {
  phone: 'Укажите номер телефона',
  telegram: 'Укажите ник в Telegram',
  email: 'Укажите почту',
}

/**
 * Способ связи заявки: выбранный, если значение на него похоже; иначе тот, на который похоже (выбрали
 * «Телефон», а вписали @ivan — это Telegram, заявку не теряем); иначе null — ошибка поля.
 */
export function resolveChannel(contact: string, chosen?: Channel): Channel | null {
  if (chosen && LOOKS[chosen](contact)) return chosen
  return (Object.keys(LOOKS) as Channel[]).find((c) => LOOKS[c](contact)) ?? null
}

/** Откуда заявка: квиз и финальная форма главной, анкета партнёра (/partner). */
export type Source = 'quiz' | 'contact' | 'partner'
const SOURCES: readonly Source[] = ['quiz', 'contact', 'partner']

export type Lead = {
  source: Source
  offer?: Offer
  channel?: Channel
  name: string
  contact: string
  comment: string
  answers: Partial<Record<AnswerKey, string[]>>
  sdekContract: boolean
  page?: string
  /** Анкета партнёра: телефон — в contact, почта и должность — здесь. */
  partner?: { email: string; position: string }
}
export type Fields = Partial<
  Record<'source' | 'name' | 'contact' | 'phone' | 'email' | 'position' | 'comment' | 'consent', string>
>

const str = (v: unknown) => (typeof v === 'string' ? v.toWellFormed() : '')
/** Одна строка: пробелы, управляющие символы и символы смены направления текста → один пробел. */
const line = (v: unknown) => str(v).replace(/[\s\p{Cc}‪-‮⁦-⁩]+/gu, ' ').trim()
/** Многострочный текст: переносы строк остаются, не больше одной пустой строки подряд. */
const text = (v: unknown) => str(v).split(/\r\n|\r|\n/).map(line).join('\n').replace(/\n{3,}/g, '\n\n').trim()
const yes = (v: unknown) => v === true || v === 'on' || v === 'true' || v === '1'

/** FormData → объект той же формы, что JSON. Мультивыбор приходит повторяющимися ключами answers.<key>. */
export function formToObject(form: FormData): Record<string, unknown> {
  const answers: Record<string, unknown> = { sdekContract: form.get('answers.sdekContract') }
  for (const key of ANSWER_KEYS) answers[key] = form.getAll(`answers.${key}`)
  return { ...Object.fromEntries(form), answers }
}

/**
 * Проверяет и нормализует заявку. Заполненный honeypot `website` — `spam`,
 * ошибки полей — `fields`, иначе `lead`. `source` возвращается всегда, если он валиден.
 */
export function parseLead(input: unknown): { source?: Source; spam?: true; fields?: Fields; lead?: Lead } {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const source = SOURCES.find((s) => s === o.source)
  if (line(o.website)) return { source, spam: true }
  if (source === 'partner') return parsePartner(o)

  const name = line(o.name)
  const contact = line(o.contact)
  const chosen = typeof o.channel === 'string' && Object.hasOwn(CHANNELS, o.channel) ? (o.channel as Channel) : undefined
  // Без выбранного способа (старая форма) — как раньше: любой контакт от 3 символов.
  const channel = chosen && contact ? resolveChannel(contact, chosen) : undefined
  const comment = text(o.comment)
  const fields: Fields = {}
  if (!source) fields.source = 'Неизвестный тип заявки'
  if (!name) fields.name = 'Укажите имя'
  else if (name.length > 100) fields.name = 'Не больше 100 символов'
  if (!contact) fields.contact = chosen ? CHANNEL_EMPTY[chosen] : 'Укажите телефон, Telegram или email'
  else if (contact.length > 200) fields.contact = 'Не больше 200 символов'
  else if (chosen && !channel) fields.contact = CHANNEL_ERROR[chosen]
  else if (!chosen && contact.length < 3) fields.contact = 'Укажите телефон, Telegram или email'
  if (comment.length > 2000) fields.comment = 'Не больше 2000 символов'
  if (!yes(o.consent)) fields.consent = 'Нужно согласие на обработку персональных данных'
  if (!source || Object.keys(fields).length) return { source, fields }

  // Ответы необязательны: лишние ключи отбрасываем, длинное обрезаем, заявку из-за них не теряем.
  const raw = (o.answers && typeof o.answers === 'object' ? o.answers : {}) as Record<string, unknown>
  const answers: Lead['answers'] = {}
  for (const key of ANSWER_KEYS) {
    const values = [raw[key]].flat().map((v) => line(v).slice(0, 100)).filter(Boolean).slice(0, 15)
    if (values.length) answers[key] = values
  }
  const page = line(o.page).slice(0, 200)
  const offer = typeof o.offer === 'string' && Object.hasOwn(OFFERS, o.offer) ? (o.offer as Offer) : undefined
  return {
    source,
    lead: {
      source,
      ...(offer && { offer }),
      ...(channel && { channel }),
      name,
      contact,
      comment,
      answers,
      sdekContract: yes(raw.sdekContract),
      page: page.startsWith('/') ? page : undefined,
    },
  }
}

/** Анкета партнёра: ФИО, телефон, почта и должность обязательны, запрос — нет (как на старой странице). */
function parsePartner(o: Record<string, unknown>): { source: Source; fields?: Fields; lead?: Lead } {
  const source = 'partner'
  const name = line(o.name)
  const phone = line(o.phone)
  const email = line(o.email)
  const position = line(o.position)
  const comment = text(o.comment)
  const fields: Fields = {}
  if (!name) fields.name = 'Укажите ФИО'
  else if (name.length > 100) fields.name = 'Не больше 100 символов'
  if (!phone) fields.phone = CHANNEL_EMPTY.phone
  else if (phone.length > 40 || !LOOKS.phone(phone)) fields.phone = CHANNEL_ERROR.phone
  if (!email) fields.email = CHANNEL_EMPTY.email
  else if (email.length > 200 || !LOOKS.email(email)) fields.email = CHANNEL_ERROR.email
  if (!position) fields.position = 'Укажите должность'
  else if (position.length > 100) fields.position = 'Не больше 100 символов'
  if (comment.length > 2000) fields.comment = 'Не больше 2000 символов'
  if (!yes(o.consent)) fields.consent = 'Нужно согласие на обработку персональных данных'
  if (Object.keys(fields).length) return { source, fields }

  const page = line(o.page).slice(0, 200)
  return {
    source,
    lead: {
      source,
      channel: 'phone',
      name,
      contact: phone,
      comment,
      answers: {},
      sdekContract: false,
      page: page.startsWith('/') ? page : undefined,
      partner: { email, position },
    },
  }
}

/**
 * Куда вернуть браузер после отправки формы без JS (303): /lead/sent или /lead/error.
 * from — какая форма (ссылка «назад» на её якорь), field — коды полей с ошибкой через запятую.
 * Главная остаётся статичной: итог показывают отдельные страницы, а не query на `/`.
 */
export function resultPath(from: Source, ok: boolean, fields?: Fields): string {
  const query = new URLSearchParams({ from })
  if (!ok && fields) query.set('field', Object.keys(fields).join(','))
  return `/lead/${ok ? 'sent' : 'error'}?${query}`
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENTITIES[c])
const MSK = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', dateStyle: 'short', timeStyle: 'short' })

/** Текст для Telegram (parse_mode HTML): всё пользовательское экранировано. */
export function formatMessage(lead: Lead, now = new Date()): string {
  const meta = [`Время: ${MSK.format(now)} МСК`]
  if (lead.page) meta.unshift(`Страница: ${esc(lead.page)}`)

  if (lead.partner) {
    const rows = [
      '<b>Заявка: Партнёрство</b>',
      `ФИО: ${esc(lead.name)}`,
      `Телефон: ${esc(lead.contact)}`,
      `Почта: ${esc(lead.partner.email)}`,
      `Должность: ${esc(lead.partner.position)}`,
    ]
    if (lead.comment) rows.push(`Запрос: ${esc(lead.comment)}`)
    return [rows, meta].map((r) => r.join('\n')).join('\n\n')
  }

  const person = [
    `<b>Заявка: ${lead.source === 'quiz' ? 'Опрос' : 'Форма'}</b>`,
    `Имя: ${esc(lead.name)}`,
    `Контакт: ${esc(lead.contact)}${lead.channel ? ` (${CHANNELS[lead.channel]})` : ''}`,
  ]
  if (lead.offer) person.splice(1, 0, `Оффер: ${OFFERS[lead.offer]}`)
  if (lead.comment) person.push(`Комментарий: ${esc(lead.comment)}`)
  const quiz: string[] = []
  for (const key of ANSWER_KEYS) {
    const values = lead.answers[key]
    if (values) quiz.push(`${ANSWERS[key]}: ${esc(values.join(', '))}`)
  }
  if (lead.source === 'quiz' || lead.sdekContract) quiz.push(`Договор со СДЭК: ${lead.sdekContract ? 'есть' : 'нет'}`)
  return [person, quiz, meta]
    .filter((rows) => rows.length)
    .map((rows) => rows.join('\n'))
    .join('\n\n')
}

// ponytail: лимиты живут в памяти одного процесса и обнуляются при рестарте. Несколько инстансов —
// внешнее хранилище (Redis) или limit_req на nginx. На Vercel у каждого экземпляра функции свой счётчик,
// лимит мягче; пойдёт спам — правило rate limit в Vercel Firewall на /api/lead. Засчитываются только принятые заявки, поэтому
// в карте не больше ~600 IP (60 в минуту × 10 минут).
const IP_MAX = 5
const IP_WINDOW = 10 * 60_000
const TOTAL_MAX = 60
const TOTAL_WINDOW = 60_000
const byIp = new Map<string, number[]>()
let total: number[] = []

/** Засчитывает заявку с `ip`. false — лимит исчерпан (5 за 10 минут с IP или 60 в минуту на всех). */
export function takeSlot(ip: string, now = Date.now()): boolean {
  for (const [key, times] of byIp) {
    const fresh = times.filter((t) => now - t < IP_WINDOW)
    if (fresh.length) byIp.set(key, fresh)
    else byIp.delete(key)
  }
  total = total.filter((t) => now - t < TOTAL_WINDOW)
  const mine = byIp.get(ip) ?? []
  if (mine.length >= IP_MAX || total.length >= TOTAL_MAX) return false
  byIp.set(ip, [...mine, now])
  total.push(now)
  return true
}
