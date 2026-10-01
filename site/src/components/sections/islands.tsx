'use client'

import { island } from '@/lib/island'
// Стили форм — в CSS страницы сразу: разметку форм сервер отдаёт в HTML, а их код приходит позже (lib/island.tsx).
import './quiz/Quiz.module.css'
import './contact/Lead.module.css'
import './partner/Partner.module.css'

// Квиз, финальная форма и анкета партнёра — острова: код (поля, шаги, отправка, сводка) грузится, когда форма подошла к экрану.
export const QuizForm = island(() => import('./quiz/QuizForm').then((m) => m.QuizForm))
export const ContactForm = island(() => import('./contact/ContactForm').then((m) => m.ContactForm))
export const PartnerForm = island(() => import('./partner/PartnerForm').then((m) => m.PartnerForm))
