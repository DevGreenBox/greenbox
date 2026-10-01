import localFont from 'next/font/local'

// Шрифты сайта (решение заказчика 29.09.2026): заголовки Martian Grotesk, текст Onest, подписи
// «Сетки макета» и выноска первого экрана — Martian Mono. Файлы — срезы по символам (ASCII, русский
// алфавит, знаки набора), Martian — статичные инстансы под сочетания ширины и веса из CSS: всего 55 КБ
// против прежних 101 (Unbounded + Onest + JetBrains Mono). Скрипт среза и полные исходники —
// assets/source/fonts/, лицензии OFL 1.1 — рядом с файлами (app/fonts/OFL-*.txt).
// Классы .variable висят на <html> (layout.tsx), семейства в утилиты отдаёт @theme в globals.css.
//
// Предзагрузка — только то, что нужно первому экрану: Onest (подзаголовок, кнопки) и широкий Martian
// (h1). Остальное грузится, когда понадобится; martian и martianMono с JS включаются только после
// первого кадра (layout.tsx, lateFontsCss). display: 'swap' и запасной Arial с size-adjust, который
// Next считает по файлу: текст виден сразу системным шрифтом и почти не прыгает при подмене.

/** Текст: Onest, вариативный по wght 400–700. */
export const onest = localFont({
  src: '../app/fonts/Onest-var.woff2',
  variable: '--font-onest',
  weight: '400 700',
  display: 'swap',
  fallback: ['sans-serif'],
})

/** h1–h2: Martian Grotesk, ширина 115, вес 650. Отдельное семейство — свои метрики запасного шрифта. */
export const martianWide = localFont({
  src: '../app/fonts/MartianGrotesk-wdth115-wght650.woff2',
  variable: '--font-martian-wide',
  weight: '650',
  display: 'swap',
  fallback: ['sans-serif'],
})

/** h3–h4 и прочий font-display: Martian Grotesk, обычная ширина, вес 600. Первому экрану не нужен. */
export const martian = localFont({
  src: '../app/fonts/MartianGrotesk-wdth100-wght600.woff2',
  variable: '--font-martian',
  weight: '600',
  display: 'swap',
  preload: false,
  fallback: ['sans-serif'],
})

/**
 * Моноширинные подписи: Martian Mono, ширина 100, вес 400. Слой «Сетки макета» и выноска первого экрана
 * включают его только после гидрации (data-live): файл, найденный в CSS до первой отрисовки, браузер
 * качал бы наравне со шрифтами заголовка и задерживал LCP. Запасной — системный моноширинный.
 */
export const martianMono = localFont({
  src: '../app/fonts/MartianMono-wdth100-wght400.woff2',
  variable: '--font-martian-mono',
  weight: '400',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
})
