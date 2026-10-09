// Вставка микроразметки в разметку страницы. Экранирование «<» обязательно: без него строка из контента,
// содержащая «</script>», закрыла бы тег и превратила данные в исполняемый код на странице.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
