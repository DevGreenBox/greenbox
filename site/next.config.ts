import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Свой сервер (VPS): standalone — самодостаточная папка с server.js (README). На Vercel сборкой и раздачей
  // занимается платформа, standalone не нужен; VERCEL=1 Vercel задаёт в окружении сборки.
  output: process.env.VERCEL ? undefined : 'standalone',
  poweredByHeader: false,
  // Выше лежит pnpm-workspace.yaml монорепо: без явного корня Next поднимет его до /home/coder/novi,
  // и standalone-сборка окажется во вложенной папке.
  turbopack: { root: __dirname },
  // Dev-сервер смотрят через прокси Coder (<порт>--main--novi--albert.devgreenboxweb.ru):
  // без этого Next блокирует свои dev-ресурсы и страница остаётся без гидратации.
  allowedDevOrigins: ['*.devgreenboxweb.ru'],
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
  },
  async redirects() {
    return [
      { source: '/legal.html', destination: '/privacy', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
      // Партнёрская программа переехала со старой страницы (01.10.2026): ссылки на неё уже разосланы.
      { source: '/partner.html', destination: '/partner', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
