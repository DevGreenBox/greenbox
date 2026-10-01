'use client'

import { partner } from '@/content/partner'
import { typograf } from '@/lib/typograf'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Consent, LeadError, LeadMeta, LeadSent, type SummaryRow } from '../contact/LeadParts'
import { useLeadForm } from '../contact/useLeadForm'
import s from './Partner.module.css'

const { labels, commentHint, submit, after, success } = partner.form
const id = (name: string) => `partner-${name}`

/**
 * Анкета партнёра: ФИО, должность, телефон, почта, запрос (необязательно), согласие. Отправка и состояния —
 * как у финальной формы (useLeadForm): без JS — обычный POST на /api/lead и страница итога, с JS — ошибки
 * у полей и сводка после отправки. Сервер проверяет телефон и почту по формату (lib/lead/lead.ts).
 */
export function PartnerForm() {
  const { formRef, sentRef, status, fields, error, data, onSubmit, onChange, retry } = useLeadForm()

  if (status === 'sent' && data) {
    const rows = (['name', 'position', 'phone', 'email', 'comment'] as const)
      .map((key): SummaryRow => [labels[key], String(data.get(key) ?? '').trim()])
      .filter(([, value]) => value)
    return <LeadSent rows={rows} headingRef={sentRef} text={success} className={s.sent} />
  }

  return (
    <form
      ref={formRef}
      action="/api/lead"
      method="post"
      encType="multipart/form-data"
      className={s.form}
      onSubmit={onSubmit}
      onChange={onChange}
    >
      <LeadMeta source="partner" page="/partner" />
      <Field id={id('name')} name="name" label={labels.name} required autoComplete="name" maxLength={100} error={fields.name} />
      <Field
        id={id('position')}
        name="position"
        label={labels.position}
        required
        autoComplete="organization-title"
        maxLength={100}
        error={fields.position}
      />
      <Field
        id={id('phone')}
        name="phone"
        type="tel"
        inputMode="tel"
        label={labels.phone}
        required
        autoComplete="tel"
        placeholder="+7 900 000-00-00"
        maxLength={40}
        error={fields.phone}
      />
      <Field
        id={id('email')}
        name="email"
        type="email"
        inputMode="email"
        label={labels.email}
        required
        autoComplete="email"
        placeholder="name@mail.ru"
        maxLength={200}
        error={fields.email}
      />
      <Field
        multiline
        id={id('comment')}
        name="comment"
        label={labels.comment}
        hint={commentHint}
        rows={3}
        maxLength={2000}
        error={fields.comment}
        className={s.wide}
      />
      <Consent id={id('consent')} error={fields.consent} />
      <div className={s.actions}>
        <Button type="submit" icon="arrow-right" className={s.submit} loading={status === 'sending'}>
          {submit}
        </Button>
        <p className={s.after}>{typograf(after)}</p>
      </div>
      {status === 'failed' && <LeadError message={error} onRetry={retry} />}
    </form>
  )
}
