import type { Metadata } from 'next'
import { privacy, PRIVACY_UPDATED } from '@/content/legal'
import { site } from '@/content/site'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Heading } from '@/components/ui/Heading'
import { Container } from '@/components/ui/Section'
import { typograf } from '@/lib/typograf'
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

/** Якорь раздела: берём номер из заголовка, чтобы id не зависел от его текста. */
const sectionId = (title: string) => `privacy-${title.split('.')[0]}`

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

            <p className="mt-(--space-head) text-lead text-ink-2">
              Документ объясняет, какие данные Сайт получает от посетителя, зачем они нужны, сколько
              хранятся и как их удалить. Он опубликован в открытом доступе, как требует статья 18.1
              Федерального закона № 152-ФЗ.
            </p>

            {privacy.map((section) => (
              <section key={section.title} aria-labelledby={sectionId(section.title)} className="mt-12">
                <Heading as="h2" size="h4" id={sectionId(section.title)}>
                  {section.title}
                </Heading>
                <div className="mt-4 grid gap-4">
                  {section.blocks.map((block, i) =>
                    typeof block === 'string' ? (
                      <p key={i} className="text-ink-2">
                        {typograf(block)}
                      </p>
                    ) : (
                      <ul key={i} className="grid gap-2 pl-5 text-ink-2 [&>li]:list-disc">
                        {block.map((item) => (
                          <li key={item}>{typograf(item)}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}

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

            <p className="mt-16 text-small text-ink-3">Редакция от {PRIVACY_UPDATED}.</p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
