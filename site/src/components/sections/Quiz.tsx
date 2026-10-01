import { quizUi } from '@/content/quiz'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { QuizForm } from './islands'

// Владелец — агент секций B. Правила: docs/03-design-system.md, логика — docs/02-ux-structure.md, раздел 3.
// id и сцену не менять без координатора: на них завязаны якоря шапки и ритм сцен.
// Всё по левому краю, как у остальных блоков (решение заказчика 30.09.2026). От соседа выше, «Что вы
// получаете» (заголовок слева, тело справа), отличается раскладкой: заголовок и лид над панелью во всю
// ширину сетки; внутри панели на десктопе вопрос слева, ответы справа (quiz/Quiz.module.css).
export function Quiz() {
  return (
    <Section id="quiz" scene="light">
      <Heading id="quiz-title" accent={quizUi.titleAccent}>
        {typograf(quizUi.title)}
      </Heading>
      <p className="mt-(--space-lead) max-w-[46ch] text-lead text-ink-2">{typograf(quizUi.lead)}</p>
      {/* id — якорь оффера СДЭК (site.offers.sdek.anchor): квиз отмечает договор со СДЭК и шлёт оффер в заявке. */}
      <div id="sdek" className="mt-(--space-head)">
        <QuizForm />
      </div>
    </Section>
  )
}
