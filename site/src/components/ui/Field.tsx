import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from './Icon'

type Base = {
  label: ReactNode
  /** Подсказка под меткой (формат ввода). */
  hint?: ReactNode
  /** Текст ошибки: поле получает aria-invalid, сообщение связано через aria-describedby. */
  error?: ReactNode
  className?: string
}

type InputProps = Base & { multiline?: false } & Omit<ComponentProps<'input'>, keyof Base>
type TextareaProps = Base & { multiline: true } & Omit<ComponentProps<'textarea'>, keyof Base>

/**
 * Поле формы: метка, подсказка, поле (input или textarea при multiline), ошибка.
 * id создаётся сам (useId), обязательность — атрибутом required (звёздочка только визуальная).
 */
export function Field(props: InputProps | TextareaProps) {
  const autoId = useId()
  const { label, hint, error, className, multiline, ...control } = props
  const id = control.id ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = cx(control['aria-describedby'], hintId, errorId) || undefined
  const shared = {
    id,
    className: 'field__control',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }

  return (
    <div className={cx('field', className)}>
      <label htmlFor={id} className="field__label">
        {label}
        {control.required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea {...(control as ComponentProps<'textarea'>)} {...shared} />
      ) : (
        <input {...(control as ComponentProps<'input'>)} {...shared} />
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

/** Сообщение об ошибке с иконкой: текстом, а не только цветом. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="field__error">
      <Icon name="alert" />
      <span>{children}</span>
    </p>
  )
}
