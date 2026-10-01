// «Как мы работаем»: 4 шага и срок — prototype/CONTENT.md, раздел 4.
// Описания отдельной строкой, поэтому с заглавной буквы (как в прототипе).

export type ProcessStep = {
  title: string
  text: string
}

export const processTitle = 'Четыре шага до запуска'
/** Зелёная часть заголовка, как в логотипе (Heading accent). */
export const processTitleAccent = 'до запуска'

export const processSteps: readonly ProcessStep[] = [
  { title: 'Обсуждаем', text: 'Разбираемся в задаче.' },
  { title: 'Проектируем', text: 'Структура, дизайн, техническое решение.' },
  { title: 'Разрабатываем', text: 'Создаём магазин и нужные функции.' },
  { title: 'Запускаем', text: 'Подключаем интеграции и передаём готовый проект.' },
]

export const processNote = 'В среднем 2–2,5 недели от старта до запуска.'
