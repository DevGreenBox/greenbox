'use client'

import { useEffect } from 'react'

/** Больше этого номера каскад не растёт: десятый элемент пачки не ждёт секунду. */
const MAX_STEP = 8

/**
 * Авторские появления при скролле — линейки «Что вы получаете» и шкала «Как мы работаем» (их CSS —
 * в модулях секций, docs/03-design-system.md, §7). Шаблонного всплытия блоков на сайте нет: контент
 * стоит на месте, движется только графика этих секций.
 *
 * Монтируется один раз на страницу (page.tsx), ничего не рендерит. Элементу [data-reveal], вошедшему
 * в экран, ставит data-revealed и номер в пачке --i (каскад); на <html> — класс reveal-on, под которым
 * CSS прячет исходное состояние. Без JS, при reduced-motion и для того, что уже на экране при загрузке,
 * всё видно сразу.
 */
export function Reveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const html = document.documentElement

    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          observer.unobserve(el)
          el.style.setProperty('--i', String(Math.min(step++, MAX_STEP)))
          el.dataset.revealed = ''
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )

    for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.revealed = ''
      else observer.observe(el)
    }
    html.classList.add('reveal-on')

    return () => {
      observer.disconnect()
      html.classList.remove('reveal-on')
    }
  }, [])

  return null
}
