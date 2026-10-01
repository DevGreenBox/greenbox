import { copy } from '@/content/copy'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import s from './get/Get.module.css'

// «Что вы получаете» (заголовок «Всё необходимое для платформы»): колонки поровну — в 4 : 8 и 5 : 7
// «необходимое» и «для платформы» не влезали в колонку заголовка на 1024–1440 (рвалось слово или «для»
// оставалось одно). Строки списка сами выбирают раскладку по его ширине (Get.module.css). Крупные строки под линейками, только типографика — плотнее и строже
// соседей (визуальная «Не просто сайт» выше, интерактивный квиз ниже). При появлении линейки
// прочерчиваются слева направо зелёным и остывают до цвета линии, текст стоит на месте (фазы Reveal, Get.module.css).
export function Get() {
  const { title, accent, points } = copy.get

  return (
    <Section id="get" scene="dark">
      <div className="grid gap-(--space-head) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-(--gap-lg)">
        <Heading id="get-title" accent={accent}>
          {typograf(title)}
        </Heading>
        <dl className={s.list}>
          {points.map((point) => (
            <div key={point.title} data-reveal className={s.row}>
              <dt className="font-display text-h3">{typograf(point.title)}</dt>
              <dd className="max-w-(--measure) text-lead text-ink-2">{typograf(point.text)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
