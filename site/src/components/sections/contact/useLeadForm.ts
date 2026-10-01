'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { site } from '@/content/site'
import { formToObject, type Fields } from '@/lib/lead/lead'

export type LeadStatus = 'idle' | 'sending' | 'sent' | 'failed'

type Reply = { ok?: boolean; error?: string; fields?: Fields }

/** Нет ответа сервера (сеть, таймаут): свой текст, у сервера он приходит в поле error. */
const OFFLINE = `Не получилось достучаться до сервера. Попробуйте ещё раз или напишите нам в Telegram ${site.contacts.telegram.handle}`

/**
 * Отправка заявки — одна логика для квиза и финальной формы.
 *
 * Без JS форма уходит обычным POST (action="/api/lead") и получает страницу /lead/sent или /lead/error,
 * а обязательные поля проверяет сам браузер (required). С JS: noValidate — ошибки показываем сами,
 * текстом у поля; fetch JSON тех же полей (formToObject — тот же разбор, что на сервере, поэтому
 * в answers уходит видимый текст вариантов). Ответы: ok → sent и фокус на сообщение; fields → ошибки
 * у полей и фокус на первое; остальное (413/429/502, сеть) → failed с текстом и «Попробовать ещё раз».
 */
export function useLeadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const sentRef = useRef<HTMLHeadingElement>(null)
  const busy = useRef(false)
  const [status, setStatus] = useState<LeadStatus>('idle')
  const [fields, setFields] = useState<Fields>({})
  const [error, setError] = useState('')
  const [data, setData] = useState<FormData>()

  useEffect(() => {
    if (formRef.current) formRef.current.noValidate = true
  }, [])

  /** Отправляет форму; повторный вызов во время отправки ничего не делает (Enter на кнопке с loading). */
  async function send(form: HTMLFormElement) {
    if (busy.current) return
    busy.current = true
    const body = new FormData(form)
    setStatus('sending')
    setError('')

    let reply: Reply = {}
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(formToObject(body)),
        signal: AbortSignal.timeout(15_000),
      })
      reply = await res.json().catch(() => ({}))
    } catch {
      // Сеть или таймаут: reply пустой, покажем OFFLINE.
    }
    busy.current = false

    if (reply.ok) {
      flushSync(() => {
        setData(body)
        setStatus('sent')
      })
      sentRef.current?.focus()
      return
    }

    // source в разметке не показать: такая ошибка — общая, а не у поля.
    const invalid = Object.keys(reply.fields ?? {}).some((key) => key !== 'source')
    flushSync(() => {
      setFields(invalid ? reply.fields! : {})
      setError(invalid ? '' : reply.error || OFFLINE)
      setStatus(invalid ? 'idle' : 'failed')
    })
    if (invalid) form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send(event.currentTarget)
  }

  /** Поле исправляют — его ошибка уходит сразу, не дожидаясь новой отправки. */
  function onChange(event: FormEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement
    if (name in fields) setFields((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== name)))
  }

  const retry = () => formRef.current?.requestSubmit()

  return { formRef, sentRef, status, fields, error, data, send, onSubmit, onChange, retry }
}
