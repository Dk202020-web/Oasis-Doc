import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { buildWhatsAppLink, DEFAULT_CONTACTS, fetchWhatsAppContacts, getPrimaryContact } from '../lib/whatsapp'

function CheckIcon() {
  return <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.8-5" /></svg>
}

export default function OrderConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const orderRef = location.state?.orderRef
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS)

  useEffect(() => {
    if (!orderRef) {
      navigate('/', { replace: true })
      return
    }

    let mounted = true

    fetchWhatsAppContacts().then((data) => {
      if (mounted) setContacts(data)
    })

    return () => {
      mounted = false
    }
  }, [orderRef, navigate])

  const primaryContact = getPrimaryContact(contacts)

  if (!orderRef) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="card">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-oasis-green-light text-oasis-green-dark"><CheckIcon /></div>
        <h1 className="text-xl font-bold">
          Votre demande a ete recu et est en attente / Your request has been received and is pending
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Reference de commande / Order reference :{' '}
          <span className="font-mono font-semibold text-oasis-blue">
            {orderRef}
          </span>
        </p>

        <div className="mt-6 rounded-lg bg-oasis-green-light p-4 text-left text-sm text-slate-700">
          <p className="font-semibold">Prochaines etapes / Next steps</p>
          <p className="mt-1">
            Effectuez le paiement par Mobile Money, puis envoyez la preuve sur
            WhatsApp au numero <span className="font-semibold">{primaryContact.number}</span>.
            Votre demande suivra ensuite la sequence: en attente, paye, en cours,
            puis un statut final comme disponible, valide, termine ou rejete.
          </p>
        </div>

        <a
          href={buildWhatsAppLink(orderRef, primaryContact.number)}
          target="_blank"
          rel="noreferrer"
          className="btn-accent mt-6 w-full"
        >
          Continuer sur WhatsApp
        </a>

        <Link to="/mes-commandes" className="mt-3 block text-sm text-oasis-blue">
          Voir mes commandes
        </Link>
      </div>
    </div>
  )
}

