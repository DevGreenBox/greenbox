import type { ComponentProps } from 'react'
import { cx } from '@/lib/cx'

/**
 * Сцена секции. light — #FAFBFC (тёмная тема #12121F), light-2 — #F0F2F5 (#1A1A2E),
 * dark — #0A0A14 в обеих темах.
 */
export type Scene = 'light' | 'light-2' | 'dark'

/** Поля по бокам: 20 / 40 / 64 / 100 px, контент тянется между ними. */
export function Container({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('wrap', className)} {...rest} />
}

type SectionProps = ComponentProps<'section'> & {
  id: string
  scene: Scene
  /** id заголовка для aria-labelledby; по умолчанию `${id}-title`. */
  labelledBy?: string
  /** Без Container: содержимое во всю ширину, поля ставите сами (фон-картинка, горизонтальная лента). */
  bleed?: boolean
}

/** Секция главной: своя сцена, вертикальный ритм --section-y, контейнер с полями. */
export function Section({ id, scene, labelledBy, bleed, className, children, ...rest }: SectionProps) {
  return (
    <section
      id={id}
      data-scene={scene}
      aria-labelledby={labelledBy ?? `${id}-title`}
      className={cx('section', className)}
      {...rest}
    >
      {bleed ? children : <div className="wrap">{children}</div>}
    </section>
  )
}
