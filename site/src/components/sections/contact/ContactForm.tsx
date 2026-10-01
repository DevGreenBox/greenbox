'use client'

import { copy } from '@/content/copy'
import { typograf } from '@/lib/typograf'
import { Button } from '@/components/ui/Button'
import { contactRows, LeadError, LeadFields, LeadSent, OfferNote, offerRow } from './LeadParts'
import { useLeadForm } from './useLeadForm'
import { useOffer } from './useOffer'
import s from './Contact.module.css'

/** Финальная форма «Обсудить проект»: имя, контакт, пара слов о задаче, согласие. Состояния — как у квиза. */
export function ContactForm() {
  const { formRef, sentRef, status, fields, error, data, onSubmit, onChange, retry } = useLeadForm()
  const { commentLabel, submit } = copy.final.form
  // Пришли по «Получить бесплатный макет» (якорь #mockup у этой формы, Contact.tsx).
  const mockup = useOffer('mockup')

  if (status === 'sent' && data) {
    return <LeadSent rows={[...offerRow(data), ...contactRows(data, commentLabel)]} headingRef={sentRef} className={s.sent} />
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
      {mockup && <OfferNote offer="mockup" />}
      <LeadFields source="contact" errors={fields} commentLabel={commentLabel} />
      <div className={s.actions}>
        <Button type="submit" icon="arrow-right" className={s.submit} loading={status === 'sending'}>
          {submit}
        </Button>
        {/* Что будет после отправки: снимает вопрос «а дальше что?» у кнопки. */}
        <p className={s.after}>{typograf(copy.final.after)}</p>
      </div>
      {status === 'failed' && <LeadError message={error} onRetry={retry} />}
    </form>
  )
}
