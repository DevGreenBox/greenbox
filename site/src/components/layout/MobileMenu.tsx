'use client'

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

/** Шире этой ширины в шапке полная навигация, меню не нужно. */
const DESKTOP = '(min-width: 1280px)'

const unlockScroll = () => document.documentElement.style.removeProperty('overflow')

type MobileMenuProps = {
  /** Логотип-ссылка в верхней строке меню. */
  logo: ReactNode
  /** Иконки бургера и закрытия. */
  openIcon: ReactNode
  closeIcon: ReactNode
  /** Содержимое меню (разделы, ссылки, тема, кнопка) — серверная разметка, сюда приходит готовой. */
  children: ReactNode
}

/**
 * Бургер и полноэкранное меню на нативном <dialog showModal>: остальная страница inert (фокус
 * заперт внутри), Esc закрывает сам браузер, фокус возвращается на бургер. Пока меню открыто,
 * прокрутка страницы заблокирована. Клик по любой ссылке меню закрывает его.
 * Здесь только поведение: разметку меню отдаёт сервер (Header.tsx), в клиентский JS она не попадает.
 */
export function MobileMenu({ logo, openIcon, closeIcon, children }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const show = () => {
    dialog.current?.showModal()
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    setOpen(true)
  }

  // Снять блокировку сразу, до перехода по якорю, а не в событии close (оно приходит позже).
  const close = () => {
    unlockScroll()
    dialog.current?.close()
  }

  const onClose = () => {
    unlockScroll()
    setOpen(false)
  }

  const onClick = (event: MouseEvent) => {
    if ((event.target as Element).closest('a')) close()
  }

  useEffect(() => {
    const desktop = matchMedia(DESKTOP)
    const onChange = () => {
      if (!desktop.matches) return
      unlockScroll()
      dialog.current?.close()
    }
    desktop.addEventListener('change', onChange)
    return () => {
      desktop.removeEventListener('change', onChange)
      unlockScroll()
    }
  }, [])

  return (
    <>
      <button
        type="button"
        className="burger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={show}
      >
        {openIcon}
        <span className="sr-only">Меню</span>
      </button>

      <dialog
        ref={dialog}
        id="mobile-menu"
        className="menu"
        data-scene="dark"
        aria-label="Меню"
        onClose={onClose}
        onClick={onClick}
      >
        <div className="wrap menu__top">
          {logo}
          <button ref={closeButton} type="button" className="burger" onClick={close}>
            {closeIcon}
            <span className="sr-only">Закрыть меню</span>
          </button>
        </div>
        {children}
      </dialog>
    </>
  )
}
