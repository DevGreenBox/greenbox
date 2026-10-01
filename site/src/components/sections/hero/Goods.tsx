import type { ReactNode } from 'react'

// Товары вымышленного магазина-примера: витрина первого экрана и админка «Не просто сайт».
// Силуэты в currentColor (сетка 100 × 100), цвет задаёт тот, кто рисует: в экране ноутбука —
// палитра, в секции — токены сцены. Тень под предметом — тот же цвет на 12%.

const Shadow = ({ rx, cx = 50 }: { rx: number; cx?: number }) => (
  <ellipse cx={cx} cy="89" rx={rx} ry="3.5" fill="currentColor" opacity="0.12" />
)

const art = (children: ReactNode) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

export const vase = (
  <>
    <Shadow rx={22} />
    <path
      fill="currentColor"
      d="M43 14h14v8c0 5 4 8 9 14 7 9 8 22 3 33-3 8-9 16-19 16s-16-8-19-16c-5-11-4-24 3-33 5-6 9-9 9-14z"
    />
  </>
)

export const goods = [
  { name: 'Керамическая ваза', art: art(vase) },
  {
    name: 'Настольная лампа',
    art: art(
      <>
        <Shadow rx={20} />
        <path fill="currentColor" d="M37 16h26l12 30H25z" />
        <rect x="48" y="46" width="4" height="34" fill="currentColor" opacity="0.65" />
        <rect x="36" y="80" width="28" height="6" rx="3" fill="currentColor" />
      </>,
    ),
  },
  {
    name: 'Глиняная кружка',
    art: art(
      <>
        <Shadow rx={22} cx={47} />
        <path fill="none" stroke="currentColor" strokeWidth="6" d="M63 44h5a9 9 0 0 1 0 18h-5" />
        <path fill="currentColor" d="M29 32h36v42a12 12 0 0 1-12 12H41a12 12 0 0 1-12-12z" />
      </>,
    ),
  },
  {
    name: 'Деревянный стул',
    art: art(
      <>
        <Shadow rx={24} />
        <rect x="34" y="12" width="32" height="38" rx="6" fill="currentColor" opacity="0.7" />
        <rect x="29" y="50" width="42" height="9" rx="3" fill="currentColor" />
        <rect x="33" y="59" width="4.5" height="28" rx="1.5" fill="currentColor" />
        <rect x="62.5" y="59" width="4.5" height="28" rx="1.5" fill="currentColor" />
      </>,
    ),
  },
] as const
