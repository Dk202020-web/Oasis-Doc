import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, text } from '../context/LangContext'
import { DEFAULT_WHATSAPP_NUMBER, buildWhatsAppLink } from '../lib/whatsapp'

export default function Contact() {
  const { lang } = useLang()
  const [waNumber, setWaNumber] = useState(DEFAULT_WHATSAPP_NUMBER)

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_number')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setWaNumber(data.value)
      })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-oasis-blue to-oasis-green-dark p-6 text-white shadow-lg shadow-slate-300/40">
        <h1 className="text-2xl font-bold sm:text-3xl">{text(lang, 'Contactez-nous', 'Contact us')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
          {text(lang, 'Pour toute question, un besoin de précision ou un accompagnement avant commande, notre équipe est à votre disposition.', 'For any question, clarification, or support before placing an order, our team is here to assist you.')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-oasis-green-dark">WhatsApp</div>
          <p className="mt-3 text-sm text-slate-600">
            {text(lang, 'Envoyez-nous votre preuve de paiement ou laissez un message directement.', 'Send your payment proof or leave a message directly.')}
          </p>
          <a
            href={buildWhatsAppLink('N/A', waNumber)}
            target="_blank"
            rel="noreferrer"
            className="btn-accent mt-4 w-full"
          >
            {waNumber}
          </a>
        </div>

        <div className="card">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-oasis-blue">{text(lang, 'Suivi', 'Track')}</div>
          <p className="mt-3 text-sm text-slate-600">
            {text(lang, 'Vous pouvez aussi suivre l’état de votre commande via votre référence.', 'You can also track your order status using your reference number.')}
          </p>
          <Link to="/suivi" className="btn-outline mt-4 w-full">{text(lang, 'Accéder au suivi', 'Go to tracking')}</Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-sm font-bold text-slate-900">{text(lang, 'Réponse rapide', 'Fast response')}</div>
          <p className="mt-2 text-sm text-slate-600">{text(lang, 'Nous répondons rapidement pour vous guider dans vos démarches.', 'We reply quickly to help guide your procedures.')}</p>
        </div>
        <div className="card">
          <div className="text-sm font-bold text-slate-900">{text(lang, 'Paiement', 'Payment')}</div>
          <p className="mt-2 text-sm text-slate-600">{text(lang, 'Partagez la preuve de paiement directement sur WhatsApp.', 'Share your payment proof directly on WhatsApp.')}</p>
        </div>
        <div className="card">
          <div className="text-sm font-bold text-slate-900">{text(lang, 'Accompagnement', 'Support')}</div>
          <p className="mt-2 text-sm text-slate-600">{text(lang, 'Vous pouvez aussi consulter notre FAQ et notre page comment ça marche.', 'You can also check our FAQ and how-it-works page.')}</p>
        </div>
      </div>
    </div>
  )
}
