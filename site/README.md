# Сайт «ЗелёнаяКоробка»

Лендинг студии интернет-магазинов на Next.js 16. Документ — для разработчика, который принимает проект дальше.

## Стек

- **Next.js 16.2.10** (App Router, dev на Turbopack), **React 19.2.8**
- **TypeScript 5**, **Tailwind CSS 4.3** (`@tailwindcss/postcss`, без отдельного `tailwind.config`)
- **GSAP 3.15** (ScrollTrigger) — анимации, обёртки в `src/motion/`
- **Node ≥ 20.9** (разработка велась на Node 24), **pnpm 11.8**
- Выкат — на свой сервер (`output: 'standalone'`, обычный Node-процесс) или на Vercel: проект готов к обоим, standalone включается только вне Vercel. Порядок выката — [`../docs/04-handoff.md`](../docs/04-handoff.md)

**Важно.** Next.js 16 здесь — не та версия, что в обучающих данных LLM: часть API и конвенций отличается от привычной. Перед правками смотрите актуальную документацию в `node_modules/next/dist/docs/` (это требование корневого `AGENTS.md` репозитория); выжимка по важным для проекта местам уже сделана в [`../docs/notes-next16.md`](../docs/notes-next16.md).

`site/` — самостоятельный pnpm-проект: свои `pnpm-workspace.yaml` и `pnpm-lock.yaml`, корневой workspace монорепо `novi` не участвует.

## Запуск для разработки

```bash
pnpm install
pnpm dev          # http://localhost:3000, Turbopack
```

На машине с низким лимитом inotify (типично для контейнеров) Turbopack может не увидеть сохранение файла — правки не подхватываются без ручного перезапуска. Обходной путь — webpack-дев-сервер с поллингом вместо inotify:

```bash
WATCHPACK_POLLING=true pnpm exec next dev --webpack
```

Dev-сервер за прокси Coder (`<порт>--main--novi--albert.devgreenboxweb.ru`) уже разрешён в `next.config.ts` (`allowedDevOrigins: ['*.devgreenboxweb.ru']`) — без этого Next блокирует свои dev-ресурсы и страница остаётся без гидратации. На другом хостинге для превью эту строку меняют под свой домен или убирают.

## Сборка и запуск (standalone)

Для своего сервера. На Vercel `pnpm build` — обычный `next build`: standalone не собирается (`VERCEL=1`), копировать нечего — см. раздел «Vercel» ниже.

```bash
pnpm build   # next build; затем копирует .next/static → .next/standalone/.next/static и public/ → .next/standalone/public
pnpm start   # node .next/standalone/server.js
```

После `pnpm build` папка `.next/standalone` самодостаточна: свой урезанный `node_modules` (включая `sharp` для `next/image`), статика и `public` уже скопированы туда скриптом `build` из `package.json`. На сервер копируется вся эта папка целиком — больше ничего не нужно.

Адрес и порт — переменными окружения процесса, `next start` они не используются (standalone-сервер их читает напрямую):

```bash
PORT=3000 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

Бинарники `sharp` в сборке — под платформу, где она шла (сейчас linux-x64, glibc). Для другой платформы (Alpine/musl, arm64) собирайте прямо на ней или в её Docker-образе — перенести один бинарник между платформами не получится.

## Переменные окружения

Список и комментарии — в `.env.example`. Все переменные читает только сервер (`send.ts` помечен `server-only`), в клиентский JS они не попадают.

| Переменная | Назначение | Если не задана |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather | `/api/lead` не пытается слать в Telegram |
| `TELEGRAM_CHAT_ID` | ID чата или группы, куда бот присылает заявки | то же |
| `LEAD_LOG_PATH` | Путь к файлу лога заявок (по строке JSON на заявку) | путь по умолчанию — `leads.log` в текущей рабочей директории процесса |

Без токена и chat_id заявки не теряются: `src/lib/lead/send.ts` пишет их в лог и в консоль (`[lead] …`) и отвечает форме как об успешной отправке — так и было задумано до появления бота. Как только оба значения появятся в окружении, доставка сама переключится в Telegram, код трогать не нужно.

**На Vercel иначе:** постоянного файла лога там нет, а журнал вызовов хранится недолго, поэтому без токена и chat_id заявка не принимается — форма показывает ошибку и ссылку на Telegram студии, текст заявки уходит в журнал проекта. На Vercel обе переменные обязательны.

- Разработка: `cp .env.example .env.local`, заполнить нужное.
- Сервер: переменные окружения процесса (например, `EnvironmentFile=` в systemd-юните) или `.env.local` рядом с `server.js`.
- Секреты не кладите в `.env` и `.env.production`: `next build` копирует оба файла в `.next/standalone`, и они попадут в артефакт сборки. `.env.local` и `.env.*.local` в сборку не копируются — используйте их или окружение процесса.

## Vercel

Готово к выкату (01.10.2026): `vercel.json` (регион функций `fra1`), standalone только вне Vercel, доставка заявок без файла лога, `pnpm-workspace.yaml` совместим с pnpm 9–11. Репозиторий — `DevGreenBox/greenbox`; в проекте Vercel Root Directory — `site`, переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Без Git — `npx vercel` / `npx vercel --prod` из этой папки. Подробно — [`../docs/04-handoff.md`](../docs/04-handoff.md), раздел «Выкат на Vercel».

## Структура

```
src/app/            маршруты App Router: page.tsx (главная), privacy/, lead/sent, lead/error,
                     api/lead/route.ts, not-found.tsx, sitemap.ts, robots.ts, opengraph-image.tsx,
                     fonts/ (файлы шрифтов), ds/ (превью дизайн-системы — в продакшене 404, noindex)
