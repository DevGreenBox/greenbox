'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { contactChannels, quizUi } from '@/content/quiz'
import type { Channel } from '@/lib/lead/lead'
import { cx } from '@/lib/cx'
import { Field, FieldError } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import s from './Lead.module.css'

// Поля заявки, которым нужно состояние: способ связи и спрятанный комментарий (форма «быстрее заполнить»,
// решение заказчика 30.09.2026). Общие для финальной формы и шага «Контакты» квиза (LeadFields).

/**
 * «Как с вами связаться»: переключатель Телефон / Telegram / Почта (нативные radio name="channel") и одно поле.
 * От способа зависят клавиатура на телефоне, автозаполнение и пример в поле. Проверяет сервер: если выбран
 * не тот способ, он сам определяет верный и заявку не теряет (lib/lead/lead.ts, resolveChannel).
 * До гидрации и без JS поле — обычный текст (radio работают и так).
 */
/** false на сервере и при гидрации, true — когда клиент ожил: тип поля по способу связи ставим только тогда. */
const noop = () => () => {}
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false)

export function ChannelField({ id, label, error }: { id: string; label: string; error?: string }) {
  const [channel, setChannel] = useState<Channel>(contactChannels[0].id)
  const hydrated = useHydrated()
  const current = contactChannels.find((c) => c.id === channel) ?? contactChannels[0]
  const labelId = `${id}-label`
  const errorId = error ? `${id}-error` : undefined

  // Два поля рядом, а не одно: выбор способа и само значение. В широкой форме они встают в ряд с «Имя»
  // (Contact.module.css), в узкой — друг под другом. Подпись значения — по способу: «Номер телефона»…
  return (
    <>
      <div className={cx('field', s.channelPick)} role="radiogroup" aria-labelledby={labelId}>
        <p id={labelId} className="field__label">
          {label}
          <span className="field__req" aria-hidden="true">
            *
          </span>
        </p>
        <div className={s.channels}>
          {contactChannels.map((c) => (
            <label key={c.id} className={s.channel}>
              <input
                type="radio"
                name="channel"
                value={c.id}
                checked={channel === c.id}
                onChange={() => setChannel(c.id)}
                className={s.channelInput}
              />
              <span className={s.channelBody}>
                <Icon name={c.icon} className={s.channelIcon} />
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={id} className="field__label">
          {current.inputLabel}
          <span className="field__req" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={id}
          name="contact"
          type={hydrated ? current.type : 'text'}
          inputMode={hydrated ? current.inputMode : undefined}
          autoComplete={current.autoComplete}
          placeholder={current.placeholder}
          required
          minLength={3}
          maxLength={200}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="field__control"
        />
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </>
  )
}

/**
 * Комментарий необязателен: с JS спрятан за «Добавить комментарий» (скрытие — CSS по html.js, поэтому
 * при гидрации ничего не прыгает), без JS виден сразу. Ошибка поля держит его открытым.
 */
export function CommentField({ id, label, error }: { id: string; label: string; error?: string }) {
  const [open, setOpen] = useState(false)
  const shown = open || Boolean(error)
  useEffect(() => {
    if (open) document.getElementById(id)?.focus()
  }, [open, id])

  return (
    <div className={s.comment} data-open={shown || undefined}>
      <button type="button" className={s.addComment} aria-controls={id} aria-expanded={shown} onClick={() => setOpen(true)}>
        <Icon name="plus" className={s.addCommentIcon} />
        {quizUi.addComment}
      </button>
      <Field multiline id={id} name="comment" label={label} rows={3} maxLength={2000} error={error} />
    </div>
  )
}
