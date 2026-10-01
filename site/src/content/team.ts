// Команда с greenboxweb.ru: имена, роли, описания и alt фото перенесены скриптом дословно.
// Портреты — public/media/team, происхождение: assets/source/PROVENANCE.md.

export type TeamMember = {
  name: string
  role: string
  description: string
  photo: {
    src: string
    width: number
    height: number
    alt: string
    /** Линия глаз (зрачки) — пиксели от верха снимка. По ней кадр ставит глаза всех портретов на одну высоту (Team.tsx). */
    eyes: number
  }
}

export const team: readonly TeamMember[] = [
  {
    name: 'Дробышев И.С.',
    role: 'Основатель компании',
    description: 'Визионер и стратег, определяющий направление развития компании.',
    photo: {
      src: '/media/team/drobyshev.jpg',
      width: 858,
      height: 1280,
      alt: 'Дробышев И.С. — Основатель ЗелёнаяКоробка',
      eyes: 327,
    },
  },
  {
    name: 'Нестеров А.С.',
    role: 'Старший веб-разработчик',
    description: 'Технический лидер команды. Отвечает за архитектуру и техническую реализацию проектов.',
    photo: {
      src: '/media/team/nesterov.jpg',
      width: 858,
      height: 1280,
      alt: 'Нестеров А.С. — Старший веб-разработчик ЗелёнаяКоробка',
      eyes: 426,
    },
  },
]
