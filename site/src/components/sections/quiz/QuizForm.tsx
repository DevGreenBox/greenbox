'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { quizSteps, quizUi } from '@/content/quiz'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Chip } from '@/components/ui/Chip'
import { contactRows, LeadError, LeadFields, LeadSent, type SummaryRow } from '../contact/LeadParts'
import { useLeadForm } from '../contact/useLeadForm'
import s from './Quiz.module.css'

/** Индекс шага «Контакты»: после пяти вопросов. */
const LAST = quizSteps.length

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Высота панели плавно доезжает от прежней до новой (шаги разной высоты). Время и кривая — токены. */
function flipHeight(box: HTMLElement, from: number) {
  const to = box.offsetHeight
  if (from === to || reducedMotion()) return
  box.animate(
    [
      { height: `${from}px`, overflow: 'hidden' },
      { height: `${to}px`, overflow: 'hidden' },
    ],
    { duration: parseFloat(token('--dur-reveal')) || 600, easing: token('--ease-out') || 'ease-out' },
  )
}

/** Ответы и контакты для сводки после отправки: пропущенные шаги не показываем. */
function summary(data: FormData): SummaryRow[] {
  const rows: SummaryRow[] = []
  for (const q of quizSteps) {
    const values = data.getAll(`answers.${q.id}`).map(String)
    if (values.length) rows.push([q.question, values.join(', ')])
    // Договор со СДЭК — своей строкой: это не интеграция, а условие скидки.
    if (q.toggle && data.has(`answers.${q.toggle.id}`)) {
      rows.push([q.toggle.label, q.toggle.hint[0].toUpperCase() + q.toggle.hint.slice(1)])
    }
  }
  return [...rows, ...contactRows(data)]
}

/**
 * Квиз «Расскажите о проекте». Без JS — одна длинная форма со всеми шагами (обычный POST).
 * С JS (класс .js на <html> ставится до отрисовки) — по шагу: прогресс, «Назад», «Далее», пропуск
 * к контактам. Шаги необязательны. Ответы живут в самих radio/checkbox и собираются при отправке.
 */
