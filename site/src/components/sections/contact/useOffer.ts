'use client'

import { useEffect, useState } from 'react'
import type { Offer } from '@/lib/lead/lead'

/**
 * Оффер, по кнопке которого пришли к форме: кнопки офферов ведут на якоря #mockup / #sdek (content/site.ts),
 * форма видит якорь в адресе при гидрации и при смене якоря. Выбор держится, пока форма на странице.
 * Острова гидрируются, когда форма подошла к экрану, — к этому времени переход по якорю уже случился.
 */
export function useOffer(offer: Offer) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const check = () => {
      if (location.hash === `#${offer}`) setActive(true)
    }
    check()
    addEventListener('hashchange', check)
    return () => removeEventListener('hashchange', check)
  }, [offer])

  return active
}
