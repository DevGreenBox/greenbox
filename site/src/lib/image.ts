import 'server-only'
import { getImgProps, type ImageProps } from 'next/dist/shared/lib/get-img-props'
import type { ImageConfigComplete } from 'next/dist/shared/lib/image-config'
import defaultLoader from 'next/dist/shared/lib/image-loader'

/**
 * Пропсы <img> как у next/image — srcset через оптимизатор /_next/image, sizes, lazy, decoding — для
 * серверных компонентов. Это getImageProps из next/image, но без его импорта: next/image тянет за собой
 * клиентский компонент Image, и тот попадает в JS первой загрузки (~5 КБ), даже если не рендерится.
 * Настройки картинок (images из next.config.ts) Next подставляет в process.env.__NEXT_IMAGE_OPTS при сборке.
 *
 * ponytail: внутренний путь next/dist; после обновления Next проверить `pnpm build` и снова
 * попробовать getImageProps из 'next/image' — если клиентский Image из первой загрузки уйдёт, этот файл не нужен.
 */
export function imageProps(props: ImageProps) {
  const imgConf = process.env.__NEXT_IMAGE_OPTS as unknown as ImageConfigComplete
  return getImgProps(props, { defaultLoader, imgConf }).props
}
