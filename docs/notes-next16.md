# Next.js 16.2.10: что важно для этого сайта

Выжимка из документации пакета `node_modules/next/dist/docs/01-app/` (версия 16.2.10, 29.09.2026). По AGENTS.md перед кодом сверяйтесь с оригиналом. Пути даны относительно `01-app/`.

## Проект и конфиг
- **Минимальные версии:** Node ≥ 20.9, TypeScript ≥ 5.1. Браузеры: Chrome/Edge/Firefox 111+, Safari 16.4+.
- **Turbopack по умолчанию** в `dev` и `build`. Свой `webpack()` в конфиге роняет сборку. Ключ `turbopack` теперь на верхнем уровне.
- **`next lint` удалён.** `build` больше не линтит. ESLint настраивается через flat config (`eslint.config.mjs`), скрипт `"lint": "eslint"`.
- **`next.config.ts`:**
  ```ts
  import type { NextConfig } from 'next'
  export default { output: 'standalone' } satisfies NextConfig
  ```
- **`output: 'standalone'`** не копирует `public` и `.next/static`: `cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/`. Запуск: `node .next/standalone/server.js` с `PORT` и `HOSTNAME`.
- **Удалено:** `serverRuntimeConfig`, `publicRuntimeConfig`, ключ `eslint`, AMP. Устарело: `images.domains` (используйте `remotePatterns`).
- `next dev` пишет в `.next/dev`. Два dev- или build-процесса одного проекта одновременно не запустить.

## Шрифты — `02-components/font.md`, `01-getting-started/13-fonts.md`
- `import localFont from 'next/font/local'`, вызывать на уровне модуля. Путь в `src` считается от файла, где вызвано.
- Опции: `src` (строка или `{path, weight, style}[]`), `weight: '100 900'` для вариативного, `display` (по умолчанию `swap`), `preload` (по умолчанию `true`), `fallback`, `adjustFontFallback` (по умолчанию `'Arial'`), `variable`, `declarations`.
- `subsets` и `axes` работают только для Google-шрифтов.
- С Tailwind 4:
  ```tsx
  const onest = localFont({ src: './fonts/Onest.woff2', variable: '--font-onest', weight: '100 900' })
  // <html className={onest.variable}>
  ```
  ```css
  @theme inline { --font-sans: var(--font-onest); }
  ```
- Шрифт из корневого layout предзагружается на всех маршрутах.

## Метаданные — `03-api-reference/04-functions/generate-metadata.md`, `.../03-file-conventions/01-metadata/`
- `export const metadata: Metadata` работает только в серверных layout и page.
- `metadataBase: new URL('https://greenboxweb.ru')` ставится в корневом layout. Без него относительные URL дают ошибку сборки.
- **`viewport` отдельным экспортом:** `export const viewport: Viewport = { themeColor: [...], colorScheme }`. `themeColor` и `colorScheme` внутри `metadata` устарели.
- `title: { default, template }`, `alternates: { canonical: '/' }`, `openGraph`, `verification: { yandex: '35ded4ecd9b4aad3' }`.
- **Файлы-конвенции:**
  - `app/icon.(png|svg)`, `app/apple-icon.png`, `app/favicon.ico`;
  - `app/opengraph-image.(png|jpg|tsx)` + `opengraph-image.alt.txt`;
  - `app/robots.ts` (`MetadataRoute.Robots`), `app/sitemap.ts` (`MetadataRoute.Sitemap`).
- **`opengraph-image.tsx`:** `ImageResponse` из `next/og`, размер 1200×630. CSS только на flexbox (grid нет). Шрифт читается через `readFile(join(process.cwd(), ...))`.
- **JSON-LD** — нативный `<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(x).replace(/</g,'\\u003c')}} />` (не `next/script`).
- Файловые метаданные важнее объекта `metadata`. Слияние неглубокое: дочерний `openGraph` целиком заменяет родительский.

## Route handler для заявок — `03-api-reference/03-file-conventions/route.md`, `02-guides/backend-for-frontend.md`
- `app/api/lead/route.ts`:
  ```ts
  export async function POST(request: Request) {
    return Response.json({ ok: true }, { status: 200 })
  }
  ```
- Тело читается через `await request.formData()`, `request.json()` или `request.text()`. Значения FormData — строки.
- Runtime по умолчанию `nodejs`. **POST никогда не кэшируется**, настройка не нужна.
- Env без `NEXT_PUBLIC_` видны только серверу и читаются при каждом запросе. Секреты держите в модуле с `import 'server-only'` (пакет по желанию).
- Встроенного rate limit нет, делайте свой. `NextRequest.ip` удалён: IP берите из `x-forwarded-for` за прокси.
- `route.ts` и `page.tsx` не могут лежать в одном сегменте.

## Рендеринг и кэш
- Без флагов действует прежняя модель, лендинг без динамики пререндерится.
- `cacheComponents` **не включаем**: он не нужен и меняет правила (обязательный `<Suspense>` для данных времени запроса).
- Синхронный доступ к запросу удалён: `await cookies()`, `await headers()`, `await params`, `await searchParams`.

## Прокси, редиректы, заголовки
- `middleware.ts` переименован в `proxy.ts` (только Node). Для простых случаев документация советует `redirects()` в конфиге.
- `async redirects()` → `[{ source, destination, permanent: true }]`, отдаёт 308. `async headers()` → `[{ source: '/:path*', headers: [{ key, value }] }]`.

## Изображения — `03-api-reference/02-components/image.md`
- **`priority` устарел.** Вместо него `preload`, но документация советует `loading="eager"` или `fetchPriority="high"` (не вместе с `preload`).
- `images.qualities` по умолчанию `[75]` и обязателен с 16-й версии. Другие значения `quality` приводятся к ближайшему из списка.
- `images.formats` по умолчанию `['image/webp']`. Для AVIF: `['image/avif','image/webp']`.
- `sizes` обязателен при `fill` и адаптивных картинках. `imageSizes` больше не содержит 16.
- Локальный `src` с query-строкой требует `images.localPatterns` с `search`.

## Клиент, CSS, React 19.2
- `'use client'` ставится в начале файла.
- **Tailwind 4:** `@tailwindcss/postcss` в `postcss.config.mjs`, в `globals.css` `@import 'tailwindcss';`, конфиг-файла нет.
- CSS nesting работает через Lightning CSS. Порядок CSS = порядок импортов.
- `scroll-behavior: smooth` на `html` Next больше не отключает при навигации. Чтобы вернуть мгновенный скролл на смене маршрута, нужен `<html data-scroll-behavior="smooth">`.
- `ViewTransition` из `react` требует `experimental.viewTransition` — не используем.

## Ошибки и 404
- `app/not-found.tsx` — серверный компонент без пропсов. Next сам ставит `noindex`.
- `error.tsx` требует `'use client'` и получает `{ error, unstable_retry }` (с 16.2, лучше `reset`).
- `global-error.tsx` рендерит свои `<html>` и `<body>`.
