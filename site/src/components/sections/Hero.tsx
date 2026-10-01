import type { CSSProperties } from 'react'
import { copy } from '@/content/copy'
import { site } from '@/content/site'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Container, Section } from '@/components/ui/Section'
import { Demo } from './hero/Demo'
import { HeroBackdrop } from './hero/HeroBackdrop'
import s from './hero/Hero.module.css'

const step = (i: number) => ({ '--i': i }) as CSSProperties

// Первый экран: тёмная сцена, шапка поверх (overlay), id="top" — на него ведёт логотип.
// Серверный: интерактив витрины — нативные переключатели и CSS (hero/Demo.tsx); клиентский
// только замер фона-чертежа (hero/GridLive.tsx). Появление — CSS-анимация сразу при загрузке,
// не data-reveal (он ждёт JS). LCP — текст (h1 / подзаголовок): виден с первого кадра.
// До 1024 иллюстрация стоит над заголовком (решение заказчика 30.09.2026) — только визуально (order):
// в разметке заголовок первым, скринридер и Tab начинают с него, демо — пояснение к нему.
export function Hero() {
  const { title, subtitle, primaryCta, secondaryCta } = copy.hero
  const offers = [site.offers.mockup, site.offers.sdek]
  const [word, ...rest] = title.split(' ')

  return (
    <Section id="top" scene="dark" labelledBy="hero-title" bleed className={s.hero}>
      <HeroBackdrop />
      <Container className={s.grid}>
        <div>
          <Heading as="h1" id="hero-title" className={s.title}>
            <span className="text-gradient-hero">{word}</span> {rest.join(' ')}
          </Heading>
          <p className={cx('mt-(--space-lead) max-w-[30em] text-lead text-ink-2', s.lift)} style={step(1)}>
            {typograf(subtitle)}
          </p>
          <div className={cx(s.cta, s.enter)} style={step(2)}>
            <ButtonLink href={primaryCta.href} icon="arrow-right">
              {primaryCta.label}
            </ButtonLink>
            <ButtonLink href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </ButtonLink>
          </div>
          {/* Два оффера тихим списком, не плашками (правка по критике 30.09.2026: макет за 24 часа был только
              в «Почему»). Ссылки — сразу на форму оффера: #mockup — заявка, #sdek — квиз (site.offers). */}
          <ul className={cx(s.offers, s.enter)} style={step(3)}>
            {offers.map((offer) => (
              <li key={offer.anchor}>
                <Icon name="check" className={s.offerIcon} />
                <a href={`#${offer.anchor}`}>{typograf(offer.short)}</a>
              </li>
            ))}
          </ul>
        </div>
        <Demo className={s.demo} />
      </Container>
    </Section>
  )
}
