import { cx } from '@/lib/cx'
import { Icon } from './Icon'
import { ThemeSwitch } from './ThemeSwitch'

/**
 * Переключатель «Тёмная тема» (role="switch"). В шапке подпись скрыта визуально (showLabel=false),
 * в мобильном меню видна. Без JS не показывается: тема тогда берётся из системы.
 * Серверный: дорожка, иконки и подпись — здесь, поведение — ThemeSwitch (набор иконок в клиентский JS не идёт).
 */
export function ThemeToggle({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  return (
    <ThemeSwitch title={showLabel ? undefined : 'Тёмная тема'} className={cx('theme-toggle', className)}>
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__knob">
          <Icon name="sun" className="theme-toggle__sun" />
          <Icon name="moon" className="theme-toggle__moon" />
        </span>
      </span>
      <span className={showLabel ? undefined : 'sr-only'}>Тёмная тема</span>
    </ThemeSwitch>
  )
}
