import type { StaticImageData } from 'next/image'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { imageProps } from '@/lib/image'
import { GridBackdrop } from './GridBackdrop'
import s from './Hero.module.css'

/**
 * Фон первого экрана. Выбирает заказчик во втором раунде (docs/PLAN.md, этап 4):
 * - 'none' — без фона, тёмная сцена #0A0A14;
 * - image — фото или рендер на весь экран (srcset next/image без клиентского компонента, lib/image.ts),
 *   грузится первым (fetchPriority high); alt всегда пустой — фон декоративный;
 * - layer — фон, нарисованный в коде: любой узел, растянутый на слот (position: absolute; inset: 0).
 *   Свою маску под текстом слой задаёт сам (как «Сетка макета» — GridBackdrop).
 * Поверх image — вуаль #0A0A14: плотнее слева под текстом, светлее справа (Hero.module.css).
 * Слот всегда декоративный: aria-hidden, pointer-events: none.
 */
export type Backdrop =
  | 'none'
  | { type: 'image'; src: string | StaticImageData; alt: '' }
  | { type: 'layer'; node: ReactNode }

/** Текущий фон — «Сетка макета» (выбор заказчика, раунд 2). Фото: `{ type: 'image', src: '/media/hero/bg.jpg', alt: '' }`. */
export const heroBackdrop: Backdrop = { type: 'layer', node: <GridBackdrop /> }

export function HeroBackdrop({ backdrop = heroBackdrop }: { backdrop?: Backdrop }) {
  if (backdrop === 'none') return null

  return (
    <div className={cx(s.backdrop, backdrop.type === 'image' && s.veil)} aria-hidden="true">
      {backdrop.type === 'image' ? <Photo src={backdrop.src} /> : backdrop.node}
    </div>
  )
}

function Photo({ src }: { src: string | StaticImageData }) {
  const { src: url, ...props } = imageProps({ src, alt: '', fill: true, sizes: '100vw', loading: 'eager', fetchPriority: 'high' })
  // eslint-disable-next-line @next/next/no-img-element -- props next/image из lib/image.ts
  return <img src={url} {...props} alt="" className={s.backdropImage} />
}