src/content/*.ts     ВСЕ тексты и данные сайта — см. «Где менять контент» ниже
src/components/
  sections/          11 секций лендинга: у каждой — файл-обёртка и своя подпапка с частями
  ui/                кнопки, поля, чекбокс, чипы, аккордеон и другие переиспользуемые примитивы
  layout/            Header, Footer, MobileMenu, HeaderScroll
  brand/             логотип (Logo.tsx)
src/styles/          tokens.css (палитра light/dark и сцены, шкалы), base.css, components.css
src/motion/          Reveal.tsx (фазы авторских появлений), useScrollTrigger.ts (GSAP)
src/lib/island.tsx   острова: квиз и финальная форма — разметка в HTML, код грузится у экрана (sections/islands.tsx)
src/lib/image.ts     imageProps() — <img> со srcset next/image без клиентского компонента
src/lib/lead/        lead.ts — разбор и валидация заявки, honeypot, лимит частоты, текст для Telegram;
                     send.ts — отправка в Telegram или запись в лог
public/media/        фото кейсов и команды (media/cases, media/team)
public/brand/        логотип в SVG
```

Импорты — через алиас `@/*` → `src/*` (см. `tsconfig.json`).

### Где менять контент

Все тексты и данные вынесены в `src/content/*.ts`, компоненты их только рендерят. Менять контент — значит править эти файлы, а не JSX:

- **Кейс** — объект в массиве `cases.ts` (`title`, `category`, `did`, `tags`, `url`, `image`). Картинку меняют файлом в `public/media/cases/` и полями `image.src/width/height/alt` того же объекта. Поля `task`/`result` равны `null` — UI рисует на их месте видимую заглушку `[задача]` / `[результат]`; впишите строку — заглушка исчезнет сама, менять JSX не нужно.
- **Отзыв** — объект в `reviews.ts` (`text`, `name`, `company`, `role`, `initials`). Фото у отзывов нет по дизайну — аватар всегда инициалы.
- **Команда** — `team.ts`, фото в `public/media/team/`.
- **FAQ** — массив в `faq.ts`. У вопроса про цену `answer` содержит буквальный текст `[цена]`, а поле `placeholder: '[цена]'` говорит UI, какой фрагмент строки подсветить как заглушку (`answer.split(placeholder)`). Когда цена появится: замените `[цена]` внутри `answer` на текст и удалите поле `placeholder` целиком — иначе `split` не найдёт подстроку.
- **Квиз** — шаги и варианты ответов в `quiz.ts` (`quizSteps`), поля контактной формы там же (`contactFields`). Идентификаторы шагов (`business`, `siteType`, `features`, `integrations`, `volume`) используются и в `src/lib/lead/lead.ts` (белый список `ANSWERS` для текста заявки) — при добавлении, удалении или переименовании шага поправьте оба файла.
- **Тексты секций** (заголовок и подзаголовок hero, «Не просто сайт», «Что вы получаете», «Почему ЗелёнаяКоробка», финальный CTA) — `copy.ts`.
- **Бренд, контакты, реквизиты, навигация шапки, срок запуска, офферы** («бесплатный макет за 24 часа», скидка СДЭК) — `site.ts`. Срок «2–2,5 недели» продублирован текстом ещё в `copy.ts`, `process.ts` и `faq.ts` — при смене срока ищите по всей папке `content/`, одного места правки недостаточно.
- **Политика конфиденциальности** — `src/app/privacy/page.tsx`, компонент `<Placeholder block>` оборачивает текст `[текст политики — предоставит заказчик]`. Замените на реальный текст политики; `Placeholder` — компонент именно для видимых заглушек, для настоящего текста используйте обычную разметку (например, набор `<p>`) вместо него.

## Проверки

```bash
pnpm lint         # eslint
pnpm typecheck    # next typegen && tsc --noEmit
pnpm test         # node --test 'src/**/*.test.ts' — сейчас src/lib/lead/lead.test.ts и src/lib/typograf.test.ts
```

Прогоняйте все три перед сдачей или выкатом — в CI они не подключены, автоматической проверки на пуш нет.

## Документация проекта

Живёт на уровень выше `site/`:

- [`../PRODUCT.md`](../PRODUCT.md) — продуктовая правда: аудитория, позиционирование, факты, что нельзя выдумывать.
- [`../docs/PLAN.md`](../docs/PLAN.md) — план по этапам, статус, таблица агентов.
- [`../docs/checkpoints.md`](../docs/checkpoints.md) — журнал решений и точки восстановления.
- [`../docs/02-ux-structure.md`](../docs/02-ux-structure.md) — путь посетителя, порядок секций, карта страниц, логика квиза.
- [`../docs/03-design-system.md`](../docs/03-design-system.md) — токены, типографика, сетка, движение.
- [`../docs/design-doc.md`](../docs/design-doc.md) — живой дизайн-документ: экраны, компоненты, поведение.
- [`../docs/01-references.md`](../docs/01-references.md) — разбор референсов.
- [`../docs/notes-next16.md`](../docs/notes-next16.md) — выжимка документации Next.js 16 под этот проект.
- [`../docs/04-handoff.md`](../docs/04-handoff.md) — что заполнить перед запуском, план выката на greenboxweb.ru, происхождение медиа и лицензии.
- `../DESIGN.md` — появится позже (`impeccable-documenter`, этап 7 плана): дизайн-система, зафиксированная по факту построенного сайта.
- [`../.impeccable/surfaces/site-src-app-page-tsx.md`](../.impeccable/surfaces/site-src-app-page-tsx.md) — контракт выбранного визуального направления («Стандарт категории»); это документ для дизайн-ревью, в код сайта не попадает и рантайм на него не смотрит.
- `.impeccable/review/` — отчёты проверки: скриншоты Chromium/WebKit на нескольких ширинах, Lighthouse, `verify-report.md`.
