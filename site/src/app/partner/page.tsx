import type { Metadata } from 'next'
import { partner } from '@/content/partner'
import { typograf } from '@/lib/typograf'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { brandFit, Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { PartnerForm } from '@/components/sections/islands'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbsLd } from '@/lib/seo'

// «Стать партнёром» (решение заказчика 01.10.2026): старая страница greenboxweb.ru/partner.html в стиле сайта.
// Тексты — content/partner.ts. Ритм сцен: тёмная (вступление) → светлая (условия) → тёмная (анкета).
// Анкета уходит через сервер (/api/lead, source=partner): на старой странице токен бота лежал в коде страницы.

export const metadata: Metadata = {
  title: 'Стать партнёром',
  description: typograf(partner.lead),
  alternates: { canonical: '/partner' },
  // openGraph сливается неглубоко: без повтора полей страница унаследовала бы og:url главной.
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'ЗелёнаяКоробка', url: '/partner' },
}

export default function PartnerPage() {
  const { title, accent, lead, cta, termsTitle, termsAccent, terms, client, form } = partner

  return (
    <>
      <JsonLd data={breadcrumbsLd({ name: 'Стать партнёром', path: '/partner' })} />
      <Header current="partner" />
      <main id="main">
        <Section id="partner" scene="dark" className="pt-[calc(var(--header-h)+var(--section-y))]">
          <Heading as="h1" id="partner-title" className="max-w-[14em]" style={brandFit} accent={accent}>
            {typograf(title)}
          </Heading>
          <p className="mt-(--space-lead) max-w-[44ch] text-lead text-ink-2">{typograf(lead)}</p>
          <div className="mt-10">
            <ButtonLink href="#partner-form" icon="arrow-right" className="whitespace-normal">
              {cta}
            </ButtonLink>
          </div>
        </Section>

        <Section id="partner-terms" scene="light">
          <Heading id="partner-terms-title" accent={termsAccent}>
            {typograf(termsTitle)}
          </Heading>
          <ul className="mt-(--space-head) grid gap-x-(--gap) gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {terms.map((term) => (
              <li key={term.title} className="border-t border-line-strong pt-6">
                <h3 className="font-display text-h4">{typograf(term.title)}</h3>
                <p className="mt-3 text-ink-2">{typograf(term.text)}</p>
              </li>
            ))}
          </ul>

          {/* Пришли заказать магазин — их форма другая: бриф (квиз) на главной. */}
          <div className="mt-(--space-head) flex flex-col items-start gap-x-(--gap-lg) gap-y-4 rounded-panel border border-line bg-surface p-[clamp(1.5rem,1rem+1.5vw,2.5rem)] shadow-soft md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-h4">{typograf(client.title)}</h2>
              <p className="mt-2 max-w-[48ch] text-ink-2">{typograf(client.text)}</p>
            </div>
            <ButtonLink href={client.link.href} variant="secondary" icon="arrow-right" className="shrink-0 whitespace-normal">
              {client.link.label}
            </ButtonLink>
          </div>
        </Section>

        <Section id="partner-form" scene="dark">
          <Heading id="partner-form-title" accent={form.accent}>
            {typograf(form.title)}
          </Heading>
          <p className="mt-(--space-lead) max-w-[40ch] text-lead text-ink-2">{typograf(form.text)}</p>
          <div className="mt-(--space-head)">
            <PartnerForm />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  )
}
