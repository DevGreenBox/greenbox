import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

/**
 * Честная заглушка для данных, которых пока нет: [задача], [результат], [цена].
 * Пунктир и второй цвет текста — видна всем, включая скринридер, и не похожа на ошибку.
 * По умолчанию строчная (внутри фразы), block — ячейка во всю ширину.
 */
export function Placeholder({
  children,
  block,
  className,
}: {
  children: ReactNode
  block?: boolean
  className?: string
}) {
  return <span className={cx('placeholder', block && 'placeholder--block', className)}>{children}</span>
}
