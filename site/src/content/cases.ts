// Кейсы: работы портфолио greenboxweb.ru на собственных доменах (решение заказчика 29.09.2026), тексты
// и alt перенесены скриптом дословно. Порядок — интернет-магазин первым: THE CASE,
// «Перспектива», YPM Group. «Клиника Ткачева» и «Центр кранового оборудования» сняты по решению
// владельца 09.10.2026 — вместе с их картинками. Работы на github.io (Happy Kids, СДЭК — Калькулятор
// доставки, Rubber Department) сняты, их исходники остались в assets/source/cases; GANG AUTO исключён
// раньше: его сайт отдаёт 404. Задачи и результаты неизвестны — null, UI показывает заглушки
// [задача] / [результат]. linkEnabled: false выключает ссылку, если сайт кейса перестал открываться.
// Картинки — public/media/cases, происхождение и обработка: assets/source/PROVENANCE.md.

export type CaseImage = {
  src: string
  width: number
  height: number
  alt: string
}

export type Case = {
  slug: string
  title: string
  category: string
  /** Что сделали — строка со старого сайта. */
  did: string
  tags: readonly [string, string, string]
  url: string
  task: string | null
  result: string | null
  image: CaseImage
  linkEnabled: boolean
}

export const cases: readonly Case[] = [
  {
    slug: 'the-case',
    title: 'THE CASE',
    category: 'Интернет-магазин',
    did: 'Магазин одежды в минималистичном стиле, с каталогом и корзиной',
    tags: ['Интернет-магазин', 'Fashion', 'Каталог'],
    url: 'https://thecaseform.ru/',
    task: null,
    result: null,
    image: {
      src: '/media/cases/the-case.jpg',
      width: 2400,
      height: 1142,
      alt: 'THE CASE — интернет-магазин одежды',
    },
    linkEnabled: true,
  },
  {
    slug: 'perspektiva',
    title: 'Учебный центр «Перспектива»',
    category: 'Образование',
    did: 'Сайт учебного центра по охране труда, где обучают и переподготавливают рабочих и служащих',
    tags: ['Образование', 'Охрана труда', 'Онлайн-обучение'],
    url: 'https://perspektivaot.ru/',
    task: null,
    result: null,
    image: {
      src: '/media/cases/perspektiva.jpg',
      width: 1280,
      height: 895,
      alt: 'Учебный центр «Перспектива» — центр обучения и переподготовки рабочих и служащих',
    },
    linkEnabled: true,
  },
  {
    slug: 'ypm-group',
    title: 'YPM Group',
    category: 'B2B',
    did: 'Сайт поставщика машинокомплектов из Англии и ЕС. Стоимость можно прикинуть в калькуляторе',
    tags: ['B2B', 'Автозапчасти', 'Калькулятор'],
    url: 'https://opt-ypmgroup.ru/',
    task: null,
    result: null,
    image: {
      src: '/media/cases/ypm-group.jpg',
      width: 1280,
      height: 867,
      alt: 'YPM Group — поставка машинокомплектов из Англии и ЕС',
    },
    linkEnabled: true,
  },
]
