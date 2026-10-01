/** Склеивает классы, пропуская пустые: cx('btn', big && 'btn--lg'). */
export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ')
