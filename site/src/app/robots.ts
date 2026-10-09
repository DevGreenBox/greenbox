import type { MetadataRoute } from 'next'

// Закрыты от обхода только служебные адреса: приёмник заявок и страницы итога отправки. Сами страницы
// итога уже отдают noindex в метаданных, но запрет обхода бережёт краулинговый бюджет — робот не ходит
// по адресам, которых всё равно не будет в выдаче. Страница /ds (дизайн-система) в продакшене отдаёт 404
// и в карту сайта не входит, поэтому отдельной строки не требует.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/lead/'] },
    sitemap: 'https://greenboxweb.ru/sitemap.xml',
    host: 'https://greenboxweb.ru',
  }
}
