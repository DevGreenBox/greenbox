import { copy } from '@/content/copy'
import { site } from '@/content/site'
import { typograf } from '@/lib/typograf'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'

// Владелец — агент секций C. Правила: docs/03-design-system.md. id и сцену не менять без координатора.
// Короткое резюме без повторов выше (правка по критике 29.09.2026): три аргумента, которых нет в «Не просто
// сайт» и «Что вы получаете», — срок, помощь, цена — и панель оффера. Панель тёмная (поверхность сцены
// и линия), зелёная — только кнопка: акцент не больше 6% кадра (правка по критике 30.09.2026, раньше панели
// были залиты зелёным). Кнопка ведёт на якорь оффера: макет → финальная форма (#mockup).
// Офферов было два, второй — скидка 60% клиентам СДЭК — снят 09.10.2026 вместе со всеми упоминаниями скидки.
// Панель-ссылку целиком с откликом на наведение пробовали — заказчик оставил как было (01.10.2026).

const plate =
  'flex h-full flex-col items-start gap-8 rounded-panel border border-line-strong bg-surface p-[clamp(1.75rem,1rem+2vw,3rem)] shadow-soft'

export function Why() {
  const { title, accent, points, mockupCta } = copy.why

  return (
    <Section id="why" scene="dark">
      <Heading id="why-title" accent={accent}>
        {typograf(title)}
      </Heading>

      <ul className="mt-(--space-head) grid gap-x-(--gap) gap-y-10 md:grid-cols-3">
        {points.map((point) => (
          <li key={point.title} className="border-t border-line-strong pt-6">
            <h3 className="font-display text-h4">{typograf(point.title)}</h3>
            <p className="mt-3 text-ink-2">{typograf(point.text)}</p>
          </li>
        ))}
      </ul>

      {/* Оффер остался один, поэтому панель идёт во всю ширину, а текст и кнопка встают в строку:
          в прежней сетке на две колонки одинокая панель заняла бы половину, и рядом зияла бы пустая
          половина экрана. На узких экранах раскладка прежняя — колонкой. */}
      <div className={`${plate} mt-(--space-head) md:flex-row md:items-center md:justify-between md:gap-(--gap-lg)`}>
        {/* Абзац в две-три строки кеглем h3: интерлиньяж свободнее заголовочного 1.2 */}
        <p className="max-w-[18em] font-display text-h3 leading-[1.35]">{typograf(site.offers.mockup.title)}</p>
        <ButtonLink href={mockupCta.href} icon="arrow-right" className="mt-auto whitespace-normal md:mt-0 md:shrink-0">
          {mockupCta.label}
        </ButtonLink>
      </div>
    </Section>
  )
}
