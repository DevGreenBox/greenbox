'use client'

import { useEffect, useRef } from 'react'

/** Первый такт ждёт, пока в «Товарах» въедет новый товар (вход сцены, Difference.module.css). */
const AFTER_INTRO = 2400
/** Сколько полных кругов по разделам, потом остановка на «Товарах»: не мельтешить, пока читают текст рядом. */
const ROUNDS = 2
/** Сцена «в экране», если видна хотя бы на эту долю. */
const SEEN = 0.6

/**
 * Автопоказ разделов админки «Вы получите платформу»: пока сцена в экране, вкладки переключаются сами —
 * Товары → Заказы → Страницы. Такт задаёт CSS: на выбранной вкладке идёт невидимая полоска-таймер
 * (data-playing на окне), её конец переключает раздел. Наведение ставит таймер на паузу (CSS); нажатие, клавиша или
 * фокус внутри окна отменяют показ — дальше разделы переключает посетитель. Сцена ушла из экрана —
 * показ на паузе. Без reduced-motion; меняется только checked, фокус не трогает. Ничего не рисует.
 */
export function AdminTour() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('[data-admin]')
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const inputs = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
    if (inputs.length < 2) return

    let timer = 0
    let started = false
    let switches = 0
    const actions = ['pointerdown', 'keydown', 'focusin'] as const

    const pause = () => {
      window.clearTimeout(timer)
      delete root.dataset.playing
    }

    // Таймер вкладки кончился (анимация ::after на подписи вкладки) — следующий раздел.
    const next = (event: AnimationEvent) => {
      if (event.pseudoElement !== '::after' || !(event.target instanceof HTMLLabelElement)) return
      const at = inputs.findIndex((input) => input.checked)
      inputs[(at + 1) % inputs.length].checked = true
      switches += 1
      if (switches >= ROUNDS * inputs.length) stop()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        pause()
        if (!entry || entry.intersectionRatio < SEEN) return
        timer = window.setTimeout(() => (root.dataset.playing = ''), started ? 0 : AFTER_INTRO)
        started = true
      },
      { threshold: [0, SEEN] },
    )

    const stop = () => {
      pause()
      observer.disconnect()
      root.removeEventListener('animationend', next)
      for (const type of actions) root.removeEventListener(type, stop)
    }

    observer.observe(root)
    root.addEventListener('animationend', next)
    for (const type of actions) root.addEventListener(type, stop)
    return stop
  }, [])

  return <span ref={ref} hidden />
}
