'use client'

import { useEffect, useRef } from 'react'

/** Классы блоков, которые меряет GridLive. Приходят с сервера строками: карты CSS-модулей в клиентский JS не идут. */
export type GridParts = {
  /** Demo.module.css */
  devices: string
  laptop: string
  /** GridBackdrop.module.css */
  hdr: string
  main: string
  card: string
}

/**
 * Замер «Сетки макета» по живой вёрстке: верх и низ устройств, верх ноутбука (от верха секции),
 * размеры выделенных блоков и отступ до ноутбука. Пересчёт при изменении размеров первого экрана
 * и после загрузки шрифтов. После первого замера — data-live: CSS прочерчивает контуры
 * (при reduced-motion base.css отдаёт готовый кадр). Ничего не рисует сам.
 */
export function GridLive({ parts }: { parts: GridParts }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const plan = ref.current?.parentElement
    const hero = plan?.closest('section')
    const devices = hero?.querySelector<HTMLElement>(`.${parts.devices}`)
    const laptop = devices?.querySelector<HTMLElement>(`.${parts.laptop}`)
    const layout = devices?.closest('figure')?.parentElement
    if (!plan || !hero || !devices || !laptop || !layout) return

    const find = (name: string) => plan.querySelector<HTMLElement>(`.${name}`)
    const size = (el: HTMLElement | null) => `"${el?.offsetWidth ?? 0} × ${el?.offsetHeight ?? 0}"`
    const set = (name: string, value: string) => plan.style.setProperty(name, value)

    const measure = () => {
      const top = hero.getBoundingClientRect().top
      const box = devices.getBoundingClientRect()
      // offsetTop — без сдвига анимации появления ноутбука
      const laptopTop = box.top - top + laptop.offsetTop
      set('--dt', `${box.top - top}px`)
      set('--db', `${box.bottom - top}px`)
      set('--lt', `${laptopTop}px`)
      const main = find(parts.main)
      set('--v-hdr', size(find(parts.hdr)))
      set('--v-hero', size(main))
      set('--v-card', size(find(parts.card)))
      set('--v-pad', `"${Math.round(laptopTop - (main?.offsetTop ?? 0))}"`)
      plan.dataset.live = ''
    }

    const observer = new ResizeObserver(measure)
    observer.observe(hero)
    observer.observe(layout)
    void document.fonts.ready.then(measure)
    return () => observer.disconnect()
  }, [parts])

  return <span ref={ref} hidden />
}
