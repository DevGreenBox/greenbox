import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// Рамки устройств на CSS (как в прототипе). Ширину задаёт родитель, всё внутри масштабируется от неё:
// в экране ноутбука 1em = 1/60 ширины ноутбука, в экране телефона — 1/19 ширины телефона.
// Экран светлый в любой теме и сцене — это изображение интерфейса, а не часть страницы.

/** Ноутбук: крышка с камерой, экран 16:10 со слотом, основание. */
export function DeviceLaptop({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cx('device-laptop', className)}>
      <div className="device-laptop__lid">
        <div className="device-laptop__screen">{children}</div>
      </div>
      <div className="device-laptop__base" />
    </div>
  )
}

/** Телефон: корпус, «островок», экран со слотом (≈ 9:19). */
export function DevicePhone({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cx('device-phone', className)}>
      <div className="device-phone__body">
        <div className="device-phone__screen">
          <span className="device-phone__island" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  )
}
