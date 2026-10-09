'use client'

import { useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'

// Тему ставит скрипт в layout.tsx до отрисовки: html[data-theme] из localStorage.theme или системы.
// Положение ползунка и иконка — чистый CSS от темы (без мигания при гидрации), здесь только
// состояние для скринридера и само переключение. Разметку внутри кнопки отдаёт сервер (ThemeToggle).

const root = () => document.documentElement

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(root(), { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

const isDark = () => root().dataset.theme === 'dark'

function toggle(event: MouseEvent<HTMLButtonElement>) {
  const next = isDark() ? 'light' : 'dark'
  const apply = () => {
    root().dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Приватный режим без хранилища: тема сменится до перезагрузки.
    }
  }

  // Без View Transitions (Firefox на сегодня) и при reduced-motion — смена мгновенная.
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply()
    return
  }

  // Точка, из которой расходится круг, — место нажатия. При вызове с клавиатуры (Enter/Space)
  // координат у события нет и приходит 0, поэтому берём центр самой кнопки, иначе круг
  // поехал бы из левого верхнего угла экрана.
  const button = event.currentTarget.getBoundingClientRect()
  const x = event.clientX || button.left + button.width / 2
  const y = event.clientY || button.top + button.height / 2
  // Радиус до самого дальнего угла окна — чтобы круг накрыл экран целиком, а не оставил края.
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  const transition = document.startViewTransition(apply)
  transition.ready
    .then(() => {
      // Анимируем снимок НОВОЙ темы: он лежит поверх старой и проявляется растущим кругом.
      // Кроссфейд обоих снимков при этом выключен в globals.css — иначе поверх круга шёл бы
      // ещё и переход прозрачности, и граница круга размывалась бы.
      root().animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    // Переход могли прервать (быстрый повторный клик, уход со страницы): это не ошибка,
    // но без перехвата отказ всплыл бы в консоль необработанным.
    .catch(() => {})
}

/** Кнопка-переключатель темы (role="switch", aria-checked). Внешний вид — children от ThemeToggle. */
export function ThemeSwitch({ title, className, children }: { title?: string; className?: string; children: ReactNode }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  return (
    <button type="button" role="switch" aria-checked={dark} onClick={toggle} title={title} className={className}>
      {children}
    </button>
  )
}
