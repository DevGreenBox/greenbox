'use client'

import { useSyncExternalStore } from 'react'
import { Button } from './Button'

// Уведомление о файлах cookie. Показывается один раз: выбор посетителя сохраняется в браузере.
//
// Почему с выбором, а не просто «ОК»: согласие должно быть добровольным и отзывным, а значит отказ
// обязан быть таким же доступным, как согласие. Необходимые cookie (тема оформления, этот самый выбор)
// работают всегда — без них сайт не работает, и согласия на них не требуется; всё остальное
// (аналитика, когда её подключат) включается только после «Принять».
//
// Решение читает CONSENT_KEY: аналитику подключать строго при значении 'all'. Пока счётчиков на сайте
// нет вовсе, поэтому отказ ничего не отключает — но согласие уже собрано и его видно в localStorage.

export const CONSENT_KEY = 'cookie-consent'
export type Consent = 'all' | 'necessary'

/** Текущий выбор или null, если посетитель ещё не отвечал. Хранилище может быть недоступно. */
function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'all' || value === 'necessary' ? value : null
  } catch {
    return null
  }
}

/** Подписка на собственный выбор: localStorage событий в своей вкладке не шлёт, зовём слушателей сами. */
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

export function CookieNotice() {
  // useSyncExternalStore, а не состояние в эффекте: на сервере хранилища нет, и серверный снимок
  // говорит «решение есть» — уведомления нет в разметке, расходиться с ней при гидрации нечему.
  // Настоящее значение читается уже в браузере.
  const consent = useSyncExternalStore(subscribe, readConsent, () => 'necessary' as Consent | null)

  function decide(value: Consent) {
    try {
      localStorage.setItem(CONSENT_KEY, value)
    } catch {
      // Приватный режим без хранилища: уведомление вернётся при следующем заходе.
    }
    listeners.forEach((notify) => notify())
  }

  if (consent) return null

  return (
    <div className="cookie-notice" role="region" aria-label="Файлы cookie">
      <div className="cookie-notice__body">
        <p className="cookie-notice__text">
          Сайт использует файлы cookie. Необходимые — чтобы запомнить тему оформления и этот выбор.
          Аналитические — только с вашего согласия. Подробно — в{' '}
          <a href="/privacy">политике конфиденциальности</a>.
        </p>
        <div className="cookie-notice__actions">
          <Button type="button" size="sm" onClick={() => decide('all')}>
            Принять все
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => decide('necessary')}>
            Только необходимые
          </Button>
        </div>
      </div>
    </div>
  )
}
