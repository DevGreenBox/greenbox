import type { Ref } from 'react'
import { contactFields, quizUi, type ContactField } from '@/content/quiz'
import { site } from '@/content/site'
import { cx } from '@/lib/cx'
import type { Fields, Offer, Source } from '@/lib/lead/lead'
import { typograf } from '@/lib/typograf'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { ChannelField, CommentField } from './LeadInputs'
import s from './Lead.module.css'

// Общие части квиза и финальной формы: поля контактов, ошибка отправки, успех со сводкой.

const field = Object.fromEntries(contactFields.map((f) => [f.name, f])) as Record<ContactField['name'], ContactField>

/**
 * Служебные поля (source, page, honeypot) и контакты: имя, «Как с вами связаться» (способ + поле, LeadInputs),
 * комментарий (спрятан за ссылкой), согласие.
 * Лимиты длины — как на сервере (lib/lead/lead.ts), required и minLength — проверка браузера без JS.
 * id явные, от source: формы — острова со своим корнем React (lib/island.tsx), useId там дал бы другие id.
 */
export function LeadFields({ source, errors, commentLabel }: { source: Source; errors: Fields; commentLabel?: string }) {
  const id = (name: string) => `${source}-${name}`
  const { name, contact, comment } = field

  return (
    <>
      <LeadMeta source={source} page="/" />
      <Field id={id('name')} name="name" label={name.label} required autoComplete="name" maxLength={100} error={errors.name} />
      <ChannelField id={id('contact')} label={contact.label} error={errors.contact} />
      <CommentField id={id('comment')} label={commentLabel ?? comment.label} error={errors.comment} />
      <Consent id={id('consent')} error={errors.consent} />
    </>
  )
}

/** Служебные поля заявки: какая форма, с какой страницы, и honeypot. */
export function LeadMeta({ source, page }: { source: Source; page: string }) {
  return (
    <>
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="page" value={page} />
      {/* Honeypot: людям и скринридерам не виден, боты заполняют — сервер молча отбрасывает заявку. */}
      <div className="sr-only" aria-hidden="true">
        <label>
          Не заполняйте это поле
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </>
  )
}

/** Согласие на обработку персональных данных (152-ФЗ). Ссылка — только на «персональных данных»: клик по
 *  остальной подписи переключает галочку. */
export function Consent({ id, error }: { id: string; error?: string }) {
  const { consent } = field
  const words = consent.label.split(' ')
  const newTab = `${id}-new-tab`
  return (
    <Checkbox id={id} name="consent" required error={error}>
      {words.slice(0, -2).join(' ')}{' '}
      <a href={consent.href} target="_blank" rel="noopener" aria-describedby={newTab}>
        {words.slice(-2).join(' ')}
      </a>
      <span id={newTab} hidden>
        откроется в новой вкладке
      </span>
    </Checkbox>
  )
}

/**
 * Выбранный оффер над полями формы и скрытое поле offer для заявки. Строка видна, только если пришли
 * по кнопке оффера (useOffer); без JS её нет — заявка уходит без пометки.
 */
export function OfferNote({ offer, className }: { offer: Offer; className?: string }) {
  return (
    <p className={cx(s.offer, className)}>
      <input type="hidden" name="offer" value={offer} />
      <Icon name="check" className={s.offerIcon} />
      <span>{typograf(site.offers[offer].short)}</span>
    </p>
  )
}

/** Сводка после отправки: выбранный оффер первой строкой. */
export function offerRow(data: FormData): SummaryRow[] {
  const offer = data.get('offer')
  return offer === 'mockup' ? [['Оффер', site.offers[offer].short]] : []
}

/** Сервер не принял заявку или нет связи: текст, «Попробовать ещё раз» и запасной путь — Telegram. */
export function LeadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { telegram } = site.contacts
  return (
    <div role="alert" className={s.error}>
      <Icon name="alert" className={s.errorIcon} />
      <p>{typograf(message)}</p>
      <div className={s.errorActions}>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {quizUi.retry}
        </Button>
        <ButtonLink href={telegram.url} variant="text" external>
          Telegram {telegram.handle}
        </ButtonLink>
      </div>
    </div>
  )
}

export type SummaryRow = readonly [label: string, value: string]

/** Заявка принята: сообщение (на него уходит фокус) и сводка того, что отправлено. text — «Готово. Что дальше». */
export function LeadSent({
  rows,
  headingRef,
  className,
  text = quizUi.success,
}: {
  rows: SummaryRow[]
  headingRef: Ref<HTMLHeadingElement>
  className?: string
  text?: string
}) {
  const at = text.indexOf('. ')
  const [done, next] = [text.slice(0, at), text.slice(at + 2)]
  return (
    <div className={cx(s.sent, className)}>
      <span className={s.sentMark}>
        <Icon name="check" />
      </span>
      <h3 ref={headingRef} tabIndex={-1} className={cx('font-display text-h3', s.sentTitle)}>
        {done}. <span className="text-ink-2">{next}</span>
      </h3>
      {rows.length > 0 && (
        <dl className={s.summary}>
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{typograf(label)}</dt>
              <dd>{typograf(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/** Контакты из отправленной формы для сводки: имя, способ связи, комментарий (если есть). */
export function contactRows(data: FormData, commentLabel = field.comment.label): SummaryRow[] {
  const rows: SummaryRow[] = [
    [field.name.label, String(data.get('name') ?? '')],
    [field.contact.label, String(data.get('contact') ?? '')],
    [commentLabel, String(data.get('comment') ?? '')],
  ]
  return rows.map(([label, value]) => [label, value.trim()] as const).filter(([, value]) => value)
}
