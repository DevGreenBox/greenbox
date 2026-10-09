// Квиз «Расскажите о проекте». Вопросы и варианты — дословно из docs/02-ux-structure.md, раздел 3
// (перенесены скриптом). id шагов, имена полей и sdekContract совпадают с разбором заявки в lib/lead/lead.ts.
// Значение ответа — текст варианта как есть.

export type QuizStepId = 'business' | 'siteType' | 'features' | 'integrations' | 'volume'

export type QuizStep = {
  id: QuizStepId
  question: string
  type: 'single' | 'multi'
  options: readonly string[]
  /** Отдельный переключатель на шаге (только интеграции). */
  toggle?: {
    id: 'sdekContract'
    label: string
    hint: string
  }
}

export const quizSteps: readonly QuizStep[] = [
  {
    id: 'business',
    question: 'Чем занимается бизнес?',
    type: 'single',
    options: ['Одежда и обувь', 'Красота и уход', 'Электроника и техника', 'Автотовары и запчасти', 'Дом и интерьер', 'Детские товары', 'Еда и напитки', 'Опт и B2B', 'Услуги', 'Другое'],
  },
  {
    id: 'siteType',
    question: 'Какой сайт нужен?',
    type: 'single',
    options: ['Интернет-магазин', 'Каталог с заявками', 'Лендинг', 'Корпоративный сайт', 'Не знаю, помогите определить'],
  },
  {
    id: 'features',
    question: 'Какие функции нужны?',
    type: 'multi',
    options: ['Онлайн-оплата', 'Личный кабинет', 'Фильтры и поиск', 'Акции и промокоды', 'Отзывы', 'Блог', 'Пока не знаю'],
  },
  {
    id: 'integrations',
    question: 'Какие интеграции?',
    type: 'multi',
    options: ['СДЭК', 'Почта России', 'ПЭК', 'Деловые линии', 'DPD', '1С', 'МойСклад', 'Битрикс24', 'amoCRM', 'Пока не нужны'],
    toggle: { id: 'sdekContract', label: 'Есть договор со СДЭК', hint: 'интеграцию подключим бесплатно' },
  },
  {
    id: 'volume',
    question: 'Какой объём?',
    type: 'single',
    options: ['До 100 товаров', '100–1 000', '1 000–10 000', 'Больше 10 000', 'Пока не знаю'],
  },
]

export type ContactField = {
  name: 'name' | 'contact' | 'comment' | 'consent'
  label: string
  required: boolean
  hint?: string
  /** Ссылка внутри подписи (согласие → политика). */
  href?: string
}

/**
 * Способ связи — переключатель над полем контакта: от него зависят клавиатура на телефоне, подсказка
 * и проверка. id совпадают с lib/lead/lead.ts (Channel). Первый — выбран по умолчанию.
 */
export const contactChannels = [
  { id: 'phone', label: 'Телефон', inputLabel: 'Номер телефона', icon: 'phone', type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+7 900 000-00-00' },
  { id: 'telegram', label: 'Telegram', inputLabel: 'Ник в Telegram', icon: 'send', type: 'text', inputMode: 'text', autoComplete: 'off', placeholder: '@username' },
  { id: 'email', label: 'Почта', inputLabel: 'Почта', icon: 'mail', type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'name@mail.ru' },
] as const

/** Шаг 6 «Контакты». Те же поля у финальной формы, там у comment своя подпись (copy.final.form). */
export const contactFields: readonly ContactField[] = [
  { name: 'name', label: 'Имя', required: true },
  { name: 'contact', label: 'Как с вами связаться', required: true },
  { name: 'comment', label: 'Комментарий', required: false },
  { name: 'consent', label: 'Согласен на обработку персональных данных', required: true, href: '/privacy' },
]

/** Подписи квиза: lead — бриф (CLAUDE.md, раздел 4) с числом вопросов (отличие от формы «Обсудить проект»),
 *  остальное — docs/02, раздел 3. */
export const quizUi = {
  title: 'Пять вопросов вместо ТЗ',
  titleAccent: 'вместо ТЗ',
  lead: 'Не знаете, какой сайт вам нужен? Ответьте на 5 коротких вопросов — поможем определить подходящее решение.',
  contactsTitle: 'Контакты',
  back: 'Назад',
  next: 'Далее',
  skipToContacts: 'Сразу оставить контакты',
  /** Пометка у прогресса: шаги с вопросами необязательны. */
  skipNote: 'Вопросы можно пропускать',
  /** Кнопка последнего шага квиза (у финальной формы своя — copy.final.form.submit). */
  submit: 'Отправить',
  /** Комментарий спрятан за ссылкой: он необязателен (с JS; без JS поле видно сразу). */
  addComment: 'Добавить комментарий',
  /** Счётчик прогресса на шаге «Контакты». */
  lastStep: 'Последний шаг',
  success: 'Заявка отправлена. Мы свяжемся с вами',
  retry: 'Попробовать ещё раз',
} as const
