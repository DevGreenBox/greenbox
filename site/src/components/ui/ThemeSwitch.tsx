'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

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

function toggle() {
  const next = isDark() ? 'light' : 'dark'
  const apply = () => {
    root().dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Приватный режим без хранилища: тема сменится до перезагрузки.
    }
  }
  // Плавная смена всей страницы там, где есть View Transitions; при reduced-motion — мгновенно.
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(apply)
  } else {
    apply()
  }
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
