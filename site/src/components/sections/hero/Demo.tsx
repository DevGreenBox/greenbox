import type { CSSProperties } from 'react'
import { copy } from '@/content/copy'
import { cx } from '@/lib/cx'
import { typograf } from '@/lib/typograf'
import { DeviceLaptop, DevicePhone } from '@/components/ui/Device'
import { Icon } from '@/components/ui/Icon'
import { DemoTour } from './DemoTour'
import { goods, vase } from './Goods'
import s from './Demo.module.css'

// Подписи вымышленного магазина-примера: это рисунок интерфейса, а не факты о студии.
const store = {
  nav: ['Каталог', 'Новинки', 'Доставка'],
  promo: { chip: 'Акция', title: 'Новая коллекция', button: 'Смотреть' },
  fresh: 'Новинки',
  catalog: 'Каталог',
  categories: ['Посуда', 'Освещение', 'Мебель', 'Текстиль'],
}
const admin = { title: 'Заказы', showcase: 'Витрина', integrations: 'Интеграции' }
const orderDots = [s.dotPaid, s.dotPacked, s.dotShip]
/** Первый переключатель управляет баннером акции, второй — блоком новинок (CSS :has в Demo.module.css). */
const switches = [s.promoSwitch, s.freshSwitch]

const step = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * Витрина на ноутбуке и админка на телефоне, собранные в коде. Переключатели админки — нативные
 * checkbox с role="switch": состояние браузер отдаёт скринридеру сам (checked ⇒ aria-checked),
 * работают с клавиатуры (Space) и без JS; витрина отвечает на них через CSS :has().
 * Витрина для скринридера скрыта: это иллюстрация, смысл несут подписи переключателей.
 *
 * Правки по критике (29.09 и 30.09.2026), чтобы жест заметили: переключатели витрины сразу под заказами,
 * выше интеграций; DemoTour один раз сам выключает и включает акцию. Видимой подписи под сценой нет
 * (заказчик 30.09.2026). Телефон стоит вровень с ноутбуком (возврат композиции 29.09 — 30.09.2026). Витрина на ноутбуке следует теме сайта
 * (светлая / тёмная), админка на телефоне светлая всегда.
 */
export function Demo({ className }: { className?: string }) {
  const { caption, orders, toggles, integrations } = copy.hero.demo

  // Видимой подписи нет (заказчик 30.09.2026) — «Пример интерфейса» остаётся названием фигуры для скринридера:
  // витрина и заказы здесь нарисованы, это не реальный магазин.
  return (
    <figure className={cx(s.demo, className)} aria-label={caption}>
      <DemoTour promo={s.promoSwitch} />
      <DeviceLaptop className={s.laptop}>
        {/* Светлая сцена: витрина следует теме сайта (светлая / тёмная), первый экран вокруг остаётся тёмным. */}
        <div className={s.store} data-scene="light" aria-hidden="true">
          <div className={s.bar}>
            <span className={s.logo} />
            <span className={s.nav}>
              {store.nav.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </span>
            <span className={s.icons}>
              <Icon name="search" className={s.storeIcon} />
              <Icon name="heart" className={s.storeIcon} />
              <Icon name="bag" className={s.storeIcon} />
            </span>
          </div>

          <div className={s.banner}>
            <span className={s.chip}>{store.promo.chip}</span>
            <span className={s.headline}>{store.promo.title}</span>
            <span className={s.bannerButton}>{store.promo.button}</span>
            <svg className={s.art} viewBox="0 0 170 106" aria-hidden="true" focusable="false">
              <circle cx="104" cy="74" r="56" fill="#00C853" />
              <svg x="62" y="12" width="84" height="84" viewBox="0 0 100 100" color="#E8E8F0">
                {vase}
              </svg>
            </svg>
          </div>

          <div className={s.fresh}>
            <p className={s.heading}>{store.fresh}</p>
            <div className={s.grid}>
              {goods.map((item, i) => (
                <div key={item.name} className={s.product} style={step(i)}>
                  <span className={s.productArt}>{item.art}</span>
                  <span className={s.productName}>{item.name}</span>
                  <span className={s.price} />
                </div>
              ))}
            </div>
          </div>

          <div className={s.catalog}>
            <p className={s.heading}>{store.catalog}</p>
            <div className={s.grid}>
              {store.categories.map((item) => (
                <span key={item} className={s.category}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className={s.footer}>
            <span className={s.logo} />
            <i />
            <i />
            <i />
          </div>
        </div>
      </DeviceLaptop>

      <DevicePhone className={s.phone}>
        <div className={s.admin}>
          <div aria-hidden="true">
            <p className={s.adminTitle}>{admin.title}</p>
            <ul className={s.rows}>
              {orders.map((order, i) => {
                const [number, ...status] = typograf(order).split(' · ')
                return (
                  <li key={order}>
                    <span className={cx(s.dot, orderDots[i % orderDots.length])} />
                    <b>{number}</b>
                    <span className={s.status}>{status.join(' · ')}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div role="group" aria-labelledby="hero-demo-showcase" aria-describedby="hero-demo-hint">
            <p id="hero-demo-showcase" className={s.label}>
              {admin.showcase}
            </p>
            {/* Описание группы для скринридера (aria-describedby читает и скрытый узел). */}
            <p id="hero-demo-hint" hidden>
              Переключатели меняют витрину на экране ноутбука
            </p>
            <ul className={s.rows}>
              {toggles.map((label, i) => (
                <li key={label}>
                  <label className={s.toggle}>
                    <span className={s.toggleLabel}>{label}</span>
                    <input type="checkbox" role="switch" defaultChecked className={cx(s.switch, switches[i])} />
                    <span className={s.track} aria-hidden="true">
                      <span className={s.knob} />
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className={s.integrations}>
            <p className={s.label}>{admin.integrations}</p>
            <ul className={s.apps}>
              {integrations.map((name) => (
                <li key={name}>
                  <span className={s.check}>
                    <Icon name="check" />
                  </span>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className={s.tabbar}>
            <Icon name="list" className={s.active} />
            <Icon name="package" />
            <Icon name="dashboard" />
            <Icon name="settings" />
          </div>
        </div>
      </DevicePhone>
    </figure>
  )
}
