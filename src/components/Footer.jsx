import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang, text } from '../context/LangContext'
import { DEFAULT_CONTACTS, buildWhatsAppLink, fetchWhatsAppContacts, getPrimaryContact } from '../lib/whatsapp'
import BrandLogo from './BrandLogo'

export default function Footer() {
  const { lang } = useLang()
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS)

  useEffect(() => {
    let mounted = true

    fetchWhatsAppContacts().then((data) => {
      if (mounted) setContacts(data)
    })

    return () => {
      mounted = false
    }
  }, [])

  const primaryContact = getPrimaryContact(contacts)

  return (
    <footer className="mt-16 bg-gradient-to-r from-oasis-green-dark via-oasis-green to-oasis-green text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <BrandLogo />
            <p className="max-w-sm text-base leading-7 text-white/90">
              {text(lang, 'Vos démarches documentaires, simplifiées avec soin.', 'Your document procedures, made simple with care.')}
            </p>
          </div>

          <div>
            <div className="mb-3 text-base font-extrabold uppercase tracking-wider text-white">{text(lang, 'Découvrir', 'Explore')}</div>
            <ul className="space-y-2 text-sm text-white">
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/services">{text(lang, 'Services', 'Services')}</Link></li>
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/comment-ca-marche">{text(lang, 'Comment ça marche', 'How it works')}</Link></li>
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/suivi">{text(lang, 'Suivi de commande', 'Track order')}</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-base font-extrabold uppercase tracking-wider text-white">{text(lang, 'Informations', 'Information')}</div>
            <ul className="space-y-2 text-sm text-white">
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/faq">FAQ</Link></li>
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/confidentialite">{text(lang, 'Confidentialité', 'Privacy')}</Link></li>
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/conditions">{text(lang, 'Conditions générales', 'Terms')}</Link></li>
              <li><Link className="!text-white transition hover:!text-white hover:underline" to="/contact">{text(lang, 'Nous contacter', 'Contact us')}</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-base font-extrabold uppercase tracking-wider text-white">{text(lang, 'Contact', 'Contact')}</div>
            <ul className="space-y-2 text-sm text-white">
              <li>{text(lang, 'Service client', 'Customer service')}</li>
              <li>{text(lang, 'Réponse rapide', 'Fast response')}</li>
              <li>{text(lang, 'Support en ligne', 'Online support')}</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              {contacts.map((contact) => (
                <a
                  key={`${contact.label}-${contact.number}`}
                  href={buildWhatsAppLink('N/A', contact.number)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-oasis-green-dark transition hover:bg-oasis-cream"
                >
                  {contact.label || text(lang, 'Contactez-nous', 'Contact us')}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} Oasis-Doc. {text(lang, 'Tous droits réservés.', 'All rights reserved.')}
      </div>
    </footer>
  )
}
