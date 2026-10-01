import type { ComponentProps, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from './Icon'

type ChipProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  /** radio — один вариант из группы (метка-круг), checkbox — несколько (метка-квадрат). */
  type?: 'radio' | 'checkbox'
  children: ReactNode
}

/**
 * Вариант ответа квиза: настоящий radio/checkbox в виде пилюли. Группу оборачивайте в
 * <fieldset> с <legend> — вопрос шага и есть доступное имя группы.
 */
export function Chip({ type = 'radio', children, className, ...input }: ChipProps) {
  return (
    <label className={cx('chip', className)}>
      <input {...input} type={type} className="chip__input" />
      <span className="chip__body">
        <span className="chip__mark" aria-hidden="true">
          <Icon name="check" />
        </span>
        {children}
      </span>
    </label>
  )
}
