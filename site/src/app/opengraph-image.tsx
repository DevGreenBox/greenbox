import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { logoPaths } from '@/components/brand/Logo'
import { copy } from '@/content/copy'
import { site } from '@/content/site'

// Превью ссылки (og:image и twitter:image) для всех страниц: тёмная сцена первого экрана, логотип и
// «Сетка макета» линиями — 12 колонок в полях 100 px, контуры <header> и <section class="hero">,
// размерная линия поля. Картинка собирается при сборке (статичная).
// Шрифты: ImageResponse не читает woff2 и вариативные файлы, поэтому в og/ лежат статичные TTF-срезы
// тех же гарнитур, что на сайте: Martian Grotesk (ширина 115, вес 650 — как h1), Onest 400 — латиница и
// кириллица; Martian Mono 400 — ASCII. Делает их assets/source/fonts/subset.mjs, лицензии — fonts/OFL-*.txt.

export const alt = `${site.brand} — ${copy.hero.title.toLowerCase()}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Цвета тёмной сцены (docs/03-design-system.md): фон, текст, текст 2, подписи «чертежа», линии, акцент.
// Размерная линия нейтральная, как на сайте: циан только в градиенте слова «Интернет-магазины».
const C = {
  bg: '#0A0A14',
  text: '#E8E8F0',
  text2: '#A0A0B8',
  label: '#8A8AA2',
  line: 'rgba(232, 232, 240, 0.07)',
  stroke: 'rgba(232, 232, 240, 0.14)',
  accent: '#00E676',
  pick: 'rgba(0, 230, 118, 0.8)',
  dim: 'rgba(160, 160, 184, 0.4)',
}

const GUTTER = 100
const COLS = 12
const GAP = 24
const COL = (size.width - 2 * GUTTER - (COLS - 1) * GAP) / COLS

const font = (file: string) => readFile(join(process.cwd(), 'src/app/og', file))

const Label = ({ children, style }: { children: string; style: React.CSSProperties }) => (
  <div
    style={{
      position: 'absolute',
      display: 'flex',
      padding: '0 8px 0 0',
      background: C.bg,
      color: C.label,
      fontFamily: 'Mono',
      fontSize: 15,
      lineHeight: '18px',
      ...style,
    }}
  >
    {children}
  </div>
)

export default async function Image() {
  const [martian, onest, mono] = await Promise.all([
    font('MartianGrotesk-wdth115-wght650.ttf'),
    font('Onest-400.ttf'),
    font('MartianMono-wdth100-wght400.ttf'),
  ])
  const [word, ...rest] = copy.hero.title.split(' ')

  return new ImageResponse(
    (
      <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%', background: C.bg }}>
        {/* Сетка: 12 колонок в полях сайта */}
        {Array.from({ length: COLS }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: GUTTER + i * (COL + GAP),
              width: COL,
              borderLeft: `1px solid ${C.line}`,
              borderRight: `1px solid ${C.line}`,
            }}
          />
        ))}

        {/* <header> с логотипом */}
        <div
          style={{
            position: 'absolute',
            top: 44,
            left: GUTTER,
            right: GUTTER,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            border: `1px solid ${C.stroke}`,
            background: C.bg,
          }}
        >
          <svg width={330} height={(330 * 1992) / 16984} viewBox={logoPaths.viewBox}>
            <path fill={C.accent} d={logoPaths.green} />
            <path fill={C.text} d={logoPaths.word} />
          </svg>
        </div>
        <Label style={{ top: 22, left: GUTTER }}>{'<header>'}</Label>

        {/* <section class="hero"> с выделением инспектора */}
        <div
          style={{
            position: 'absolute',
            top: 172,
            left: GUTTER,
            right: GUTTER,
            bottom: 56,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 48px',
            border: `1px solid ${C.pick}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Martian Grotesk',
              fontSize: 76,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: C.text,
            }}
          >
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #00C853, #00E5FF)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {word}
            </span>
            <span>{rest.join(' ')}</span>
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontFamily: 'Onest', fontSize: 30, lineHeight: 1.35, color: C.text2 }}>
            {`Без шаблонов и конструкторов, на своей платформе. Обычно запускаем за ${site.launchTerm}.`}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 146, left: GUTTER, display: 'flex', background: C.bg, fontFamily: 'Mono', fontSize: 15, lineHeight: '18px', padding: '0 8px 0 0' }}>
          <span style={{ color: C.accent }}>{'<section class="hero">'}</span>
          <span style={{ marginLeft: 10, color: 'rgba(0, 230, 118, 0.6)' }}>1000 × 402</span>
        </div>
        {/* маркеры по углам выделения */}
        {[
          { top: 169, left: GUTTER - 3 },
          { top: 169, right: GUTTER - 3 },
          { bottom: 53, left: GUTTER - 3 },
          { bottom: 53, right: GUTTER - 3 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{ position: 'absolute', width: 7, height: 7, border: `1px solid ${C.pick}`, background: C.bg, ...pos }}
          />
        ))}

        {/* Размерная линия поля: 100 px */}
        <div style={{ position: 'absolute', top: 400, left: 0, width: GUTTER, height: 1, background: C.dim }} />
        <div style={{ position: 'absolute', top: 396, left: 0, width: 1, height: 9, background: C.dim }} />
        <div style={{ position: 'absolute', top: 396, left: GUTTER - 1, width: 1, height: 9, background: C.dim }} />
        <div
          style={{
            position: 'absolute',
            top: 376,
            left: 0,
            width: GUTTER,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Mono',
            fontSize: 15,
            color: C.label,
          }}
        >
          100
        </div>

        <Label style={{ bottom: 20, right: GUTTER, padding: '0 0 0 8px' }}>{'greenboxweb.ru'}</Label>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Martian Grotesk', data: martian, weight: 600, style: 'normal' },
        { name: 'Onest', data: onest, weight: 400, style: 'normal' },
        { name: 'Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  )
}
