import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Container } from '@/components/ui/Section'
import type { Metadata } from 'next'

// Свой заголовок и без canonical: иначе 404 выдавала бы себя за главную. noindex Next ставит сам.
export const metadata: Metadata = {
  title: 'Страница не найдена',
  alternates: { canonical: null },
}

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" data-scene="light" className="section pt-[calc(var(--header-h)+var(--section-y))]">
        <Container>
          <Heading as="h1" size="h2">
            Такой страницы нет
          </Heading>
          <p className="mt-(--space-lead) max-w-(--measure) text-lead text-ink-2">
            Похоже, ссылка устарела или в адресе опечатка. Можно вернуться на главную, а можно сразу рассказать о проекте.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/">На главную</ButtonLink>
            <ButtonLink href="/#contact" variant="secondary">
              Обсудить проект
            </ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}
