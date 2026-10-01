'use client'

import { useEffect } from 'react'

/** Зазор под шапкой, когда блок выше видимой области. */
const GAP = 24
/** Сколько прокрутка должна стоять, чтобы считаться законченной. */
const IDLE_MS = 150
const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/**
 * Переход к секции главной по якорю (шапка, меню, подвал, кнопки, адрес с #, «назад»): блок встаёт по центру
 * видимой области под шапкой — поровну места сверху и снизу, без недокрутки и перекрутки (заказчик
 * 01.10.2026). Переход делает сам браузер, здесь только scroll-margin-top секций: он считается так, чтобы
 * обычный якорь ставил по центру содержимое секции без её полей (section-y симметричны, а у секций чуть
 * выше экрана лишние как раз они). Не помещается и содержимое (телефон, ноутбук 1280 × 800) — верх
 * содержимого под шапкой с зазором GAP. Секция со своим scroll-margin в CSS (закреплённые кейсы) и первый
 * экран — как есть. Пересчёт — при смене размеров секций и окна.
 */
export function AnchorCenter() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')].filter((s) => s.id !== 'top')

    const update = () => {
      // scroll-padding-top у html — высота компактной шапки (base.css).
      const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const room = innerHeight - header
      for (const section of sections) {
        section.style.scrollMarginTop = ''
        const style = getComputedStyle(section)
        if (parseFloat(style.scrollMarginTop)) continue
        const padTop = parseFloat(style.paddingTop)
        const content = section.offsetHeight - padTop - parseFloat(style.paddingBottom)
        const above = content > room ? Math.min(padTop, GAP) : (room - content) / 2
        section.style.scrollMarginTop = `${above - padTop}px`
      }
    }

    update()
    const observer = new ResizeObserver(update)
    for (const section of sections) observer.observe(section)
    addEventListener('resize', update)

    // Открыли главную с якорем: браузер мог начать прокрутку к нему раньше, чем посчитаны отступы, —
    // когда она кончится, встать по ним заново (если посетитель сам не взялся листать).
    const target = sections.find((s) => `#${s.id}` === decodeURIComponent(location.hash))
    let timer = 0
    const stop = () => {
      clearTimeout(timer)
      removeEventListener('scroll', wait)
      for (const type of INPUT) removeEventListener(type, stop)
    }
    const wait = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        stop()
        target?.scrollIntoView({ block: 'start', behavior: 'instant' })
      }, IDLE_MS)
    }
    if (target) {
      addEventListener('scroll', wait, { passive: true })
      for (const type of INPUT) addEventListener(type, stop, { passive: true })
      wait()
    }

    return () => {
      stop()
      observer.disconnect()
      removeEventListener('resize', update)
    }
  }, [])

  return null
}
