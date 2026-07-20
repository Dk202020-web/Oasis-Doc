import { Link } from 'react-router-dom'
import { useLang, text } from '../context/LangContext'

function Arrow() {
  return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h12M11 4.5 16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Icon({ name, className = 'h-6 w-6' }) {
  const props = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }
  if (name === 'shield') return <svg {...props}><path d="M12 3 19 6v5c0 4.6-2.9 8.5-7 10-4.1-1.5-7-5.4-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'clock') return <svg {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></svg>
  if (name === 'document') return <svg {...props}><path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V7h3M9 11h6M9 15h6" /></svg>
  if (name === 'support') return <svg {...props}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5V13Zm16 0h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13Z" /><path d="M17 18c0 1.5-1.6 2.5-4 2.5" /></svg>
  return <svg {...props}><path d="M5 14v5a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-5" /><path d="M12 16V4m0 0L8 8m4-4 4 4" /></svg>
}

const benefits = [
  ['document', 'Commande en ligne', 'Online request', 'Simple et rapide', 'Simple and quick'],
  ['shield', 'Paiement sécurisé', 'Secure payment', 'Mobile Money ou transfert', 'Mobile Money or transfer'],
  ['clock', 'Traitement suivi', 'Tracked processing', 'Une visibilité à chaque étape', 'Visibility at every step'],
  ['support', 'Assistance dédiée', 'Dedicated support', 'Nous restons à votre écoute', 'We are here to help']
]

export default function Home() {
  const { lang } = useLang()

  return <div className="home-page overflow-hidden bg-[#fcfdfc]">
    <section className="relative mx-auto max-w-7xl px-4 pb-7 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[.96fr_1.04fr] lg:gap-8">
        <div className="relative z-10 max-w-xl">
          <p className="home-eyebrow"><span />{text(lang, 'Service officiel & sécurisé', 'Official & secure service')}</p>
          <h1 className="mt-5 text-[2.75rem] font-bold leading-[.98] tracking-[-.045em] text-[#132131] sm:text-6xl lg:text-[4.7rem]">
            {text(lang, 'Vos documents officiels, ', 'Your official documents, ')}<em className="font-bold text-oasis-green-dark">{text(lang, 'sans déplacement.', 'without the travel.')}</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-600">{text(lang, 'Obtenez, légalisez et traduisez vos documents en toute simplicité. Un service fiable, accessible et pensé pour vous.', 'Request, legalize and translate your documents with ease. A reliable, accessible service designed for you.')}</p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            <Link to="/services/obtention" className="home-action home-action--primary"><span className="home-action__icon"><Icon name="document" /></span><span>{text(lang, 'Obtenir un document officiel', 'Request an official document')}</span><Arrow /></Link>
            <Link to="/services/legalisation" className="home-action"><span className="home-action__icon"><Icon name="shield" /></span><span>{text(lang, 'Légaliser mes documents', 'Legalize my documents')}</span><Arrow /></Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl pb-8 lg:pb-0">
          <div className="hero-dots" />
          <div className="hero-orb" />
          <div className="hero-photo-frame">
            <div className="hero-photo-fallback"><div className="hero-fallback-document"><span>OASIS</span><strong>{text(lang, 'Dossier documentaire', 'Document file')}</strong><i /></div></div>
            <img className="hero-person-photo" src="/hero-person.jpg" alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} />
          </div>
          <div className="hero-badges">
            <div className="hero-badge"><span><Icon name="shield" /></span><b>{text(lang, '100 % sécurisé', '100% secure')}</b></div>
            <div className="hero-badge"><span><Icon name="clock" /></span><b>{text(lang, 'Rapide & fiable', 'Fast & reliable')}</b></div>
            <div className="hero-badge"><span><Icon name="document" /></span><b>{text(lang, 'Service suivi', 'Tracked service')}</b></div>
          </div>
        </div>
      </div>
    </section>

    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="home-benefits">{benefits.map(([icon, frTitle, enTitle, frText, enText]) => <div className="home-benefit" key={frTitle}><span className="home-benefit__icon"><Icon name={icon} /></span><div><h2>{text(lang, frTitle, enTitle)}</h2><p>{text(lang, frText, enText)}</p></div></div>)}</div></section>

    <section className="mx-auto mt-5 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"><div className="home-assurance"><div className="flex items-center gap-3"><span className="home-assurance__flag" /><div><strong>{text(lang, 'Un service pensé pour vos démarches au Cameroun', 'A service built for your procedures in Cameroon')}</strong><p>{text(lang, 'Paiement et accompagnement adaptés à votre réalité.', 'Payment and support adapted to your needs.')}</p></div></div><div className="home-assurance__right"><span>{text(lang, 'Paiement sécurisé avec', 'Secure payment with')}</span><b>Mobile Money</b><b>Orange Money</b></div></div></section>
  </div>
}
