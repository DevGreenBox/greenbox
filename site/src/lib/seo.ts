// Микроразметка schema.org (JSON-LD) для поисковиков. Собрана в одном месте, потому что данные для неё
// берутся из content/ и не должны расходиться с тем, что видит посетитель: Google и Яндекс считают
// нарушением разметку, которой нет на странице.
//
// Чего здесь намеренно НЕТ:
//   • AggregateRating и Review по отзывам с главной. Отзывы о самой студии, размещённые на её же сайте,
//     Google относит к self-serving и в сниппете не показывает (то же и у Яндекса) — разметка добавила бы
//     вес страницы, но не дала бы ни звёзд, ни пользы;
//   • вопрос о цене в FAQPage, пока в ответе стоит заглушка «[цена]»: см. комментарий у faqPageLd.

import { faq } from '@/content/faq'
import { site } from '@/content/site'

/** Адрес сайта. Совпадает с metadataBase в layout.tsx — URL в разметке должны быть абсолютными. */
export const ORIGIN = 'https://greenboxweb.ru'

/**
 * Исполнитель. Тип ProfessionalService (подтип LocalBusiness), а не просто Organization: студия —
 * поставщик услуг с юридическим адресом и зоной работы, и этот тип даёт поисковику больше понимания
 * сущности. Поля юрлица — content/site.ts, они же напечатаны на странице политики.
 */
export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${ORIGIN}/#organization`,
  name: site.brand,
  legalName: site.requisites.entity,
  description:
    'Студия разработки интернет-магазинов под ключ: индивидуальный дизайн, собственная система управления, интеграции с 1С, CRM и службами доставки.',
  url: ORIGIN,
  logo: `${ORIGIN}/brand/logo.svg`,
  image: `${ORIGIN}/brand/logo.svg`,
  email: site.contacts.email,
  taxID: site.requisites.inn,
  sameAs: [site.contacts.telegram.url],
  // Канал связи для поисковика: обращения идут в Telegram и на почту, телефона у студии нет.
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: site.contacts.email,
    url: site.contacts.telegram.url,
    availableLanguage: ['Russian'],
  },
  address: {
    '@type': 'PostalAddress',
    postalCode: '350080',
    addressRegion: 'Краснодарский край',
    addressLocality: 'Краснодар',
    streetAddress: 'ул. им. 30-й Иркутской Дивизии',
    addressCountry: 'RU',
  },
  // Работа удалённая по всей стране — иначе поисковик сузил бы выдачу до Краснодара.
  areaServed: { '@type': 'Country', name: 'Россия' },
  knowsLanguage: 'ru-RU',
}

/** Сам сайт. Связывает страницы с организацией-издателем; поиска по сайту нет, поэтому без SearchAction. */
export const webSiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${ORIGIN}/#website`,
  url: ORIGIN,
  name: site.brand,
  inLanguage: 'ru-RU',
  publisher: { '@id': `${ORIGIN}/#organization` },
}

/** Услуга — то, что студия продаёт. Срок и офферы берутся из content/site.ts, чтобы не разойтись с текстом. */
export const serviceLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${ORIGIN}/#service`,
  serviceType: 'Разработка интернет-магазинов под ключ',
  name: 'Разработка интернет-магазина под ключ',
  description: `Индивидуальная разработка интернет-магазина на собственной платформе: дизайн, админка, интеграции с 1С, CRM и службами доставки. Средний срок запуска — ${site.launchTerm}.`,
  provider: { '@id': `${ORIGIN}/#organization` },
  areaServed: { '@type': 'Country', name: 'Россия' },
  url: ORIGIN,
}

/**
 * Блок вопросов с главной. Попадает в разметку только то, что на странице уже отвечено: вопрос с
 * незаполненной заглушкой (сейчас это «Сколько стоит интернет-магазин?» с «[цена]») пропускается —
 * выводить «[цена]» в сниппет поиска хуже, чем не выводить вопрос вовсе. Как только цену впишут в
 * content/faq.ts и уберут поле placeholder, вопрос попадёт в разметку сам.
 */
export const faqPageLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${ORIGIN}/#faq`,
  mainEntity: faq
    .filter((item) => !item.placeholder)
    .map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
}

/** Хлебные крошки для внутренних страниц: показывают поисковику место страницы в структуре сайта. */
export function breadcrumbsLd(page: { name: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: ORIGIN },
      { '@type': 'ListItem', position: 2, name: page.name, item: `${ORIGIN}${page.path}` },
    ],
  }
}
