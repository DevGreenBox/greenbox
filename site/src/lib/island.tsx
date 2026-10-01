'use client'

import { lazy, useEffect, useRef, type ComponentType } from 'react'
import { hydrateRoot } from 'react-dom/client'

/** Насколько заранее (доля экрана) до подхода острова к окну грузится его код. */
const NEAR = '150% 0px'

/** Пустой innerHTML: для основного дерева React остров — лист, его серверную разметку он не гидратирует и не стирает. */
const OPAQUE = { __html: '' }

/**
 * Остров: разметку клиентского компонента отдаёт сервер (в HTML, форма работает и без JS), а его код
 * грузится отдельным чанком, только когда блок подошёл к экрану ближе чем на полтора экрана, — не при
 * гидратации страницы. Тогда та же разметка гидратируется своим корнем React (hydrateRoot): DOM не
 * пересоздаётся, раскладка не прыгает, введённое до этого React 19 сохраняет.
 *
 * Условия для компонента острова:
 * - пропсы — только данные с сервера (они не меняются);
 * - без useId и контекста основного дерева: у своего корня другие id, поэтому id в разметке задаются явно;
 * - стили — в CSS страницы заранее (импорт CSS-модуля в статичном модуле, см. islands.tsx).
 * Не загрузился чанк — остаётся серверная разметка: форма уходит обычным POST.
 *
 *   export const QuizForm = island(() => import('./quiz/QuizForm').then((m) => m.QuizForm))
 */
export function island<P extends object>(load: () => Promise<ComponentType<P>>) {
  // Сервер ждёт модуль и пишет разметку прямо в HTML. Без Suspense: большую границу Suspense React
  // отдаёт в потоке отдельным куском, который встаёт на место только скриптом — без JS формы не было бы.
  const Server = lazy(async () => ({ default: await load() }))

  function Island(props: P) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const el = ref.current
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer.disconnect()
          load().then(
            (Component) => hydrateRoot(el, <Component {...props} />),
            () => {}, // сеть оборвалась — остаётся рабочая форма без JS
          )
        },
        { rootMargin: NEAR },
      )
      observer.observe(el)
      // ponytail: свой корень не размонтируем — остров живёт, пока жива страница (переходов без перезагрузки нет).
      return () => observer.disconnect()
    }, [props])

    if (typeof window === 'undefined') {
      return (
        <div>
          <Server {...props} />
        </div>
      )
    }
    return <div ref={ref} dangerouslySetInnerHTML={OPAQUE} suppressHydrationWarning />
  }

  return Island
}
