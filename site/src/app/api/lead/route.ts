import { formToObject, parseLead, resultPath, takeSlot, type Fields, type Source } from '@/lib/lead/lead'
import { deliverLead } from '@/lib/lead/send'

const MAX_BODY = 16 * 1024
let honeypotHits = 0

/** Приём заявок квиза и формы: JSON от fetch или обычная отправка формы без JS. */
export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const type = contentType.split(';')[0].trim().toLowerCase()
  const isJson = type === 'application/json'
  if (!isJson && type !== 'application/x-www-form-urlencoded' && type !== 'multipart/form-data') {
    return Response.json({ ok: false, error: 'Неподдерживаемый формат заявки' }, { status: 415 })
  }

  let from: Source = 'contact'
  // fetch получает JSON; форма без JS — 303 на страницу итога: /lead/sent или /lead/error (resultPath).
  const reply = (status: number, error?: string, fields?: Fields) => {
    if (isJson) return Response.json(error ? { ok: false, error, fields } : { ok: true }, { status })
    return new Response(null, { status: 303, headers: { location: resultPath(from, !error, fields) } })
  }

  const body = Number(request.headers.get('content-length')) > MAX_BODY ? null : await readBody(request)
  if (!body) return reply(413, 'Заявка слишком большая')

  let input: unknown
  try {
    input = isJson
      ? JSON.parse(new TextDecoder().decode(body))
      : formToObject(await new Response(body, { headers: { 'content-type': contentType } }).formData())
  } catch {
    return reply(400, 'Не удалось прочитать заявку')
  }

  const { source, spam, fields, lead } = parseLead(input)
  if (source) from = source
  if (spam) {
    console.info('[lead] honeypot, всего с запуска:', ++honeypotHits)
    return reply(200)
  }
  if (!lead) return reply(400, 'Проверьте поля формы', fields)

  // Первый адрес X-Forwarded-For честный, только если nginx перезаписывает заголовок
  // (proxy_set_header X-Forwarded-For $remote_addr), а не дописывает. Иначе лимит на IP обходится
  // подменой заголовка и держит только общий потолок. На Vercel заголовок ставит сама платформа: внешний
  // X-Forwarded-For она перезаписывает адресом клиента.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip')?.trim() || 'unknown'
  if (!takeSlot(ip)) {
    return reply(429, 'Слишком много заявок подряд. Попробуйте позже или напишите нам в Telegram @infogreenbox')
  }

  if (await deliverLead(lead)) return reply(200)
  return reply(502, 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram @infogreenbox')
}

/** Читает тело, но не больше MAX_BODY байт: content-length может не быть (chunked). null — слишком большое. */
async function readBody(request: Request) {
  const chunks: Uint8Array[] = []
  let size = 0
  const reader = request.body?.getReader()
  while (reader) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
