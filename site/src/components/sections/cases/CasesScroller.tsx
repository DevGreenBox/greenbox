'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useScrollTrigger } from '@/motion/useScrollTrigger'

/** Когда кейсы закрепляются и едут вбок. То же условие — в Cases.module.css (раскладка 3). */
const PIN = '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)'

/** До этой ширины кейсы — лента со scroll-snap (Cases.module.css, раскладка 1). */
const RIBBON = '(max-width: 1023px)'

/** Счётчик «.case 03 / 05» (по числу работ) и полоса. p — прогресс ленты от 0 до 1. */
function paint(root: HTMLElement, p: number) {
  const now = root.querySelector<HTMLElement>('[data-now]')
  const fill = root.querySelector<HTMLElement>('[data-fill]')
  const total = root.querySelectorAll('[data-item]').length
  if (!now || !fill || !total) return
  const step = p * (total - 1)
  now.textContent = String(Math.round(step) + 1).padStart(2, '0')
  fill.style.transform = `scaleX(${(step + 1) / total})`
}

/**
 * Движение кейсов. Разметку и все три раскладки даёт сервер (Cases.tsx + CSS), здесь только:
 * - лента (до 1024 px): счётчик по её прокрутке; фокус с клавиатуры внутри карточки ставит ленту
 *   ровно на эту карточку;
 * - десктоп: лента едет вбок по прокрутке страницы, сцена держится CSS sticky. Фокус с клавиатуры
 *   на ссылке карточки за краем экрана прокручивает страницу к этой карточке.
 */
export function CasesScroller({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    const viewport = root?.querySelector<HTMLElement>('[data-viewport]')
    if (!root || !viewport) return
    // После гидрации счётчик включает моноширинный шрифт (Cases.module.css, .pin[data-live]): так файл шрифта
    // не конкурирует с LCP, как и у подписей «Сетки макета».
    root.dataset.live = ''
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth
      paint(root, max > 0 ? viewport.scrollLeft / max : 0)
    }
    // Браузер докручивает ленту только до ссылки в фокусе, а mandatory-snap возвращает её к ближайшей
    // точке — чаще к прошлой карточке, и ссылка остаётся за краем. Ставим ленту сами, сразу и ровно
    // в точку привязки карточки (её левый край минус scroll-padding): тогда браузеру докручивать нечего.
    const ribbon = matchMedia(RIBBON)
    const onFocus = (event: FocusEvent) => {
      const item = (event.target as Element).closest<HTMLElement>('[data-item]')
      if (!ribbon.matches || !item) return
      const pad = parseFloat(getComputedStyle(viewport).scrollPaddingInlineStart) || 0
      viewport.scrollTo({ left: item.offsetLeft - pad, behavior: 'instant' })
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })
    viewport.addEventListener('focusin', onFocus)
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      viewport.removeEventListener('focusin', onFocus)
    }
  }, [])

  useScrollTrigger(
    ref,
    ({ gsap, ScrollTrigger }) => {
      const root = ref.current!
      const track = root.querySelector<HTMLElement>('[data-track]')!
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth)

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true },
        onUpdate(this: gsap.core.Tween) {
          paint(root, this.progress())
        },
      })

      const onFocus = (event: FocusEvent) => {
        const item = (event.target as Element).closest<HTMLElement>('[data-item]')
        const st = tween.scrollTrigger
        if (!item || !st) return
        const box = item.getBoundingClientRect()
        if (box.left >= 0 && box.right <= document.documentElement.clientWidth) return
        const offset = box.left - track.getBoundingClientRect().left - parseFloat(getComputedStyle(track).paddingLeft)
        const x = Math.min(Math.max(offset, 0), distance())
        window.scrollTo({ top: st.start + (x / (distance() || 1)) * (st.end - st.start), behavior: 'instant' })
      }
      root.addEventListener('focusin', onFocus)

      // Секции выше могут менять высоту (шаги квиза и т. п.) — позиции начала и конца пересчитываем.
      const refresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause()
      const observer = new ResizeObserver(() => refresh.restart(true))
      observer.observe(document.body)

      return () => {
        root.removeEventListener('focusin', onFocus)
        observer.disconnect()
        paint(root, 0)
      }
    },
    PIN,
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
