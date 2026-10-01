import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Chip } from '@/components/ui/Chip'
import { DeviceLaptop, DevicePhone } from '@/components/ui/Device'
import { Field } from '@/components/ui/Field'
import { Heading } from '@/components/ui/Heading'
import { Icon, iconNames } from '@/components/ui/Icon'
import { Placeholder } from '@/components/ui/Placeholder'
import { Section, type Scene } from '@/components/ui/Section'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { typograf } from '@/lib/typograf'

// Превью дизайн-системы для разработки: в продакшене 404, в sitemap не входит, noindex.
// Документ: docs/03-design-system.md.

export const metadata: Metadata = {
  title: 'Дизайн-система',
  robots: { index: false, follow: false },
}

const scenes: { scene: Scene; name: string; note: string }[] = [
  { scene: 'light', name: 'Светлая', note: '#FAFBFC · в тёмной теме #12121F' },
  { scene: 'light-2', name: 'Светлая-2', note: '#F0F2F5 · в тёмной теме #1A1A2E · зелёного текста нет' },
  { scene: 'dark', name: 'Тёмная', note: '#0A0A14 в обеих темах' },
]

const swatches = [
  ['--bg', 'фон сцены'],
  ['--surface', 'поверхность'],
  ['--inset', 'подложка'],
  ['--text', 'текст'],
  ['--text-2', 'текст 2'],
  ['--text-3', 'текст 3, крупный'],
  ['--accent', 'акцент'],
  ['--accent-ink', 'зелёный текст'],
  ['--line-strong', 'линия'],
  ['--line-control', 'граница поля'],
  ['--focus', 'фокус'],
  ['--error', 'ошибка'],
]

const typeScale = [
  ['font-wide text-h1', 'h1 · Martian Grotesk, ширина 115, 650 · 40 → 75 (до 96) px'],
  ['font-wide text-h2', 'h2 · ширина 115, 650 · 30 → 51 px'],
  ['font-display text-h3', 'h3 · ширина 100, 600 · 22 → 27 px'],
  ['font-display text-h4', 'h4 · ширина 100, 600 · 18 → 20 px'],
]

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-caption text-ink-2">{children}</p>
}

