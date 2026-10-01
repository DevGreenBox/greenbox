import 'server-only'
import { appendFile } from 'node:fs/promises'
import { formatMessage, type Lead } from './lead'

/** Vercel: файловая система функций только для чтения и живёт минуты, журнал вызовов хранится недолго. */
const onVercel = Boolean(process.env.VERCEL)

/**
 * Отправляет заявку в Telegram. Пока нет TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID, пишет её в лог и считает
 * доставленной (так договорились до появления бота). false — Telegram не принял, заявка всё равно в логе.
 * На Vercel файла лога нет, и без бота заявка пропала бы молча: там она без токена не принимается —
 * посетитель видит ошибку и ссылку на Telegram студии, а текст заявки остаётся в журнале вызовов.
 */
export async function deliverLead(lead: Lead): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const now = new Date()
  if (!token || !chatId) {
    await writeLog(lead, now)
    if (onVercel) console.error('[lead] На Vercel не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID: заявка не доставлена')
    return !onVercel
  }

  let problem: string
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatMessage(lead, now),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) return true
    const data = (await res.json().catch(() => null)) as { description?: string } | null
    problem = `HTTP ${res.status} ${data?.description ?? ''}`
  } catch (e) {
    problem = e instanceof Error ? `${e.name}: ${e.message} ${e.cause ?? ''}` : String(e)
  }
  // Токен не должен попасть в лог, даже если окажется в тексте ошибки.
  console.error('[lead] Telegram не принял заявку:', problem.replaceAll(token, '***'))
  await writeLog(lead, now)
  return false
}

/** Заявка JSON-строкой в LEAD_LOG_PATH (по умолчанию ./leads.log от cwd) и в консоль; на Vercel — только в консоль. */
async function writeLog(lead: Lead, now: Date) {
  const line = JSON.stringify({ at: now.toISOString(), ...lead })
  console.info('[lead]', line)
  if (onVercel) return
  try {
    await appendFile(process.env.LEAD_LOG_PATH || 'leads.log', line + '\n')
  } catch (e) {
    console.error('[lead] Не удалось дописать лог заявок:', e)
  }
}
