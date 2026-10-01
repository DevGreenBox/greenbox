'use client'

import { useEffect, useRef } from 'react'

/**
 * Метка у самого верха страницы: пока она видна, шапка над первым экраном прозрачна.
 * Как только страница ушла вниз на 48 px, ставит шапке data-scrolled — плотный фон и высота 68 px.
 */
export function HeaderScroll({ headerId }: { headerId: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = document.getElementById(headerId)
    const mark = ref.current
    if (!header || !mark) return
    const observer = new IntersectionObserver(([entry]) =>
      header.toggleAttribute('data-scrolled', !entry.isIntersecting),
    )
    observer.observe(mark)
    return () => observer.disconnect()
  }, [headerId])

  return <div ref={ref} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 h-12 w-px" />
}
