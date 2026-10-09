import type { MetadataRoute } from 'next'

// Карта сайта. Дат правок у страниц нет (контент лежит в коде и меняется вместе с выкаткой), поэтому
// lastModified — дата сборки: она честно отражает момент, когда страницы в последний раз могли измениться.
// priority — вес страницы внутри сайта (не влияет на позицию в выдаче, но подсказывает обход):
// главная — точка входа, «О нас» и «Партнёрам» — продающие страницы, политика — служебная.
const BUILT_AT = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://greenboxweb.ru', lastModified: BUILT_AT, changeFrequency: 'weekly', priority: 1 },
    { url: 'https://greenboxweb.ru/about', lastModified: BUILT_AT, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://greenboxweb.ru/partner', lastModified: BUILT_AT, changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://greenboxweb.ru/privacy', lastModified: BUILT_AT, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
