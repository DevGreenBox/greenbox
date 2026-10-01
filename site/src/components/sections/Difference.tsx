import type { CSSProperties } from 'react'
import { copy } from '@/content/copy'
import { quizSteps } from '@/content/quiz'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Section } from '@/components/ui/Section'
import { goods } from './hero/Goods'
import { AdminTour } from './difference/AdminTour'
import s from './difference/Difference.module.css'

// «Не просто сайт»: одно высказывание и три отличия — не сетка одинаковых карточек.
// Слева сцена с админкой, нарисованной в коде (на десктопе во всю высоту правой колонки).
// Справа главное отличие — «Своя система управления», это и есть «платформа»
// из заголовка, — и два других под линейками, у каждого свой знак: зачёркнутые конструкторы и
// функция «+», которую добавят позже. Интеграции здесь не повторяются: они в «Что вы получаете».
// Порядок пунктов — content/copy.ts: [без шаблонов, своя система, рост].
// Движение (фазы — motion/Reveal.tsx, CSS — difference/Difference.module.css): когда сцена входит в экран,
// в админке нажимается «+» и сверху въезжает новый товар, его переключатель «на сайте» включается;
// Tilda, WordPress и конструктор зачёркиваются по очереди. Дальше разделы админки переключаются сами
// (AdminTour) и по нажатию — у каждого своё содержимое и своё действие (заказчик 01.10.2026).
// Без JS и при reduced-motion — сразу итог, вкладки работают и так (radio + :has).

/** «Код пишем… Не Tilda, не WordPress, не конструктор.» → вступление, фраза и ['Tilda', 'WordPress', 'конструктор']. */
function notThese(text: string) {
  const match = /^(.+?)\s*(Не ([^.]+)\.)$/.exec(text)
  return match && { lead: match[1], sentence: match[2], items: match[3].split(/, не /) }
}

/** Функции из вопроса квиза «Какие функции нужны?»: две уже есть, третья добавляется. */
const features = quizSteps.find((step) => step.id === 'features')?.options.slice(0, 3) ?? []

/** Разделы админки — вкладки сцены. У каждого своё действие, когда он открывается (Difference.module.css):
 *  товары — добавлен новый товар (при появлении сцены), заказы — пришёл новый, страницы — опубликована акция. */
const sections = [
  { id: 'goods', label: 'Товары' },
  { id: 'orders', label: 'Заказы' },
  { id: 'pages', label: 'Страницы' },
]

// Заказы и страницы вымышленного магазина-примера, как и товары: это рисунок интерфейса, а не факты о студии.
// Номера заказов — как в админке первого экрана.
const orders = [
  { number: '№ 1043', detail: '2 товара · СДЭК', status: 'Оплачен', paid: true },
  { number: '№ 1042', detail: '1 товар · Почта России', status: 'Собран' },
  { number: '№ 1041', detail: '3 товара · СДЭК', status: 'В доставке' },
  { number: '№ 1040', detail: '1 товар · самовывоз', status: 'Получен' },
]
/** Последняя — акция с баннера витрины первого экрана: при открытии раздела она публикуется. */
const pages = [
  { name: 'Главная', path: '/' },
  { name: 'Каталог', path: '/catalog' },
  { name: 'Доставка и оплата', path: '/delivery' },
  { name: 'Новая коллекция', path: '/sale' },
]

const step = (n: number) => ({ '--n': n }) as CSSProperties

/**
 * Админка магазина: вкладки «Товары / Заказы / Страницы» и список раздела. Рисунок интерфейса на токенах
 * сцены. Вкладки — нативные radio (клавиатура, без JS), список отвечает на них через CSS :has(); для
 * скринридера списки скрыты — это рисунок, смысл несут подписи вкладок. Первая строка товаров — «новый
 * товар»: при появлении сцены она въезжает сверху.
 */
