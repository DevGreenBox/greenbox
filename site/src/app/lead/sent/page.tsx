import type { Metadata } from 'next'
import { partner } from '@/content/partner'
import { quizUi } from '@/content/quiz'
import { site } from '@/content/site'
import { typograf } from '@/lib/typograf'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Container } from '@/components/ui/Section'

// Итог отправки формы без JS: /api/lead отвечает 303 сюда (lib/lead/lead.ts, resultPath).
// С JS сюда не попадают — итог показывает сама форма. from — какая форма: quiz | contact | partner.

export const metadata: Metadata = {
  title: 'Заявка отправлена',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default async function LeadSentPage({ searchParams }: PageProps<'/lead/sent'>) {
  const { from } = await searchParams
  const fromPartner = from === 'partner'
  const message = fromPartner ? partner.form.success : quizUi.success
  const at = message.indexOf('. ')
  const [title, text] = [message.slice(0, at), message.slice(at + 2).replace(/\.$/, '')]
  const back = fromPartner ? '/partner' : from === 'quiz' ? '/#quiz' : '/#contact'
  const { telegram } = site.contacts

  return (
    <>
      <Header />
      <main id="main" data-scene="light" className="section pt-[calc(var(--header-h)+var(--section-y))]">
        <Container>
          <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent">
            <Icon name="check" className="size-6 [stroke-width:2.25]" />
          </span>
          <Heading as="h1" size="h2" className="mt-8">
            {title}
          </Heading>
          <p className="mt-(--space-lead) max-w-(--measure) text-lead text-ink-2">
            {typograf(`${text}. Если вопрос срочный, напишите нам в Telegram `)}
            <a href={telegram.url} target="_blank" rel="noopener">
              {telegram.handle}
              <span className="sr-only"> (откроется в новой вкладке)</span>
            </a>
            .
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={back} iconStart="arrow-left" className="whitespace-normal">
              Вернуться на сайт
            </ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
