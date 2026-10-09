import type { CSSProperties } from 'react'
import { cases, type Case } from '@/content/cases'
import { copy } from '@/content/copy'
import { cx } from '@/lib/cx'
import { imageProps } from '@/lib/image'
import { typograf } from '@/lib/typograf'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { CasesScroller } from './cases/CasesScroller'
import styles from './cases/Cases.module.css'

// Владелец — агент секций C. Правила: docs/03-design-system.md. id и сцену не менять без координатора.
// Раскладки (лента, сетка с лидером, закреплённая прокрутка) описаны в cases/Cases.module.css.

/** Ширина кадра: закрепление ~48vw (потолок 62rem), лента на планшете 34rem, на телефоне экран минус поля. */
const SIZES = '(min-width: 2160px) 62rem, (min-width: 1024px) 48vw, (min-width: 640px) 34rem, calc(100vw - 4rem)'

const pad = (n: number) => String(n).padStart(2, '0')

/** Скриншот сайта: srcset и оптимизация next/image, обычный <img> без клиентского компонента (lib/image.ts). */
function Screenshot({ image }: { image: Case['image'] }) {
  const { src, ...props } = imageProps({ ...image, sizes: SIZES, loading: 'lazy' })
  // eslint-disable-next-line @next/next/no-img-element -- props next/image из lib/image.ts
  return <img src={src} {...props} alt={image.alt} className={styles.img} />
}

export function Cases() {
  const total = cases.length

  return (
    <Section id="cases" scene="dark" bleed className={styles.section} style={{ '--n': total } as CSSProperties}>
      <CasesScroller className={styles.pin}>
        <div className={styles.stage}>
          <div className={cx('wrap', styles.head)}>
            <Heading id="cases-title" accent={copy.cases.accent}>
              {copy.cases.title}
            </Heading>
            <p className={styles.progress} aria-hidden="true">
              <span>
                .case{' '}
                <span data-now className={styles.now}>
                  01
                </span>
                {' / '}
                {pad(total)}
              </span>
              <span className={styles.bar}>
                <span data-fill className={styles.fill} style={{ transform: `scaleX(${1 / total})` }} />
              </span>
            </p>
          </div>

          <div className={styles.viewport} data-viewport>
            <ul className={styles.track} data-track role="list">
              {cases.map((item) => (
                <li key={item.slug} className={styles.item} data-item>
                  <CaseCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CasesScroller>
    </Section>
  )
}

function CaseCard({ item }: { item: Case }) {
  const { title, category, did, url, task, result, image, linkEnabled } = item
  const tags = item.tags.filter((tag) => tag !== category)

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <div className={styles.chrome} aria-hidden="true">
          <span className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.url}>{new URL(url).host}</span>
        </div>
        <div className={styles.view}>
          <Screenshot image={image} />
        </div>
        {linkEnabled && (
          <a href={url} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true" className={styles.hit} />
        )}
      </div>

      <div className={styles.body}>
        <h3 className="font-display text-h3">{typograf(title)}</h3>
        <ul className={styles.pills}>
          <li className={cx(styles.pill, styles.category)}>{category}</li>
          {tags.map((tag) => (
            <li key={tag} className={styles.pill}>
              {tag}
            </li>
          ))}
        </ul>
        {/* Задача и результат показываются, только когда они есть. Раньше на их месте стояли видимые
            заглушки «[задача]» и «[результат]» — на боевом сайте они были во всех карточках сразу и
            читались как недоделка. Поля в content/cases.ts остались: впишете текст — строка вернётся. */}
        <dl className={styles.facts}>
          {task && (
            <div className={styles.fact}>
              <dt>Задача</dt>
              <dd>{typograf(task)}</dd>
            </div>
          )}
          <div className={styles.fact}>
            <dt>Что сделали</dt>
            <dd>{typograf(did)}</dd>
          </div>
          {result && (
            <div className={styles.fact}>
              <dt>Результат</dt>
              <dd>{typograf(result)}</dd>
            </div>
          )}
        </dl>
        {linkEnabled && (
          <ButtonLink href={url} variant="text" external className={styles.link}>
            Открыть сайт<span className="sr-only"> {title}</span>
          </ButtonLink>
        )}
      </div>
    </article>
  )
}
