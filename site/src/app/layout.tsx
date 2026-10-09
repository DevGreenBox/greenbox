import type { Metadata, Viewport } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationLd, webSiteLd } from '@/lib/seo'
import { martian, martianMono, martianWide, onest } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://greenboxweb.ru'),
  title: {
    // Запрос, по которому студию ищут, стоит первым: поисковик и человек в выдаче читают начало строки,
    // а хвост заголовка в сниппете часто обрезается. Бренд остаётся — он замыкает обе формы.
    default: 'Разработка интернет-магазинов под ключ — ЗелёнаяКоробка',
    template: '%s — ЗелёнаяКоробка',
  },
  description:
    'Разрабатываем интернет-магазины под ключ на своей платформе: индивидуальный дизайн, админка, интеграции с 1С, CRM и службами доставки. Запуск за 2–2,5 недели.',
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
        {/* Сквозная разметка: кто исполнитель и что это за сайт. Страничная (FAQ, услуга,
            хлебные крошки) добавляется на самих страницах — см. lib/seo.ts. */}
        <JsonLd data={organizationLd} />
        <JsonLd data={webSiteLd} />
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