export function QuizForm() {
  const { formRef, sentRef, status, fields, error, data, send, onChange, retry } = useLeadForm()
  const panel = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'next' | 'back'>()

  function go(to: number) {
    const box = panel.current
    if (!box) return
    const from = box.offsetHeight
    flushSync(() => {
      setDir(to < step ? 'back' : 'next')
      setStep(to)
    })
    // Фокус на вопрос нового шага: скринридер объявит его, Tab пойдёт по вариантам.
    box.querySelector<HTMLElement>(`[data-step="${to}"] h3`)?.focus({ preventScroll: true })
    flipHeight(box, from)
    // Нажали «Далее» внизу длинного шага — начало нового шага могло уехать под шапку.
    const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    if (box.getBoundingClientRect().top < top) {
      box.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Неявная отправка (Enter) на шагах с вопросами — это «Далее».
    if (step < LAST) return go(step + 1)
    const box = panel.current
    const from = box?.offsetHeight ?? 0
    await send(event.currentTarget)
    if (box) flipHeight(box, from)
  }

  // Enter на варианте ответа — к следующему шагу (Space выбирает вариант, как обычно).
  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    const { type } = event.target as HTMLInputElement
    if (event.key === 'Enter' && step < LAST && (type === 'radio' || type === 'checkbox')) {
      event.preventDefault()
      go(step + 1)
    }
  }

  const sent = status === 'sent' && data

  return (
    <form
      ref={formRef}
      action="/api/lead"
      method="post"
      encType="multipart/form-data"
      className={s.form}
      data-dir={dir}
      data-last={step === LAST || undefined}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      onChange={onChange}
    >
      <div ref={panel} className={cx('panel', s.panel)}>
        {sent ? (
          <LeadSent rows={summary(sent)} headingRef={sentRef} className={s.sent} />
        ) : (
          <>
            <div className={cx(s.progress, s.jsOnly)}>
              {/* Счётчик для глаз — обычным текстом: моно-тег выделения ниже только украшение.
                  Скринридер слышит номер шага в legend вопроса, поэтому здесь aria-hidden. */}
              <span className={s.counter} aria-hidden="true">
                {step < LAST ? `Шаг ${step + 1} из ${LAST}` : quizUi.lastStep}
              </span>
              <span className={s.bar} aria-hidden="true">
                {quizSteps.map((q, i) => (
                  <span key={q.id} data-on={i <= step || undefined} />
                ))}
              </span>
              {step < LAST && <span className={s.skipNote}>{quizUi.skipNote}</span>}
            </div>

            <div className={s.steps}>
              {quizSteps.map((q, i) => (
                <fieldset key={q.id} className={s.step} data-step={i} data-active={i === step || undefined}>
                  <legend className={s.legend}>
                    <h3 tabIndex={-1} className={cx('font-display text-h3', s.question)}>
                      <span className="sr-only">
                        Шаг {i + 1} из {LAST}.{' '}
                      </span>
                      {typograf(q.question)}
                    </h3>
                  </legend>
                  {q.type === 'multi' && <p className={s.hint}>Можно выбрать несколько</p>}
                  <div className={s.answers}>
                    <div className={s.chips}>
                      {q.options.map((option) => (
                        <Chip
                          key={option}
                          type={q.type === 'multi' ? 'checkbox' : 'radio'}
                          name={`answers.${q.id}`}
                          value={option}
                        >
                          {typograf(option)}
                        </Chip>
                      ))}
                    </div>
                    {q.toggle && (
                      <Checkbox id={`quiz-${q.toggle.id}`} name={`answers.${q.toggle.id}`} className={s.offer}>
                        <span className={s.offerLabel}>{q.toggle.label}</span>
                        {typograf(` — ${q.toggle.hint}`)}
                      </Checkbox>
                    )}
                  </div>
                </fieldset>
              ))}

              <fieldset id="quiz-contacts" className={s.step} data-step={LAST} data-active={step === LAST || undefined}>
                <legend className={s.legend}>
                  <h3 tabIndex={-1} className={cx('font-display text-h3', s.question)}>
                    {quizUi.contactsTitle}
                  </h3>
                </legend>
                <div className={cx(s.answers, s.fields)}>
                  <LeadFields source="quiz" errors={fields} />
                </div>
              </fieldset>
            </div>

            <div className={s.nav}>
              {step > 0 && (
                <Button variant="text" iconStart="arrow-left" className={cx(s.back, s.jsOnly)} onClick={() => go(step - 1)}>
                  {quizUi.back}
                </Button>
              )}
              {step < LAST && (
                <Button variant="text" className={cx(s.skip, s.jsOnly)} onClick={() => go(LAST)}>
                  {quizUi.skipToContacts}
                </Button>
              )}
              {step < LAST && (
                <Button icon="arrow-right" className={cx(s.next, s.jsOnly)} onClick={() => go(step + 1)}>
                  {quizUi.next}
                </Button>
              )}
              <Button type="submit" icon="arrow-right" className={s.submit} loading={status === 'sending'}>
                {quizUi.submit}
              </Button>
            </div>

            {status === 'failed' && <LeadError message={error} onRetry={retry} />}
          </>
        )}
      </div>
      {/* Перекличка с «Сеткой макета» первого экрана: панель выделена, как блок в инспекторе, — контур,
          маркеры по углам и тег с номером шага. Вне панели: её обрезает overflow, пока доезжает высота. */}
      {!sent && (
        <div className={cx(s.pick, s.jsOnly)} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          {step < LAST ? (
            <b>
              .step<span>{`${step + 1} / ${LAST}`}</span>
            </b>
          ) : (
            <b>.contacts</b>
          )}
        </div>
      )}
    </form>
  )
}
