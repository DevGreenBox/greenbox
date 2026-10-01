import type { CSSProperties } from 'react'
import { processNote, processSteps, processTitle, processTitleAccent } from '@/content/process'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Section } from '@/components/ui/Section'
import s from './process/Process.module.css'

// Владелец — агент секций B. Правила: docs/03-design-system.md.
// id и сцену не менять без координатора: на них завязаны якоря шапки и ритм сцен.
// Шкала из 4 шагов и срок на размерной линии, как в прототипе. Авторское движение (data-reveal, фазы —
// motion/Reveal.tsx): линия дорисовывается, маркеры шагов загораются по очереди, текст стоит на месте.
// Без JS и при reduced-motion — сразу итог.
export function Process() {
  return (
    <Section id="process" scene="light-2">
      <Heading id="process-title" accent={processTitleAccent}>
        {typograf(processTitle)}
      </Heading>
      <div className={s.track} data-reveal>
        <ol className={s.steps}>
          {processSteps.map((step, i) => (
            <li key={step.title} className={s.step} style={{ '--n': i } as CSSProperties}>
              <span className={s.num} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={cx('font-display text-h4', s.title)}>{step.title}</h3>
              <p className={cx('text-ink-2', s.text)}>{typograf(step.text)}</p>
            </li>
          ))}
        </ol>
        <p className={s.duration}>
          <span className={s.note}>
            <Icon name="clock" className={s.clock} />
            {typograf(processNote)}
          </span>
        </p>
      </div>
    </Section>
  )
}
