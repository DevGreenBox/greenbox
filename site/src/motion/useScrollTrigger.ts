import { useEffect, useEffectEvent, type RefObject } from 'react'
import type { gsap as Gsap } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

export type ScrollTools = { gsap: typeof Gsap; ScrollTrigger: typeof ScrollTriggerType }

/** Десктоп и движение разрешено — условие по умолчанию. */
export const DESKTOP_MOTION = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

/** Насколько заранее (доля экрана) до подхода scope к окну грузится GSAP. */
const NEAR = '100% 0px'

/** Сколько прокрутка должна стоять, чтобы считаться остановленной. */
const SCROLL_IDLE_MS = 150

/**
 * Ждёт, пока прокрутка остановится. Первый ScrollTrigger делает refresh(): мерит страницу, прокрутив её
 * в 0, и возвращает позицию — это обрывает идущую плавную прокрутку к якорю. GSAP грузится как раз на
 * пути вниз, поэтому «Обсудить проект» с первого экрана застревал в кейсах, не доехав до формы
 * (найдено 01.10.2026). После остановки refresh возвращает ту же позицию — незаметно.
 * ponytail: при прокрутке совсем без пауз лента кейсов включится на первой паузе ≥ 150 мс (scrub
 * догонит плавно); станет заметно — ждать остановки только после клика по якорю (событие scrollend).
 */
function whenScrollIdle() {
  return new Promise<void>((resolve) => {
    const done = () => {
      removeEventListener('scroll', wait)
      resolve()
    }
    let timer = setTimeout(done, SCROLL_IDLE_MS)
    const wait = () => {
      clearTimeout(timer)
      timer = setTimeout(done, SCROLL_IDLE_MS)
    }
    addEventListener('scroll', wait, { passive: true })
  })
}

/**
 * GSAP + ScrollTrigger для клиентского компонента. Библиотека грузится отдельным чанком только
 * когда media совпала (на телефоне и при reduced-motion не грузится вовсе) и scope подошёл к окну
 * ближе чем на экран: первый экран не ждёт 46 КБ, и в простое вверху страницы нет цикла
 * requestAnimationFrame, который ScrollTrigger держит, пока включён. Поэтому setup не должен
 * менять раскладку (высоты, pin со spacer) — она обязана быть готова в CSS заранее. ScrollTrigger
 * создаётся, когда прокрутка остановилась (whenScrollIdle): его refresh иначе обрывает переход к якорю. setup выполняется
 * внутри gsap.matchMedia(scope): всё, что он создал (твины, таймлайны, ScrollTrigger),
 * откатывается само, когда media перестаёт совпадать и при размонтировании. Вернуть из setup
 * можно функцию для своей уборки (слушатели и т. п.). Селекторы в setup ищутся внутри scope.
 *
 *   const ref = useRef<HTMLDivElement>(null) // высота секции и sticky-сцена — в CSS
 *   useScrollTrigger(ref, ({ gsap }) => {
 *     gsap.to('.track', { x: () => -distance(), ease: 'none',
 *       scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 1 } })
 *   })
 */
export function useScrollTrigger(
  scope: RefObject<HTMLElement | null>,
  setup: (tools: ScrollTools) => void | (() => void),
  media: string = DESKTOP_MOTION,
) {
  const run = useEffectEvent(setup)

  useEffect(() => {
    const query = matchMedia(media)
    let mm: gsap.MatchMedia | undefined
    let alive = true

    const load = async () => {
      query.removeEventListener('change', load)
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      await whenScrollIdle()
      if (!alive || !scope.current) return
      gsap.registerPlugin(ScrollTrigger)
      mm = gsap.matchMedia(scope.current)
      mm.add(media, () => run({ gsap, ScrollTrigger }))
    }

    // ponytail: цикл rAF ScrollTrigger живёт и после ухода от scope (выключать его — только
    // ScrollTrigger.disable/enable целиком, с перерегистрацией); ~1–2 % CPU в простое ниже по странице.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        near.disconnect()
        if (query.matches) void load()
        else query.addEventListener('change', load)
      },
      { rootMargin: NEAR },
    )
    if (scope.current) near.observe(scope.current)

    return () => {
      alive = false
      near.disconnect()
      query.removeEventListener('change', load)
      mm?.revert()
    }
  }, [media, scope])
}
