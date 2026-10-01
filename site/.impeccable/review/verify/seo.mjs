// SEO и мета: заголовки ответа, <head> страниц, JSON-LD, robots, sitemap, иконки, редиректы, 404. Без браузера.
import { BASE, save } from './lib.mjs'

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1].toLowerCase(), m[2]]))

function head(html) {
  const h = html.slice(0, html.indexOf('</head>') + 7)
  const metas = [...h.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const links = [...h.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const meta = (k) => metas.filter((m) => m.name === k || m.property === k).map((m) => m.content)
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try {
      const j = JSON.parse(m[1])
      return { valid: true, type: j['@type'], context: j['@context'], keys: Object.keys(j) }
    } catch (e) {
      return { valid: false, error: String(e) }
    }
  })
  return {
    lang: html.match(/<html[^>]*\blang="([^"]*)"/)?.[1] ?? null,
    title: h.match(/<title>([^<]*)<\/title>/)?.[1] ?? null,
    description: meta('description')[0] ?? null,
    robots: meta('robots'),
    canonical: links.filter((l) => l.rel === 'canonical').map((l) => l.href),
    og: Object.fromEntries(metas.filter((m) => m.property?.startsWith('og:')).map((m) => [m.property, m.content])),
    twitter: Object.fromEntries(metas.filter((m) => m.name?.startsWith('twitter:')).map((m) => [m.name, m.content])),
    yandex: meta('yandex-verification'),
    themeColor: metas.filter((m) => m.name === 'theme-color').map((m) => `${m.content}${m.media ? ' ' + m.media : ''}`),
    colorScheme: meta('color-scheme'),
    viewport: meta('viewport'),
    icons: links.filter((l) => /icon/.test(l.rel ?? '')).map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes, type: l.type })),
    manifest: links.filter((l) => l.rel === 'manifest').map((l) => l.href),
    preloads: links.filter((l) => l.rel === 'preload').map((l) => `${l.as}: ${l.href}`),
    jsonLd: ld,
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
    headings: [...html.matchAll(/<h([1-6])\b/gi)].map((m) => +m[1]),
    landmarks: {
      header: (html.match(/<header\b/gi) ?? []).length,
      nav: (html.match(/<nav\b/gi) ?? []).length,
      main: (html.match(/<main\b/gi) ?? []).length,
      footer: (html.match(/<footer\b/gi) ?? []).length,
      section: (html.match(/<section\b/gi) ?? []).length,
      article: (html.match(/<article\b/gi) ?? []).length,
      form: (html.match(/<form\b/gi) ?? []).length,
      fieldset: (html.match(/<fieldset\b/gi) ?? []).length,
    },
    imgsNoAlt: [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => attrs(m[0])).filter((a) => !('alt' in a)).length,
    imgs: [...html.matchAll(/<img\b[^>]*>/gi)].length,
    bytes: html.length,
  }
}

async function get(path, opts = {}) {
  const res = await fetch(BASE + path, { redirect: 'manual', headers: { 'accept-encoding': 'br, gzip', ...(opts.headers ?? {}) } })
  const buf = Buffer.from(await res.arrayBuffer())
  return { status: res.status, headers: Object.fromEntries(res.headers), buf }
}

function png(buf) {
  if (buf.slice(1, 4).toString() !== 'PNG') return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const out = {}
for (const path of ['/', '/privacy', '/lead/sent?from=quiz', '/lead/error?from=contact&field=consent', '/no-such-page', '/ds']) {
  const r = await get(path)
  out[path] = {
    status: r.status,
    headers: Object.fromEntries(Object.entries(r.headers).filter(([k]) => ['content-type', 'content-encoding', 'cache-control', 'x-powered-by', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security', 'content-security-policy', 'x-frame-options', 'vary'].includes(k))),
    head: head(r.buf.toString('utf8')),
  }
}
for (const path of ['/legal.html', '/index.html', '/privacy/', '/robots.txt', '/sitemap.xml', '/favicon.ico', '/icon.png', '/apple-icon.png', '/brand/logo.svg', '/manifest.webmanifest', '/opengraph-image', '/og.png']) {
  const r = await get(path)
  out[path] = {
    status: r.status,
    location: r.headers.location,
    type: r.headers['content-type'],
    cache: r.headers['cache-control'],
    size: r.buf.length,
    png: png(r.buf),
    text: /text|xml/.test(r.headers['content-type'] ?? '') ? r.buf.toString('utf8').slice(0, 600) : undefined,
  }
}
// Куда в итоге ведут редиректы
for (const path of ['/legal.html', '/index.html']) {
  const res = await fetch(BASE + path)
  out[path].final = { url: res.url.replace(BASE, ''), status: res.status }
}
// Статика: кэш и сжатие
const home = out['/']
const html = (await get('/')).buf.toString('utf8')
const css = html.match(/href="(\/_next\/static\/[^"]+\.css)"/)?.[1]
const js = html.match(/src="(\/_next\/static\/[^"]+\.js)"/)?.[1]
for (const p of [css, js].filter(Boolean)) {
  const r = await get(p)
  out[p] = { status: r.status, type: r.headers['content-type'], encoding: r.headers['content-encoding'], cache: r.headers['cache-control'] }
}
save('seo/results.json', out)
console.log(JSON.stringify(out, (k, v) => (k === 'headings' ? v.join(',') : v), 1))
