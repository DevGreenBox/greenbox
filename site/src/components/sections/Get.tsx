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
      {/* Колонки 5 : 7, а не поровну: список идёт в два столбца и занимает больше места, чем заголовок.
          Заголовок липкий — иначе под ним на широком экране оставалась пустая половина высоты списка
          (правка по замечанию владельца 09.10.2026: «пустот таких быть не должно»). Прилипает ниже
          шапки, чтобы она его не перекрывала. */}
      <div className="grid gap-(--space-head) lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-(--gap-lg)">
        <Heading
          id="get-title"
          accent={accent}
          className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start"
        >
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
