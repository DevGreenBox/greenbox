import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'text'

type Common = {
  /** primary — зелёная пилюля, secondary — поверхность с рамкой, text — ссылка-действие. */
  variant?: Variant
  /** md — 56 px, sm — 44 px (шапка, плотные места). У text высота 44 px всегда. */
  size?: 'md' | 'sm'
  /** Иконка после подписи. На наведении стрелки сдвигаются по направлению. */
  icon?: IconName
  /** Иконка перед подписью: «← Назад». */
  iconStart?: IconName
}

const classes = (variant: Variant, size: 'md' | 'sm', className?: string) =>
  cx('btn', `btn--${variant}`, size === 'sm' && variant !== 'text' && 'btn--sm', className)

const Label = ({ children }: { children: ReactNode }) => <span className="btn__label">{children}</span>

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="icon btn__spinner" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

type ButtonProps = ComponentProps<'button'> &
  Common & {
    /** Идёт отправка: спиннер вместо иконки, aria-busy и aria-disabled, фокус остаётся на кнопке.
     *  Мышь кнопку не нажмёт, но повторную отправку с клавиатуры форма отсекает сама по своему статусу. */
    loading?: boolean
  }

/** Кнопка-действие (<button>). Для перехода по ссылке — ButtonLink. */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconStart,
  loading,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classes(variant, size, className)}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest['aria-disabled'] || undefined}
      {...rest}
    >
      {iconStart && <Icon name={iconStart} className="btn__icon" />}
      <Label>{children}</Label>
      {loading ? <Spinner /> : icon && <Icon name={icon} className="btn__icon" />}
    </button>
  )
}

type ButtonLinkProps = ComponentProps<'a'> &
  Common & {
    /** Внешний сайт: новая вкладка, rel="noopener", стрелка ↗ и пометка для скринридера. */
    external?: boolean
  }

/** Ссылка в виде кнопки (<a>): якоря страницы, внешние сайты. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  iconStart,
  external,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const iconName = icon ?? (external ? 'arrow-up-right' : undefined)
  return (
    <a className={classes(variant, size, className)} {...(external && { target: '_blank', rel: 'noopener' })} {...rest}>
      {iconStart && <Icon name={iconStart} className="btn__icon" />}
      <Label>{children}</Label>
      {external && <span className="sr-only"> (откроется в новой вкладке)</span>}
      {iconName && <Icon name={iconName} className="btn__icon" />}
    </a>
  )
}
