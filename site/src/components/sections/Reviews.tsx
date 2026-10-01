import { copy } from '@/content/copy'
import { reviews, type Review } from '@/content/reviews'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import s from './reviews/Reviews.module.css'

// Владелец — агент секций C. Правила: docs/03-design-system.md. id и сцену не менять без координатора.
// Редакционная раскладка без карусели: первый отзыв крупно (на десктопе держится, пока идёт список),
// остальные — списком под линиями. Держит 2–8 отзывов. Тексты дословно, кавычки «…» ставит UI.
// Движение (фазы — motion/Reveal.tsx): когда отзыв входит в экран, маркер проводит по его главной фразе
// (highlight в content/reviews.ts) — так результаты клиентов читаются с первого взгляда. Текст стоит.

export function Reviews() {
  const [first, ...rest] = reviews

  return (
    <Section id="reviews" scene="light">
      <Heading id="reviews-title" accent={copy.reviews.accent}>
        {copy.reviews.title}
      </Heading>

      {/* До 1024 крупный отзыв стоит над списком: зазор до списка — как у пунктов списка (pb-10), не больше. */}
      <div className="mt-(--space-head) grid gap-x-(--gap-lg) gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <figure
          data-reveal
          className="border-t border-line-strong pt-8 lg:sticky lg:top-[calc(var(--header-h-compact)+2.5rem)]"
        >
          {/* Кавычка-знак — рисунок, а не глиф «: в Martian он читался как иконка «назад» (критика 30.09.2026).
              SVG без полей: высота блока = высота знака, отступы до цитаты точные. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 46 36"
            className="block h-[clamp(2rem,1.4rem+1.6vw,3rem)] w-auto text-accent"
            fill="currentColor"
          >
            <path d="M0 36V21C0 9.6 5.6 2.4 16.8 0l1.9 4.6C12.6 6.7 9.6 10.3 9 15h9v21H0Zm26 0V21c0-11.4 5.6-18.6 16.8-21l1.9 4.6C38.6 6.7 35.6 10.3 35 15h9v21H26Z" />
          </svg>
          <blockquote className="mt-7 max-w-[22em] text-[clamp(1.5rem,1rem+1.45vw,2.375rem)] leading-[1.35] font-medium tracking-[-0.015em] text-ink">
            <p>
              <Quote review={first} />»
            </p>
          </blockquote>
          <Author review={first} large />
        </figure>

        {rest.length > 0 && (
          <ul>
            {rest.map((review) => (
              <li key={review.name} data-reveal className="border-t border-line-strong pt-8 pb-10 last:pb-0">
                <figure>
                  <blockquote className="text-lead text-ink">
                    <p>
                      «<Quote review={review} />»
                    </p>
                  </blockquote>
                  <Author review={review} />
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}

/** Текст отзыва; главная фраза — в маркере. Не нашлась (правка текста) — текст без маркера. */
function Quote({ review }: { review: Review }) {
  const text = typograf(review.text)
  const phrase = review.highlight && typograf(review.highlight)
  const at = phrase ? text.indexOf(phrase) : -1
  if (!phrase || at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark className={s.mark}>{phrase}</mark>
      {text.slice(at + phrase.length)}
    </>
  )
}

/** Подпись: аватар из инициалов (декоративный — имя рядом), имя, должность и компания. */
function Author({ review, large }: { review: Review; large?: boolean }) {
  return (
    <figcaption className={cx('flex items-center gap-4', large ? 'mt-8 lg:mt-10' : 'mt-6')}>
      <span
        aria-hidden="true"
        className={cx(
          'grid shrink-0 place-items-center rounded-full bg-inset font-display text-ink',
          large ? 'size-14 text-body' : 'size-11 text-caption',
        )}
      >
        {review.initials}
      </span>
      <span className="grid gap-0.5">
        <span className="font-semibold text-ink">{review.name}</span>
        <span className="text-small text-ink-2">
          {review.role}, {review.company}
        </span>
      </span>
    </figcaption>
  )
}
