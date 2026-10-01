import type { Metadata } from 'next'
import { AnchorCenter } from '@/components/layout/AnchorCenter'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Cases } from '@/components/sections/Cases'
import { Contact } from '@/components/sections/Contact'
import { Difference } from '@/components/sections/Difference'
import { Faq } from '@/components/sections/Faq'
import { Get } from '@/components/sections/Get'
import { Hero } from '@/components/sections/Hero'
import { Process } from '@/components/sections/Process'
import { Quiz } from '@/components/sections/Quiz'
import { Reviews } from '@/components/sections/Reviews'
import { Team } from '@/components/sections/Team'
import { Why } from '@/components/sections/Why'
import { Reveal } from '@/motion/Reveal'

// canonical — только у главной: в корневом layout его наследовали бы 404 и прочие страницы.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Порядок секций — docs/02-ux-structure.md, ритм сцен — docs/03-design-system.md:
// тёмная → светлая → тёмная → светлая → светлая-2 → тёмная → светлая → светлая-2 → тёмная → светлая → тёмная.
export default function Home() {
  return (
    <>
      <Header overlay />
      <main id="main">
        <Hero />
        <Difference />
        <Get />
        <Quiz />
        <Process />
        <Cases />
        <Reviews />
        <Team />
        <Why />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <Reveal />
      <AnchorCenter />
    </>
  )
}
