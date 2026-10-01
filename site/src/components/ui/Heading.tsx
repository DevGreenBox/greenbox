import type { ComponentProps } from 'react'
import { cx } from '@/lib/cx'

type Level = 'h1' | 'h2' | 'h3' | 'h4'

const sizes: Record<Level, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
}

/**
 * Для h1 с брендом одним словом («ЗелёнойКоробки» ≈ 10.4 кегля в широком Martian): кегль не больше ширины
 * колонки / 10.6 — на телефоне слово не рвётся посередине. style={brandFit}.
 */
export const brandFit = { fontSize: 'min(var(--text-h1), (100vw - 2 * var(--gutter)) / 10.6)' } as const

type HeadingProps = ComponentProps<'h2'> & {
  /** Тег. По умолчанию h2. */
  as?: Level | 'p'
  /** Размер шкалы, если он не совпадает с тегом (h2 размером h3 и т. п.). */
  size?: Level
  /** Часть заголовка зелёным, как «Зелёная» в логотипе: подстрока текста (children — строка). */
  accent?: string
}

/** Делит строку на «до · акцент · после». Пробелы и неразрывные пробелы (typograf) считаются одним и тем же. */
function withAccent(text: string, part: string) {
  const plain = (s: string) => s.replace(/\u00A0/g, ' ')
  const i = plain(text).indexOf(plain(part))
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <span className="text-accent-display">{text.slice(i, i + part.length)}</span>
      {text.slice(i + part.length)}
    </>
  )
}

/**
 * Заголовок: Martian Grotesk, кегль, трекинг и вес из шкалы, text-wrap: balance. h1–h2 — широкий
 * инстанс (font-wide: ширина 115, вес 650), h3–h4 — обычной ширины (font-display, 600).
 * Второй тон — зелёная часть (accent), как в логотипе «Зелёная» + «Коробка» (заказчик 30.09.2026):
 * --accent-display, только крупный текст (≥ 3:1 к фону сцены).
 */
export function Heading({ as: Tag = 'h2', size, accent, className, children, ...rest }: HeadingProps) {
  const level = size ?? (Tag === 'p' ? 'h3' : Tag)
  const family = level === 'h1' || level === 'h2' ? 'font-wide' : 'font-display'
  return (
    <Tag className={cx(family, sizes[level], className)} {...rest}>
      {accent && typeof children === 'string' ? withAccent(children, accent) : children}
    </Tag>
  )
}
