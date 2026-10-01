import type { Metadata } from 'next'
import { copy } from '@/content/copy'
import { partner } from '@/content/partner'
import { contactFields } from '@/content/quiz'
import { site } from '@/content/site'
import { typograf } from '@/lib/typograf'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Container } from '@/components/ui/Section'

// Ошибка отправки формы без JS: /api/lead отвечает 303 сюда (lib/lead/lead.ts, resultPath).
// from — какая форма (quiz | contact | partner), field — коды полей с ошибкой; без field — сбой на нашей стороне
// (лимит заявок, Telegram не принял). Коды не из списка игнорируются, в разметку ничего не отражается.

export const metadata: Metadata = {
  title: 'Заявка не отправлена',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

const labels: Record<string, string> = Object.fromEntries(contactFields.map((f) => [f.name, f.label]))
/** Анкета партнёра: свои поля, согласие — то же. */
const partnerLabels: Record<string, string> = { ...partner.form.labels, consent: labels.consent }

export default async function LeadErrorPage({ searchParams }: PageProps<'/lead/error'>) {
  const { from, field } = await searchParams
  const quiz = from === 'quiz'
  const fromPartner = from === 'partner'
  const names = fromPartner ? partnerLabels : labels
  const bad = String(field ?? '')
    .split(',')
    .filter((code) => code in names)
    .map((code) => {
      // Подписи — как на форме, в кавычках: так их проще найти глазами, вернувшись назад.
      if (code === 'comment') {
        const label = fromPartner ? names.comment : quiz ? labels.comment : copy.final.form.commentLabel
        return `«${label}» — не больше 2000 символов`
      }
      return `«${names[code]}»`
    })
  const need = fromPartner
    ? 'Нужны ФИО, должность, номер телефона, почта и галочка согласия на обработку персональных данных.'
    : 'Нужны имя, способ связи (телефон, Telegram или email) и галочка согласия на обработку персональных данных.'
  const back = fromPartner ? '/partner#partner-form' : quiz ? '/#quiz' : '/#contact'
  const { telegram } = site.contacts

  return (
    <>
      <Header />
      <main id="main" data-scene="light" className="section pt-[calc(var(--header-h)+var(--section-y))]">
        <Container>
          <Heading as="h1" size="h2">
            Заявка не отправлена
          </Heading>
          <div className="mt-(--space-lead) grid max-w-(--measure) gap-4 text-lead text-ink-2">
            {bad.length > 0 ? (
              <>
                <p>
                  Проверьте: <span className="text-ink">{bad.join(', ')}</span>.
                </p>
                <p>{typograf(need)}</p>
              </>
            ) : (
              <p>
                {typograf(
                  `Заявка не дошла, похоже, сбой на нашей стороне. Попробуйте ещё раз через пару минут или напишите нам в Telegram ${telegram.handle}.`,
                )}
              </p>
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={back} iconStart="arrow-left" className="whitespace-normal">
              {quiz ? 'Вернуться к опросу' : fromPartner ? 'Вернуться к анкете' : 'Вернуться к форме'}
            </ButtonLink>
            <ButtonLink href={telegram.url} variant="secondary" external className="whitespace-normal">
              Telegram {telegram.handle}
            </ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
