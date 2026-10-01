'use client'

import { useEffect, useRef } from 'react'

/** Не раньше этого момента от начала загрузки: вход первого экрана (устройства, баннер, новинки) закончился. */
const AFTER_ENTER = 2600
/** Сколько «Акция на главной» стоит выключенной, мс. */
const HOLD = 1600
/** Сколько после включения держится подсветка строки переключателя, мс. */
const SETTLE = 700

/**
 * Автопроход демо первого экрана после гидрации — один раз, когда вход закончился и витрина видна:
 * выключает «Акцию на главной» и через HOLD включает обратно, витрина сворачивает и разворачивает баннер (data-tour подсвечивает строку).
 * Без reduced-motion, фокус не трогает (меняется только checked). Посетитель нажал, навёл на переключатели
 * или сфокусировал что-то в демо — автопроход отменяется; если он взялся за сам переключатель, его выбор
 * остаётся, иначе акция возвращается включённой. Ничего не рисует.
 */
export function DemoTour({ promo }: { promo: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const figure = ref.current?.closest('figure')
    const input = figure?.querySelector<HTMLInputElement>(`.${promo}`)
    const row = input?.closest('label')
    const group = input?.closest<HTMLElement>('[role="group"]')
    if (!figure || !input || !row || !group) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timer = 0
    let off = false // «Акцию» выключил автопроход, а не посетитель
    const actions = ['pointerdown', 'keydown', 'focusin'] as const

    const stop = () => {
      window.clearTimeout(timer)
      observer.disconnect()
      for (const type of actions) figure.removeEventListener(type, cancel)
      group.removeEventListener('pointerenter', cancel)
      delete figure.dataset.tour
    }

    const cancel = (event?: Event) => {
      stop()
      if (off && !(event && row.contains(event.target as Node))) input.checked = true
      off = false
    }

    const play = () => {
      observer.disconnect()
      figure.dataset.tour = ''
      input.checked = false
      off = true
      timer = window.setTimeout(() => {
        input.checked = true
        off = false
        timer = window.setTimeout(stop, SETTLE)
      }, HOLD)
    }

    // Демо почти целиком в экране (или занимает почти весь экран, если выше его): на телефоне оно ниже
    // первого экрана — проход ждёт прокрутки, ушло из экрана до старта — ждёт снова.
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer)
        const seen = entry.intersectionRatio >= 0.85 || entry.intersectionRect.height >= innerHeight * 0.8
        if (seen) timer = window.setTimeout(play, Math.max(AFTER_ENTER - performance.now(), 400))
      },
      { threshold: [0, 0.5, 0.7, 0.85, 1] },
    )
    observer.observe(figure)
    for (const type of actions) figure.addEventListener(type, cancel)
    group.addEventListener('pointerenter', cancel)

    return cancel
  }, [promo])

  return <span ref={ref} hidden />
}
