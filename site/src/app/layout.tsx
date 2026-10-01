import type { Metadata, Viewport } from 'next'
import { martian, martianMono, martianWide, onest } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://greenboxweb.ru'),
  title: {
    default: 'ЗелёнаяКоробка — интернет-магазины под ключ',
    template: '%s — ЗелёнаяКоробка',
  },
  description:
    'Делаем интернет-магазины под ключ на своей платформе: дизайн, админка, доставка, 1С и CRM. Обычно запускаем за 2–2,5 недели.',
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'ЗелёнаяКоробка', url: '/' },
  twitter: { card: 'summary_large_image' },
  verification: { yandex: '35ded4ecd9b4aad3' },
}

// Верх страницы в обеих темах — тёмная шапка, низ — тёмный подвал: панель браузера тёмная всегда.
export const viewport: Viewport = {
  themeColor: '#0A0A14',
  colorScheme: 'light dark',
}

// До первой отрисовки: класс js для прогрессивных анимаций и тема (сохранённая или системная).
// После load и первого кадра — класс late-fonts (см. lateFontsCss).
const themeScript = `(function(){var d=document.documentElement,t;d.classList.add('js');try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;addEventListener('load',function(){requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add('late-fonts')})})})})()`

// Шрифты не первого экрана — h3–h4 (martian) и моноширинные подписи (martianMono) — с JS включаются
// после первого кадра. Иначе браузер находит их в первой раскладке (заголовки и подписи ниже сгиба)
// и качает до первой отрисовки наравне с CSS и шрифтами первого экрана: в Lighthouse это +150 мс
// к мобильному LCP. До включения — их запасные шрифты, как в фазе swap. Без JS правило не действует.
// Цена: один пересчёт стилей страницы после load (переменные на <html>).
const fallbackOnly = (font: { style: { fontFamily: string } }) =>
  font.style.fontFamily.slice(font.style.fontFamily.indexOf(',') + 1).trim()
const lateFontsCss = `html.js:not(.late-fonts){--font-martian:${fallbackOnly(martian)};--font-martian-mono:${fallbackOnly(martianMono)}}`

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ЗелёнаяКоробка',
  legalName: 'ИП Дробышев Илья Станиславович',
  url: 'https://greenboxweb.ru',
  logo: 'https://greenboxweb.ru/brand/logo.svg',
  email: 'info.greenboxweb@gmail.com',
  sameAs: ['https://t.me/infogreenbox'],
  address: {
    '@type': 'PostalAddress',
    postalCode: '350080',
    addressRegion: 'Краснодарский край',
    addressLocality: 'Краснодар',
    streetAddress: 'ул. им. 30-й Иркутской Дивизии',
    addressCountry: 'RU',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${onest.variable} ${martianWide.variable} ${martian.variable} ${martianMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: lateFontsCss }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:font-semibold focus:text-on-accent"
        >
          Перейти к содержанию
        </a>
        {children}
      </body>
    </html>
  )
}
