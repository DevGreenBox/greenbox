import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { FieldError } from './Field'
import { Icon } from './Icon'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  /** Подпись; может содержать ссылку: Согласен на обработку <a href="/privacy">персональных данных</a>. */
  children: ReactNode
  error?: ReactNode
}

/** Нативный чекбокс с подписью (согласие на обработку данных и т. п.). */
export function Checkbox({ children, error, className, id: idProp, ...input }: CheckboxProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cx('check-field', className)}>
      <label className="check" htmlFor={id}>
        <span className="check__box">
          <input
            {...input}
            id={id}
            type="checkbox"
            className="check__input"
            aria-invalid={error ? true : undefined}
            aria-describedby={cx(input['aria-describedby'], errorId) || undefined}
          />
          <Icon name="check" className="check__mark" />
        </span>
        <span className="check__label">{children}</span>
      </label>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
