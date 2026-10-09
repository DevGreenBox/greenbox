import type { Metadata } from 'next'
import { about } from '@/content/about'
import { copy } from '@/content/copy'
import { typograf } from '@/lib/typograf'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Team } from '@/components/sections/Team'
import { ButtonLink } from '@/components/ui/Button'
import { brandFit, Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/motion/Reveal'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbsLd } from '@/lib/seo'

// «О нас» (решение заказчика 01.10.2026): блок «О нас» старой главной greenboxweb.ru отдельной страницей.
// Тексты — content/about.ts. Ритм сцен: тёмная (вступление) → светлая (подход и ценности) → светлая-2
// (команда, та же секция, что на главной) → тёмная (заявка). Reveal — для проявки портретов команды.

export const metadata: Metadata = {
  title: 'О нас',
  description: typograf(about.lead),
  alternates: { canonical: '/about' },
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'ЗелёнаяКоробка', url: '/about' },
}

export default function AboutPage() {
  const { title, accent, lead, approachTitle, approachAccent, text, values } = about

  return (
    <>
      <JsonLd data={breadcrumbsLd({ name: 'О нас', path: '/about' })} />
      <Header current="about" />
      <main id="main">
        <Section id="about" scene="dark" className="pt-[calc(var(--header-h)+var(--section-y))]">
          <Heading as="h1" id="about-title" style={brandFit} accent={accent}>
            {typograf(title)}
          </Heading>
          <p className="mt-(--space-lead) max-w-[44ch] text-lead text-ink-2">{typograf(lead)}</p>
        </Section>

        <Section id="approach" scene="light">
          <div className="grid gap-(--space-head) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-(--gap-lg)">
            <Heading id="approach-title" accent={approachAccent}>
              {typograf(approachTitle)}
            </Heading>
            <div className="grid max-w-(--measure) gap-5 text-lead text-ink-2">
              {text.map((paragraph) => (
                <p key={paragraph}>{typograf(paragraph)}</p>
              ))}
            </div>
          </div>
          <ul className="mt-(--space-head) grid gap-x-(--gap) gap-y-10 md:grid-cols-3">
            {values.map((value) => (
              <li key={value.title} className="border-t border-line-strong pt-6">
                <h3 className="font-display text-h4">{typograf(value.title)}</h3>
                <p className="mt-3 text-ink-2">{typograf(value.text)}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Team />

        <Section id="about-cta" scene="dark">
          <Heading id="about-cta-title" accent={copy.final.accent}>
            {typograf(copy.final.title)}
          </Heading>
          <p className="mt-(--space-lead) max-w-[40ch] text-lead text-ink-2">{typograf(copy.final.text)}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/#contact" icon="arrow-right" className="whitespace-normal">
              {copy.header.cta}
            </ButtonLink>
            <ButtonLink href="/#quiz" variant="secondary" className="whitespace-normal">
              Рассказать о проекте
            </ButtonLink>
          </div>
        </Section>
      </main>
      <Footer />
      <Reveal />
    </>
  )
}
