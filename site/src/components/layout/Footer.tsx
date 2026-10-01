import { site } from '@/content/site'
import { Logo } from '@/components/brand/Logo'
import { typograf } from '@/lib/typograf'
import { ButtonLink } from '@/components/ui/Button'

// Ссылки на /#… — обычные <a>, как в шапке (Header.tsx): клиентский роутер двум статичным страницам не нужен.
// Год сборки: страница пререндерится, при выкате в новом году обновится сам.
const YEAR = new Date().getFullYear()

/**
 * Подвал: бренд с кратким описанием и кнопкой, разделы (те же, что в шапке), контакты, компания, реквизиты ИП, ©.
 * Тёмная сцена. На телефоне компактно (components.css): разделы и «Компания» в две колонки.
 */
export function Footer() {
  const { brand, contacts, requisites, pages, nav, launchTerm } = site

  return (
    <footer className="site-footer" data-scene="dark">
      <div className="wrap">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <a href="/#top" className="site-footer__logo" aria-label={`${brand} — на главную`}>
              <Logo />
            </a>
            <p className="site-footer__about">
              {typograf(`Делаем интернет-магазины под ключ на своей платформе. Обычно запускаем за ${launchTerm}.`)}
            </p>
            <ButtonLink href="/#contact" size="sm" className="site-footer__cta">
              Обсудить проект
            </ButtonLink>
          </div>
          <nav id="site-nav" className="site-footer__col" aria-label="Разделы сайта">
            <p className="site-footer__title">Разделы</p>
            <ul className="site-footer__links">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={`/${item.href}`}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-footer__col site-footer__col--contacts">
            <p className="site-footer__title">Контакты</p>
            <ul className="site-footer__links" aria-label="Контакты">
              <li>
                <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              </li>
              <li>
                <a href={contacts.telegram.url} target="_blank" rel="noopener">
                  Telegram {contacts.telegram.handle}
                  <span className="sr-only"> (откроется в новой вкладке)</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="site-footer__col">
            <p className="site-footer__title">Компания</p>
            <ul className="site-footer__links" aria-label="Компания">
              <li>
                <a href={pages.about.href}>{pages.about.label}</a>
              </li>
              <li>
                <a href={pages.partner.href}>{pages.partner.label}</a>
              </li>
              <li>
                <a href="/#quiz">Рассказать о проекте</a>
              </li>
              <li>
                <a href="/privacy">Политика конфиденциальности</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__req">
            {requisites.entity}
            <br />
            {/* Неразрывный пробел держит метку с номером; при крупном шрифте номер переносится (overflow-wrap в base.css) */}
            <span>ИНН{'\u00A0'}{requisites.inn}</span> ·{' '}
            <span>ОГРНИП{'\u00A0'}{requisites.ogrnip}</span>
            <br />
            {typograf(requisites.legalAddress)}
          </p>
          <p>
            © {YEAR} {brand}
          </p>
        </div>
      </div>
    </footer>
  )
}
