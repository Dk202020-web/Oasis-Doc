import { Link } from 'react-router-dom'
import { useLang, text } from '../context/LangContext'
import { DEFAULT_WHATSAPP_NUMBER } from '../lib/whatsapp'

function StepIcon({ type }) {
  const props = { className: 'h-8 w-8', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }
  if (type === 'pay') return <svg {...props}><rect x="5" y="4" width="10" height="16" rx="1.5" /><path d="M8 17h4M18 8v10M16 10h4M16 14h4" /></svg>
  if (type === 'receive') return <svg {...props}><path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V7h3M9 11h6M9 15h4" /></svg>
  return <svg {...props}><path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V7h3M9 12h3M9 16h2" /><path d="m15.5 11.5 2 2-4 4-2.2.4.4-2.2 4-4Z" /></svg>
}

function CardIcon() {
  return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M3.5 10h17M7 15h3" /></svg>
}

const steps = [
  { number: '1', icon: 'request', titleFr: 'Faites votre demande en ligne', titleEn: 'Place your request online', bodyFr: 'Choisissez votre service, renseignez les informations demandées et joignez vos documents en quelques minutes.', bodyEn: 'Choose your service, fill in the requested information, and attach your documents in just a few minutes.', color: 'forest' },
  { number: '2', icon: 'pay', titleFr: 'Payez le prix de votre service', titleEn: 'Pay for your service', bodyFr: `Réglez par l’un de nos moyens de paiement, puis envoyez la preuve de paiement sur WhatsApp au ${DEFAULT_WHATSAPP_NUMBER}.`, bodyEn: `Pay using your preferred method, then send the payment proof on WhatsApp to ${DEFAULT_WHATSAPP_NUMBER}.`, color: 'gold' },
  { number: '3', icon: 'receive', titleFr: 'Recevez votre document', titleEn: 'Receive your document', bodyFr: 'Suivez votre demande en ligne et recevez votre document dès que son traitement est terminé.', bodyEn: 'Track your request online and receive your document as soon as processing is completed.', color: 'sage' }
]

export default function HowItWorks() {
  const { lang } = useLang()

  return <div className="how-page bg-oasis-bg py-12 sm:py-16">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#e4e8df] bg-white px-5 py-12 shadow-[0_18px_50px_-40px_rgba(16,46,34,.48)] sm:px-8 lg:px-12 lg:py-16">
        <header className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-oasis-green">Oasis-Doc</p><h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-oasis-charcoal sm:text-5xl">{text(lang, 'Comment ça marche ?', 'How it works?')}</h1><div className="mx-auto mt-5 flex w-14 items-center gap-1"><span className="h-1 flex-1 rounded-full bg-oasis-green" /><span className="h-1.5 w-1.5 rounded-full bg-oasis-green" /></div><p className="mt-6 text-lg text-slate-600">{text(lang, 'Un service en 3 étapes simples, rapide et sécurisé.', 'A simple, fast and secure 3-step service.')}</p></header>

        <div className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-7"><div className="how-connector how-connector--one" /><div className="how-connector how-connector--two" />{steps.map((step) => <article className="how-step-card" key={step.number}><div className={`how-step-icon how-step-icon--${step.color}`}><StepIcon type={step.icon} /></div><div className={`how-step-number how-step-number--${step.color}`}>{step.number}</div><h2>{text(lang, step.titleFr, step.titleEn)}</h2><p>{text(lang, step.bodyFr, step.bodyEn)}</p></article>)}</div>

        <div className="mt-10 text-center"><Link to="/services" className="btn-accent min-w-56 !rounded-lg !px-6 !py-3.5">{text(lang, 'Commencer ma demande', 'Start my request')} <span aria-hidden="true">→</span></Link></div>

        <section className="mt-16 border-t border-[#e6ebe2] pt-12"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-oasis-green">{text(lang, 'Paiement', 'Payment')}</p><h2 className="mt-3 text-3xl font-bold text-oasis-charcoal">{text(lang, 'Nos moyens de paiement', 'Our payment methods')}</h2><p className="mt-3 text-slate-600">{text(lang, 'Choisissez le moyen de paiement qui vous convient le mieux.', 'Choose the payment method that suits you best.')}</p></div><div className="payment-methods mt-8"><div className="payment-method"><img src="/payment-logos/mtn.svg" alt="MTN Mobile Money" /><span>MTN Mobile Money</span></div><div className="payment-method"><img src="/payment-logos/orange-money.svg" alt="Orange Money" /><span>Orange Money</span></div><div className="payment-method"><img src="/payment-logos/mastercard.svg" alt="Mastercard" /><span>Mastercard</span></div><div className="payment-method"><img src="/payment-logos/visa.svg" alt="Visa Card" /><span>Visa Card</span></div><div className="payment-method payment-method--prepaid"><CardIcon /><span>{text(lang, 'Cartes prépayées', 'Prepaid cards')}</span></div></div></section>
      </section>
    </div>
  </div>
}
