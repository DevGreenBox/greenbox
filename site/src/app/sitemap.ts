import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/about', '/partner', '/privacy'].map((path) => ({ url: `https://greenboxweb.ru${path}` }))
}
