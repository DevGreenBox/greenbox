// Кейсы: боевые проекты студии — ровно список владельца от 09.10.2026 («Перспектива» и YPM Group
// сняты оттуда же); картинки — свежие
// снимки первых экранов самих сайтов, снятые 09.10.2026 в 1280×800 при двойной плотности
// (скрипт съёмки прятал баннеры cookie и выбора региона, чтобы в кадр попала сама витрина).
// Порядок — решение владельца: «Новый Минерал», сразу за ним афиша DEYA MUSIC, дальше остальные
// витрины от самых выразительных к служебным.
//
// Rubber Department (rubberdpt.ru) в портфолио НЕ входит по решению владельца: сайт 18+.
// Carré Russe (carrerusse.com) ждёт снимка: сайт не открывается из сети разработки, его сервер
// отвечает только сам себе — снимок нужно снять на самом сервере или получить от владельца.
//
// Задачи и результаты по проектам неизвестны — null, UI показывает заглушки [задача] / [результат].
// linkEnabled: false выключает ссылку, если сайт кейса перестал открываться.

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
  /** Что сделали — одна фраза по фактам самой витрины. */
  did: string
  tags: readonly [string, string, string]
  url: string
  task: string | null
  result: string | null
  image: CaseImage
  linkEnabled: boolean
}

/** Снимки сняты одним прогоном, поэтому размер у всех один. */
const SHOT = { width: 2560, height: 1600 } as const

export const cases: readonly Case[] = [
  {
    slug: 'noviymineral',
    title: 'Новый Минерал',
    category: 'Интернет-магазин',
    did: 'Магазин коллекционных минералов и изделий из натурального камня: поиск по камню, месторождению и артикулу, личный кабинет, доставка СДЭК',
    tags: ['Минералы', 'Личный кабинет', 'СДЭК'],
    url: 'https://noviymineral.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/noviymineral.jpg', ...SHOT, alt: 'Новый Минерал — магазин коллекционных минералов' },
    linkEnabled: true,
  },
  {
    slug: 'deya',
    title: 'DEYA MUSIC',
    category: 'Афиша',
    did: 'Афиша концертов с расписанием и продажей билетов',
    tags: ['Афиша', 'Билеты', 'Расписание'],
    url: 'https://events.deyamusic.com/',
    task: null,
    result: null,
    image: { src: '/media/cases/deya.jpg', ...SHOT, alt: 'DEYA MUSIC — афиша концертов с расписанием и билетами' },
    linkEnabled: true,
  },
  {
    slug: 'kamin',
    title: 'Студия каминов',
    category: 'Интернет-магазин',
    did: 'Магазин электрокаминов собственного производства: подбор портала и очага, отзывы, оплата и доставка',
    tags: ['Электрокамины', 'Своё производство', 'Онлайн-оплата'],
    url: 'https://studiyakaminov.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/kamin.jpg', ...SHOT, alt: 'Студия каминов — магазин электрокаминов собственного производства' },
    linkEnabled: true,
  },
  {
    slug: 'glass',
    title: 'GLASS',
    category: 'Интернет-магазин',
    did: 'Магазин накладных ресниц и расходников с продажами в пяти странах: свои языки, валюты и регионы доставки',
    tags: ['Красота', 'Пять стран', 'Мультивалютность'],
    url: 'https://glassowm.com/',
    task: null,
    result: null,
    image: { src: '/media/cases/glass.jpg', ...SHOT, alt: 'GLASS — магазин накладных ресниц и материалов для наращивания' },
    linkEnabled: true,
  },
  {
    slug: 'rusgear',
    title: 'RUSGEAR',
    category: 'Интернет-магазин',
    did: 'Магазин бронезащиты и тактического снаряжения от производителя: каталог и сборка полного комплекта',
    tags: ['Бронезащита', 'Сборка комплекта', 'Каталог'],
    url: 'https://rus-gear.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/rusgear.jpg', ...SHOT, alt: 'RUSGEAR — магазин бронежилетов и тактического снаряжения' },
    linkEnabled: true,
  },
  {
    slug: 'davautoshop',
    title: 'DAV.AUTOSHOP',
    category: 'Интернет-магазин',
    did: 'Магазин запчастей и аксессуаров для BMW: обвес, решётки и шильдики с подбором по модели',
    tags: ['Автозапчасти', 'BMW', 'Подбор по модели'],
    url: 'https://davautoshop.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/davautoshop.jpg', ...SHOT, alt: 'DAV.AUTOSHOP — магазин запчастей и аксессуаров для BMW' },
    linkEnabled: true,
  },
  {
    slug: 'the-case',
    title: 'THE CASE',
    category: 'Интернет-магазин',
    did: 'Магазин медицинской одежды в минималистичном стиле, с каталогом и корзиной',
    tags: ['Медицинская одежда', 'Каталог', 'Корзина'],
    url: 'https://thecaseform.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/the-case.jpg', ...SHOT, alt: 'THE CASE — магазин медицинской одежды' },
    linkEnabled: true,
  },
  {
    slug: 'svforma',
    title: 'СВформа',
    category: 'Интернет-магазин',
    did: 'Магазин медицинской одежды и спецодежды: халаты, костюмы и рубашки с размерными сетками',
    tags: ['Спецодежда', 'Размерные сетки', 'Каталог'],
    url: 'https://свформа52.рф/',
    task: null,
    result: null,
    image: { src: '/media/cases/svforma.jpg', ...SHOT, alt: 'СВформа — магазин медицинской одежды и спецодежды' },
    linkEnabled: true,
  },
  {
    slug: 'personalflash',
    title: 'Personal Flash',
    category: 'Интернет-магазин',
    did: 'Магазин именных флешек с конструктором гравировки',
    tags: ['Подарки', 'Конструктор гравировки', 'Каталог'],
    url: 'https://personalflash.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/personalflash.jpg', ...SHOT, alt: 'Personal Flash — магазин именных флешек с гравировкой' },
    linkEnabled: true,
  },
  {
    slug: 'tvuchet',
    title: 'Тепловодоучет',
    category: 'Интернет-магазин',
    did: 'Магазин приборов учёта воды и тепловой энергии с отдельным разделом для оптовых покупателей',
    tags: ['Приборы учёта', 'Опт', 'B2B'],
    url: 'https://tvuchet.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/tvuchet.jpg', ...SHOT, alt: 'Тепловодоучет — магазин приборов учёта воды и тепловой энергии' },
    linkEnabled: true,
  },
  {
    slug: 'prom',
    title: 'Пром-Материалы',
    category: 'Интернет-магазин',
    did: 'Магазин промышленной автоматики и электрооборудования: поиск по названию, производителю и номиналу, работа с юрлицами',
    tags: ['Промавтоматика', 'Поиск по номиналу', 'Юрлицам'],
    url: 'https://khimki-prom.ru/',
    task: null,
    result: null,
    image: { src: '/media/cases/prom.jpg', ...SHOT, alt: 'Пром-Материалы — магазин промышленной автоматики и электрооборудования' },
    linkEnabled: true,
  },
]
