import { copy } from '@/content/copy'
import { site } from '@/content/site'
import { typograf } from '@/lib/typograf'
import { Heading } from '@/components/ui/Heading'
import { Icon } from '@/components/ui/Icon'
import { Section } from '@/components/ui/Section'
import { ContactForm } from './islands'
import s from './contact/Contact.module.css'

// Владелец — агент секций B. Правила: docs/03-design-system.md, формы — docs/02-ux-structure.md, раздел 4.
// id и сцену не менять без координатора: на них завязаны якоря шапки и ритм сцен.
// Финал: заголовок и текст, форма заявки, прямые контакты. На десктопе форма справа,
// контакты — внизу левой колонки; порядок в разметке (форма, потом контакты) — как на телефоне.
export function Contact() {
  const { email, telegram } = site.contacts

  return (
    <Section id="contact" scene="dark">
      <div className={s.layout}>
        <div className={s.copy}>
          <Heading id="contact-title" accent={copy.final.accent}>
            {typograf(copy.final.title)}
          </Heading>
          <p className="mt-(--space-lead) max-w-[30ch] text-lead text-ink-2">
            {typograf(copy.final.text)}
          </p>
        </div>

        {/* id — якорь оффера «Макет за 2 дня» (site.offers.mockup.anchor): форма показывает его и шлёт в заявке. */}
        <div id="mockup" className={s.formArea}>
          <ContactForm />
        </div>

        <ul className={s.direct}>
          <li>
            <a href={`mailto:${email}`} className={s.link}>
              <Icon name="mail" className={s.linkIcon} />
              <span>{email}</span>
              <Icon name="arrow-up-right" className={s.linkArrow} />
            </a>
          </li>
          <li>
            <a href={telegram.url} target="_blank" rel="noopener" className={s.link}>
              <Icon name="send" className={s.linkIcon} />
              <span>
                Telegram {telegram.handle}
                <span className="sr-only"> (откроется в новой вкладке)</span>
              </span>
              <Icon name="arrow-up-right" className={s.linkArrow} />
            </a>
          </li>
        </ul>
      </div>
    </Section>
  )
}