function SceneSpecimen({ scene, name, note }: { scene: Scene; name: string; note: string }) {
  const id = `ds-${scene}`
  return (
    <Section id={id} scene={scene}>
      <Heading id={`${id}-title`}>
        <span className="text-ink-3">Сцена</span> {name}
      </Heading>
      <p className="mt-(--space-lead) text-lead text-ink-2">{note}</p>

      <div className="mt-(--space-head) grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {swatches.map(([token, label]) => (
          <div key={token} className="rounded-card border border-line p-3">
            <div className="h-12 rounded-lg border border-line" style={{ background: `var(${token})` }} />
            <p className="mt-2 text-caption font-medium">{token}</p>
            <p className="text-caption text-ink-2">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-(--space-head) grid gap-(--gap-lg) lg:grid-cols-2">
        <div>
          <Label>Типографика</Label>
          <Heading as="h3" size="h2">
            <span className="text-ink-3">{typograf('Не просто сайт —')}</span> платформа для продаж
          </Heading>
          <Heading as="h4" size="h3" className="mt-8">
            Своя система управления
          </Heading>
          <Heading as="p" size="h4" className="mt-4">
            Интеграции с доставкой и CRM
          </Heading>
          <p className="mt-4 text-lead text-ink-2">
            {typograf(
              'Пишем магазин под ваш бизнес — без шаблонов и конструкторов — на собственной платформе управления.',
            )}
          </p>
          <p className="mt-4 max-w-(--measure)">
            Текст 16/1.5. Магазин работает на нашей админ-панели: товары, заказы и страницы в одном месте.{' '}
            <a href="#top">Ссылка в тексте</a> — тонкое подчёркивание с отступом.
          </p>
          <p className="mt-3 text-small text-ink-2">Мелкий 14/1.45 · вторичный цвет.</p>
          <p className="mt-1 text-caption text-ink-2">Подпись 13/1.4 · Пример интерфейса</p>
          <p className="mt-4">
            Ориентир — <Placeholder>[цена]</Placeholder>. Цифры: <span className="tabular-nums">1043 · 2–2,5</span>
          </p>
          <Placeholder block className="mt-3">
            [результат]
          </Placeholder>
        </div>

        <div className="panel p-6 sm:p-8">
          <Label>Кнопки</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon="arrow-right">Обсудить проект</Button>
            <Button variant="secondary">Рассказать о проекте</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm">Маленькая</Button>
            <Button size="sm" variant="secondary">
              Вторичная
            </Button>
            <Button disabled>Недоступна</Button>
            <Button loading>Отправляем</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6">
            <ButtonLink href="https://thecaseform.ru/" variant="text" external>
              Открыть сайт
            </ButtonLink>
            <Button variant="text" icon="arrow-right">
              Сразу оставить контакты
            </Button>
            <Button variant="text" iconStart="arrow-left">
              Назад
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-ink-2">
            {iconNames.map((name) => (
              <span key={name} title={name}>
                <Icon name={name} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-(--space-head) grid gap-(--gap-lg) lg:grid-cols-2">
        <form className="grid gap-5" action="#">
          <Label>Поля</Label>
          <Field label="Имя" name="name" required autoComplete="name" />
          <Field label="Как с вами связаться" name="contact" required hint="Телефон, Telegram или email" />
          <Field
            label="Как с вами связаться"
            name="contact-error"
            required
            defaultValue="@"
            error="Укажите телефон, Telegram или email"
          />
          <Field label="Пара слов о задаче" name="comment" multiline placeholder="Необязательно" />
          <Field label="Во время отправки" name="disabled" disabled defaultValue="Алексей" />
          <Checkbox name="consent" required>
            Согласен на обработку <a href="/privacy">персональных данных</a>
          </Checkbox>
          <Checkbox name="consent-checked" defaultChecked>
            Отмечено
          </Checkbox>
          <Checkbox name="consent-error" error="Нужно согласие на обработку персональных данных">
            Согласен на обработку <a href="/privacy">персональных данных</a>
          </Checkbox>
        </form>

        <div>
          <Label>Чипы квиза</Label>
          <fieldset>
            <legend className="font-display text-h4">Какой сайт нужен?</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Интернет-магазин', 'Каталог с заявками', 'Лендинг', 'Не знаю, помогите определить'].map((o, i) => (
                <Chip key={o} name={`${id}-site`} value={o} defaultChecked={i === 0}>
                  {o}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-8">
            <legend className="font-display text-h4">Какие интеграции?</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {['СДЭК', 'Почта России', '1С', 'МойСклад', 'amoCRM'].map((o, i) => (
                <Chip key={o} type="checkbox" name={`${id}-int`} value={o} defaultChecked={i === 0 || i === 2}>
                  {o}
                </Chip>
              ))}
              <Chip type="checkbox" name={`${id}-int`} value="off" disabled>
                Недоступен
              </Chip>
            </div>
          </fieldset>
          <div className="panel mt-10 p-6">
            <p className="font-display text-h4">Панель</p>
            <p className="mt-2 text-ink-2">Поверхность, линия 1 px, мягкая тень со смещением.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {['Интернет-магазин', 'Fashion', 'Каталог'].map((t) => (
                <li key={t} className="rounded-full bg-inset px-3 py-1.5 text-caption text-ink-2">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <>
      <Header />
      <main id="main">
        <Section id="ds" scene="light" className="pt-[calc(var(--header-h)+var(--section-y))]">
          <Heading as="h1" id="ds-title">
            Дизайн-система
          </Heading>
          <p className="mt-(--space-lead) max-w-(--measure) text-lead text-ink-2">
            Токены, сцены и компоненты сайта. Тема переключается здесь и в шапке, сцены ниже — все три.
          </p>
          <ThemeToggle showLabel className="mt-6" />

          <div className="mt-(--space-head) grid gap-(--gap-lg) lg:grid-cols-2">
            <div>
              <Label>Шкала заголовков</Label>
              {typeScale.map(([cls, note]) => (
                <div key={cls} className="border-t border-line py-5">
                  <p className={cls}>Интернет-магазины</p>
                  <p className="mt-2 text-caption text-ink-2">{note}</p>
                </div>
              ))}
            </div>
            <div>
              <Label>Отступы, радиусы, тени</Label>
              <div className="grid gap-3">
                {[
                  ['--section-y', 'секция: 72 → 144 (160)'],
                  ['--space-head', 'заголовок → содержимое: 40 → 72'],
                  ['--space-lead', 'заголовок → лид: 20 → 28'],
                  ['--gap-lg', 'сплит: 32 → 64'],
                  ['--gap', 'колонки: 16 → 28'],
                ].map(([token, note]) => (
                  <div key={token} className="flex items-center gap-4">
                    <span className="h-4 shrink-0 rounded-full bg-accent" style={{ width: `var(${token})` }} />
                    <span className="text-caption text-ink-2">
                      {token} · {note}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="h-24 rounded-panel bg-surface shadow-soft" />
                <div className="h-24 rounded-panel bg-surface shadow-lift" />
                <div className="h-24 rounded-panel bg-surface shadow-float" />
              </div>
              <p className="mt-3 text-caption text-ink-2">rounded-panel · shadow-soft / shadow-lift / shadow-float</p>
            </div>
          </div>

          <div data-scene="dark" className="mt-(--space-head) overflow-hidden rounded-panel p-6 sm:p-10">
            <Label>Устройства: ширину задаёт родитель, содержимое масштабируется от неё</Label>
            <div className="relative mx-auto aspect-[100/62] max-w-[40rem]">
              <DeviceLaptop className="absolute top-[8%] left-0 w-[84%]">
                <div className="grid h-full place-items-center text-[2em] font-bold">Витрина</div>
              </DeviceLaptop>
              <DevicePhone className="absolute right-0 bottom-0 w-[30%]">
                <div className="grid h-full place-items-center text-[1.4em] font-bold">Админка</div>
              </DevicePhone>
            </div>
          </div>
        </Section>

        {scenes.map((s) => (
          <SceneSpecimen key={s.scene} {...s} />
        ))}

        <Section id="ds-motion" scene="light">
          <Heading id="ds-motion-title">Движение</Heading>
          <p className="mt-(--space-lead) max-w-(--measure) text-lead text-ink-2">
            Шаблонного всплытия блоков нет: контент стоит на месте. Движутся только авторские моменты — вход первого
            экрана и «инспектор» фона, переключатели админки, линейки «Что вы получаете», шкала процесса, лента кейсов,
            раскрытие FAQ и шаги квиза. Замедление cubic-bezier(0.16, 1, 0.3, 1), время — токены --dur-*.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  )
}
