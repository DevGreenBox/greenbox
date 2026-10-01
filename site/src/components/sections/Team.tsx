import type { CSSProperties } from 'react'
import { copy } from '@/content/copy'
import { team, type TeamMember } from '@/content/team'
import { cx } from '@/lib/cx'
import { imageProps } from '@/lib/image'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import s from './team/Team.module.css'

// Владелец — агент секций C. Правила: docs/03-design-system.md. id и сцену не менять без координатора.
// Кадр и пропорция — как в блоке «Команда» на greenboxweb.ru (решение заказчика 30.09.2026): снимок во всю
// ширину карточки, голова и плечи, 3:2 (там 380 px высоты при ~576 ширины), на телефоне 4:3 (там 400 × 300).
// Отличие от старого сайта: там общий сдвиг «center 15%» ставил глаза на разную высоту — здесь у каждого
// снимка свой сдвиг (eyeShift), глаза всех портретов на одной линии.
// Подпись — прямо на снимке, как там: низ фото уходит в цвет карточки (--surface), имя, роль и описание
// стоят на этом переходе, но по левому краю (решение заказчика 30.09.2026).
// Движение (фазы — motion/Reveal.tsx): карточка вошла в экран — портрет проявляется из ч/б и мягкого
// расфокуса в цвет и резкость, вторая карточка чуть позже (team/Team.module.css).

/** Линия глаз в кадре — доля высоты сверху; 0.385 — как у первого портрета на старом сайте. */
const EYE_LINE = 0.385
/** Пропорции кадра (ширина / высота): телефон и от 640 px (классы aspect-* в Portrait). */
const FRAME = { narrow: 4 / 3, wide: 3 / 2 }

/**
 * Сдвиг object-position по вертикали, при котором глаза встают на EYE_LINE высоты кадра. Портрет выше
 * кадра и покрывает его по ширине (object-fit: cover): лишняя высота — overflow ширин кадра, сдвиг Y%
 * опускает снимок на Y × overflow. Клэмп 0–100%: дальше у снимка кончается край.
 */
function eyeShift(photo: TeamMember['photo'], frame: number) {
  const overflow = photo.height / photo.width - 1 / frame
  const shift = (photo.eyes / photo.width - EYE_LINE / frame) / overflow
  return `${(Math.min(1, Math.max(0, shift)) * 100).toFixed(2)}%`
}

/** Портрет: srcset и оптимизация next/image, обычный <img> без клиентского компонента (lib/image.ts). */
function Portrait({ photo }: { photo: TeamMember['photo'] }) {
  const { src, ...props } = imageProps({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt: photo.alt,
    // ширина карточки: одна колонка до 640, две — дальше
    sizes: '(min-width: 1280px) calc(50vw - 8.5rem), (min-width: 640px) calc(50vw - 3rem), calc(100vw - 2.5rem)',
    loading: 'lazy',
  })
  const eyes = { '--eyes': eyeShift(photo, FRAME.narrow), '--eyes-wide': eyeShift(photo, FRAME.wide) } as CSSProperties

  return (
    // eslint-disable-next-line @next/next/no-img-element -- props next/image из lib/image.ts
    <img
      src={src}
      {...props}
      alt={photo.alt}
      className={cx(
        s.photo,
        'aspect-[4/3] w-full object-cover object-[50%_var(--eyes)] sm:aspect-[3/2] sm:object-[50%_var(--eyes-wide)]',
      )}
      style={{ ...props.style, ...eyes }}
    />
  )
}

export function Team() {
  return (
    <Section id="team" scene="light-2">
      <Heading id="team-title" accent={copy.team.accent}>
        {typograf(copy.team.title)}
      </Heading>

      <ul className="mt-(--space-head) grid gap-x-(--gap-lg) gap-y-12 sm:grid-cols-2">
        {team.map((member) => (
          <li key={member.name} data-reveal className="overflow-hidden rounded-panel border border-line bg-surface shadow-lift">
            {/* overflow-hidden: при проявке снимок крупнее кадра (Team.module.css) — край режет кадр, а не карточка */}
            <div className="relative overflow-hidden">
              <Portrait photo={member.photo} />
              {/* Низ снимка растворяется в цвете карточки — только ниже подбородков (они на 64–69% высоты
                  кадра при линии глаз 38.5%): затухание с 68%, лица чистые. Подпись заходит на снимок на
                  24–32 px, как на старом сайте (−30 px): под ней подложка плотная (~85%), текст читается. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[32%] bg-linear-to-t from-surface from-10% via-surface/60 via-50% to-transparent"
              />
            </div>
            <div className="relative -mt-6 px-6 pb-8 sm:-mt-8 sm:px-8 sm:pb-9">
              <h3 className="font-display text-h3">{member.name}</h3>
              <p className="mt-2 font-medium text-accent-ink">{typograf(member.role)}</p>
              <p className="mt-3 max-w-[40ch] text-ink-2">{typograf(member.description)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
