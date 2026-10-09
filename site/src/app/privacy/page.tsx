import type { Metadata } from 'next'
import { site } from '@/content/site'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Heading } from '@/components/ui/Heading'
import { Placeholder } from '@/components/ui/Placeholder'
import { Container } from '@/components/ui/Section'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbsLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  // Своё описание: без него страница унаследовала бы описание главной — про разработку магазинов,
  // к политике отношения не имеющее, и в выдаче сниппет противоречил бы заголовку.
  description:
    'Как ЗелёнаяКоробка обрабатывает персональные данные, оставленные через формы сайта, и реквизиты исполнителя.',
  alternates: { canonical: '/privacy' },
  // openGraph сливается неглубоко: без повтора полей страница унаследовала бы og:url главной.
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'ЗелёнаяКоробка', url: '/privacy' },
}

export default function PrivacyPage() {
  const { requisites, contacts } = site
  const rows = [
    ['Исполнитель', requisites.entity],
    ['ИНН', requisites.inn],
    ['ОГРНИП', requisites.ogrnip],
    ['Юридический адрес', requisites.legalAddress],
  ]

  return (
    <>
      <JsonLd data={breadcrumbsLd({ name: 'Политика конфиденциальности', path: '/privacy' })} />
      <Header />
      <main id="main" data-scene="light" className="section pt-[calc(var(--header-h)+var(--section-y))]">
        <Container>
          <div className="max-w-[46rem]">
            <Heading as="h1" size="h2">
              Политика конфиденциальности
            </Heading>

            <Placeholder block className="mt-(--space-head)">
              [текст политики — предоставит заказчик]
            </Placeholder>

            <section aria-labelledby="requisites-title" className="mt-16">
              <Heading as="h2" size="h4" id="requisites-title">
                Реквизиты
              </Heading>
              <dl className="mt-5 border-t border-line">
                {rows.map(([term, value]) => (
                  <div key={term} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                    <dt className="text-small text-ink-2">{term}</dt>
                    <dd className="tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="contacts-title" className="mt-16">
              <Heading as="h2" size="h4" id="contacts-title">
                Контакты
              </Heading>
              <ul className="mt-5 grid gap-2">
                <li>
                  Почта: <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                </li>
                <li>
                  Telegram: <a href={contacts.telegram.url}>{contacts.telegram.handle}</a>
                </li>
              </ul>
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
