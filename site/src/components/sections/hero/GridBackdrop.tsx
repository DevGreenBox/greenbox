import type { CSSProperties } from 'react'
import { cx } from '@/lib/cx'
import demo from './Demo.module.css'
import { GridLive } from './GridLive'
import s from './GridBackdrop.module.css'

// Подписи чертежа — Martian Mono (lib/fonts.ts). Слой декоративный: шрифт не предзагружается и с JS
// включается только после замера (data-live, GridBackdrop.module.css) — до первой отрисовки слой скрыт,
// а файл, найденный в CSS, браузер качал бы наравне со шрифтами заголовка.

const HEADER = '<header>'
const SECTION = '<section class="hero">'
const CARD = '.product-card'

/** Выделение инспектора: контур, маркеры по углам, тег и размер (размер — из CSS-переменной). */
const Pick = ({ name }: { name: string }) => (
  <div className={s.pick}>
    <i />
    <i />
    <i />
    <i />
    <b>
      {name}
      <span />
    </b>
  </div>
)

const Card = ({ className, name }: { className: string; name?: string }) => (
  <div className={cx(s.blk, s.card, className)}>
    {name && <span className={s.lbl}>{name}</span>}
    <i className={s.img} />
    <i className={s.bar} />
    <i className={cx(s.bar, s.barShort)} />
    {name && <Pick name={name} />}
  </div>
)

/** «Сетка макета»: страница рисует свою сетку и блоки за устройствами первого экрана. */
export function GridBackdrop() {
  return (
    <div className={s.plan}>
      <div className={s.page}>
        <div className={s.grid}>
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <span className={s.note} />
        <div className={cx(s.blk, s.hdr)}>
          <span className={s.lbl}>{HEADER}</span>
          <i className={s.logo} />
          <i className={s.nav} />
          <i className={s.cart} />
          <Pick name={HEADER} />
        </div>
        <div className={cx(s.blk, s.main)}>
          <span className={s.lbl}>{SECTION}</span>
          <Pick name={SECTION} />
        </div>
        <Card className={s.c1} />
        <Card className={s.c2} name={CARD} />
        <Card className={s.c3} />
        <span className={cx(s.dim, s.dimV, s.gapDim)}>
          <b />
        </span>
        <span className={cx(s.dim, s.dimV, s.padDim)}>
          <b />
        </span>
        <span className={cx(s.dim, s.dimH, s.cardsDim)}>
          <b />
        </span>
        <span className={cx(s.dim, s.dimH, s.gutterDim)}>
          <b />
        </span>
      </div>
      <GridLive parts={{ devices: demo.demo, laptop: demo.laptop, hdr: s.hdr, main: s.main, card: s.c2 }} />
    </div>
  )
}
