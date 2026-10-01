import type { CSSProperties } from 'react'
import { copy } from '@/content/copy'
import { site } from '@/content/site'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { HeaderScroll } from './HeaderScroll'
import { MobileMenu } from './MobileMenu'

const HEADER_ID = 'site-header'

/**
 * Шапка: логотип, «О нас» и якоря из site.nav, «Стать партнёром», тема, «Обсудить проект».
 * current — отдельная страница, на которой стоим (/about, /partner): её ссылка помечена aria-current.
 * Всегда тёмная сцена. overlay — поверх тёмного первого экрана: прозрачна у самого верха страницы.
 * До 1280 px вместо навигации бургер (без JS — ссылка на разделы в подвале). Кнопка видна всегда:
 * от 420 px «Обсудить проект», уже — «Обсудить» (правка по критике 30.09.2026: на телефоне до заявки
 * было 11 экранов без кнопки).
 * Якоря ведут на /#…: с главной это прокрутка, с /privacy — переход на главную. Ссылки обычные <a>,
 * не next/link: переходить между двумя статичными страницами клиентским роутером незачем, а его код
 * шёл бы в первую загрузку.
 */
export function Header({ overlay = false, current }: { overlay?: boolean; current?: keyof typeof site.pages }) {
  const { about, partner } = site.pages
  const here = (page: keyof typeof site.pages) => (page === current ? ('page' as const) : undefined)
  // «Обсудить» + « проект»: хвост прячется на узком телефоне, доступное имя — видимый текст.
  const [cta, ...ctaRest] = copy.header.cta.split(' ')
  const logo = (
    <a href="/#top" className="site-header__logo" aria-label={`${site.brand} — на главную`}>
      <Logo />
    </a>
  )

  return (
    <>
      <HeaderScroll headerId={HEADER_ID} />
      <header id={HEADER_ID} className="site-header" data-scene="dark" data-overlay={overlay || undefined}>
        <div className="wrap site-header__row">
          {logo}

          <nav className="site-header__nav" aria-label="Разделы">
            <ul>
              <li>
                <a href={about.href} className="site-header__link" aria-current={here('about')}>
                  {about.label}
                </a>
              </li>
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a href={`/${item.href}`} className="site-header__link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <a href={partner.href} className="site-header__link site-header__partner" aria-current={here('partner')}>
              {partner.label}
            </a>
            <ThemeToggle className="site-header__theme" />
            <ButtonLink href="/#contact" size="sm" className="site-header__cta">
              {cta}
              <span className="site-header__cta-rest"> {ctaRest.join(' ')}</span>
            </ButtonLink>
            <MobileMenu logo={logo} openIcon={<Icon name="menu" />} closeIcon={<Icon name="close" />}>
              <nav className="wrap menu__nav" aria-label="Разделы">
                <ul>
                  <li style={{ '--i': 0 } as CSSProperties}>
                    <a href={about.href} aria-current={here('about')}>
                      {about.label}
                    </a>
                  </li>
                  {site.nav.map((item, i) => (
                    <li key={item.href} style={{ '--i': i + 1 } as CSSProperties}>
                      <a href={`/${item.href}`}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="wrap menu__foot">
                <div className="menu__links">
                  <a href={partner.href} aria-current={here('partner')}>
                    {partner.label}
                  </a>
                  <a href={site.contacts.telegram.url} target="_blank" rel="noopener">
                    <Icon name="send" className="size-5" />
                    Telegram {site.contacts.telegram.handle}
                    <span className="sr-only"> (откроется в новой вкладке)</span>
                  </a>
                  <ThemeToggle showLabel />
                </div>
                <ButtonLink href="/#contact" icon="arrow-right">
                  {copy.header.cta}
                </ButtonLink>
              </div>
            </MobileMenu>
            {/* Без JS бургер не открывается и скрыт — на его месте ссылка на разделы в подвале. */}
            <a href="#site-nav" className="burger burger--nojs">
              <Icon name="menu" />
              <span className="sr-only">Разделы сайта</span>
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
