// Шрифты сайта из полных исходников этой папки (решение заказчика 29.09.2026: заголовки Martian Grotesk,
// текст Onest, подписи «Сетки макета» и выноска первого экрана — Martian Mono).
//
// Martian Grotesk и Martian Mono — статичные инстансы: оси wdth и wght закреплены под те сочетания, что
// есть в CSS (h1–h2 — ширина 115 и вес 650, h3–h4 — 100 и 600, моно — 100 и 400). Один инстанс ≈ 10 КБ
// против 116 КБ вариативного файла. Onest остаётся вариативным по wght 400–700 (текст — 4 начертания).
// Символы: ASCII, русский алфавит, знаки из PUNCT; layout-фичи — только нужные набору (кернинг, лигатуры,
// диакритика; у Onest ещё цифры). Новый символ, вес или ширина — добавить сюда и перезапустить:
//   cd assets/source/fonts && npm i --no-save subset-font && node subset.mjs   (потом удалить node_modules)
// Ширина h1–h2 = 115: «ЗелёнойКоробкой» (h2) влезает в 390 и 320 px, «Интернет-» (h1) — в колонку на 1024 px.
import subsetFont from 'subset-font'
import { readFileSync, writeFileSync } from 'node:fs'

const chars = (ranges) =>
  ranges.map(([a, b = a]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('')).join('')

const ASCII = [[0x20, 0x7e]]
const RU = [[0x410, 0x44f], [0x401], [0x451]]
// неразрывный пробел, ©, « », мягкий перенос, °, ·, ×, дефисы, тире, кавычки, •, …, ‹ ›, WORD JOINER (typograf), №, ₽, −
const PUNCT = [[0xa0], [0xa9], [0xab], [0xad], [0xb0], [0xb7], [0xbb], [0xd7], [0x2010, 0x2011], [0x2013, 0x2014],
  [0x2018, 0x201a], [0x201c, 0x201e], [0x2022], [0x2026], [0x2039, 0x203a], [0x2060], [0x2116], [0x20bd], [0x2212]]
const TEXT = chars([...ASCII, ...RU, ...PUNCT])
const FEATURES = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'rlig']

const SITE = new URL('../../../site/src/app/fonts/', import.meta.url)
const OG = new URL('../../../site/src/app/og/', import.meta.url)

const jobs = [
  // [исходник, файл, папка, символы, оси, фичи, формат]
  ['Onest-var.woff2', 'Onest-var.woff2', SITE, TEXT + '→', { wght: { min: 400, max: 700 } }, [...FEATURES, 'tnum', 'pnum', 'lnum']],
  ['MartianGrotesk-VF.woff2', 'MartianGrotesk-wdth115-wght650.woff2', SITE, TEXT, { wdth: 115, wght: 650 }, FEATURES],
  ['MartianGrotesk-VF.woff2', 'MartianGrotesk-wdth100-wght600.woff2', SITE, TEXT, { wdth: 100, wght: 600 }, FEATURES],
  ['MartianMono-VF.woff2', 'MartianMono-wdth100-wght400.woff2', SITE, TEXT, { wdth: 100, wght: 400 }, FEATURES],
  // OG-картинка: ImageResponse читает только TTF/OTF без осей
  ['MartianGrotesk-VF.woff2', 'MartianGrotesk-wdth115-wght650.ttf', OG, TEXT, { wdth: 115, wght: 650 }, FEATURES, 'sfnt'],
  ['MartianMono-VF.woff2', 'MartianMono-wdth100-wght400.ttf', OG, chars([...ASCII, [0xb7], [0xd7]]), { wdth: 100, wght: 400 }, FEATURES, 'sfnt'],
  ['Onest-var.woff2', 'Onest-400.ttf', OG, TEXT, { wght: 400 }, FEATURES, 'sfnt'],
]

for (const [src, file, dir, text, variationAxes, keepFeatures, targetFormat = 'woff2'] of jobs) {
  const input = readFileSync(new URL(src, import.meta.url))
  const out = await subsetFont(input, text, { targetFormat, variationAxes, keepFeatures })
  writeFileSync(new URL(file, dir), out)
  console.log(file.padEnd(40), input.length, '->', out.length)
}
