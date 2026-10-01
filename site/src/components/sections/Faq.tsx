import { copy } from '@/content/copy'
import { faq, type FaqItem } from '@/content/faq'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Placeholder } from '@/components/ui/Placeholder'
import { Section } from '@/components/ui/Section'
import styles from './faq/Faq.module.css'

// Владелец — агент секций C. Правила: docs/03-design-system.md. id и сцену не менять без координатора.
// Заголовок над списком (правка ритма 30.09.2026: у финала ниже заголовок слева, форма справа).
// Вопросы — две колонки по 4 от 1024 px (решение заказчика 30.09.2026): читаются сверху вниз, сначала левая.
// Колонки независимы — открытый ответ раздвигает только свою. Аккордеон нативный и эксклюзивный на всю
// страницу (name="faq"): открыт один вопрос, в какой бы колонке он ни был.

const half = Math.ceil(faq.length / 2)
const columns = [faq.slice(0, half), faq.slice(half)]

export function Faq() {
  return (
    <Section id="faq" scene="light">
      <Heading id="faq-title" accent={copy.faq.accent}>
        {copy.faq.title}
      </Heading>

      <div className="mt-(--space-head) grid items-start gap-x-(--gap-lg) lg:grid-cols-2">
        {columns.map((items, i) => (
          <div key={i} className={styles.list}>
            {items.map((item) => (
              <details key={item.question} name="faq" className={styles.item}>
                <summary className={styles.summary}>
                  <span className="font-display text-h4">{typograf(item.question)}</span>
                  <span className={styles.toggle}>
                    <Icon name="plus" />
                  </span>
                </summary>
                <div className={styles.answer}>
                  <p className="max-w-(--measure) text-lead text-ink-2">
                    <Answer item={item} />
                  </p>
                </div>
              </details>
            ))}
          </div>
        ))}
      </div>
    </Section>
  )
}

/** Ответ; неизвестный факт (цена) — видимая заглушка внутри фразы. */
function Answer({ item }: { item: FaqItem }) {
  if (!item.placeholder) return typograf(item.answer)
  const [before, after = ''] = item.answer.split(item.placeholder)
  return (
    <>
      {typograf(before)}
      <Placeholder>{item.placeholder}</Placeholder>
      {typograf(after)}
    </>
  )
}