function AdminGlimpse() {
  return (
    <div className={s.window} data-admin>
      <AdminTour />
      <div className={s.top}>
        <div className={s.tabs} role="radiogroup" aria-label="Разделы админки" aria-describedby="admin-hint">
          {sections.map((section, i) => (
            <label key={section.id} className={s.tab}>
              <input
                type="radio"
                name="admin-section"
                value={section.id}
                defaultChecked={i === 0}
                className={s.tabInput}
              />
              {section.label}
            </label>
          ))}
        </div>
        <p id="admin-hint" hidden>
          Переключают пример экрана админки
        </p>
        <span className={s.add} aria-hidden="true">
          <Icon name="plus" />
        </span>
      </div>

      <div className={s.panels} aria-hidden="true">
        <ul className={cx(s.panel, s.rows)} data-panel="goods">
          {goods.map((item, i) => (
            <li key={item.name} className={s.row} style={step(i)}>
              <span className={s.thumb}>{item.art}</span>
              <span className={s.info}>
                <span className={s.name}>{item.name}</span>
                <span className={s.price} />
              </span>
              <span className={cx(s.switch, i !== 2 && s.switchOn)} />
            </li>
          ))}
        </ul>
        <ul className={s.panel} data-panel="orders">
          {orders.map((order, i) => (
            <li key={order.number} className={s.row} style={step(i)}>
              <span className={s.thumb}>
                <Icon name="package" />
              </span>
              <span className={s.info}>
                <span className={s.name}>{order.number}</span>
                <span className={s.detail}>{order.detail}</span>
              </span>
              <span className={cx(s.status, order.paid && s.statusPaid)}>{order.status}</span>
            </li>
          ))}
        </ul>
        <ul className={s.panel} data-panel="pages">
          {pages.map((page, i) => (
            <li key={page.path} className={s.row} style={step(i)}>
              <span className={s.thumb}>
                <Icon name="file-text" />
              </span>
              <span className={s.info}>
                <span className={s.name}>{page.name}</span>
                <span className={s.detail}>{page.path}</span>
              </span>
              <span className={cx(s.switch, s.switchOn)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Difference() {
  const { title, accent, points } = copy.difference
  const [templates, platform, growth] = points
  const brands = notThese(templates.text)

  return (
    <Section id="difference" scene="light">
      {/* Зелёная часть — со второй строки: «Вы получите» / «платформу для продаж» (так разбил заказчик). */}
      <Heading id="difference-title" className="max-w-[16em] [&>span]:block" accent={accent}>
        {typograf(title)}
      </Heading>

      <div className={cx('mt-(--space-head)', s.layout)}>
        <div className={s.featured}>
          <h3 className="font-display text-h3">{typograf(platform.title)}</h3>
          <p className="mt-4 max-w-[32ch] text-lead text-ink-2">{typograf(platform.text)}</p>
        </div>

        <div className={s.stage} data-scene="light-2" data-reveal>
          <AdminGlimpse />
        </div>

        <ul className={s.list}>
          <li className={s.point}>
            <h3 className="font-display text-h4">{typograf(templates.title)}</h3>
            {brands ? (
              <>
                <p className="mt-3 text-ink-2">{typograf(brands.lead)}</p>
                <p className="sr-only">{brands.sentence}</p>
                <ul className={s.chips} aria-hidden="true" data-reveal>
                  {brands.items.map((brand, i) => (
                    <li key={brand} className={cx(s.chip, s.chipStruck)} style={{ '--k': i } as CSSProperties}>
                      {brand[0].toUpperCase() + brand.slice(1)}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-ink-2">{typograf(templates.text)}</p>
            )}
          </li>

          <li className={s.point}>
            <h3 className="font-display text-h4">{typograf(growth.title)}</h3>
            <p className="mt-3 text-ink-2">{typograf(growth.text)}</p>
            <ul className={s.chips} aria-hidden="true">
              {features.map((feature, i) => (
                <li key={feature} className={cx(s.chip, i < features.length - 1 ? s.chipOn : s.chipNext)}>
                  {i === features.length - 1 && <Icon name="plus" />}
                  {feature}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </Section>
  )
}
