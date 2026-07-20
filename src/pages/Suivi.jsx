import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, pick, text } from '../context/LangContext'
import StatusBadges from '../components/StatusBadges'

export default function Suivi() {
  const { lang } = useLang()
  const [ref, setRef] = useState('')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    const normalized = ref.trim().toUpperCase()
    if (!normalized) {
      setError(text(lang, 'Veuillez saisir une référence de commande.', 'Please enter an order reference.'))
      return
    }

    setSearched(true)
    setError('')
    setOrder(null)
    setItems([])

    const { data: ord } = await supabase
      .from('orders')
      .select('*')
      .eq('order_ref', normalized)
      .maybeSingle()

    if (!ord) {
      setError(text(lang, 'Aucune commande trouvée avec cette référence.', 'No order was found with this reference.'))
      return
    }
    setOrder(ord)

    const { data: its } = await supabase
      .from('order_items')
      .select('*, service:services(*)')
      .eq('order_id', ord.id)
    setItems(its || [])
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-oasis-green-dark to-oasis-green p-6 text-white shadow-lg shadow-oasis-green/20">
        <h1 className="text-2xl font-bold sm:text-3xl">{text(lang, 'Suivre ma commande', 'Track your order')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
          {text(lang, 'Entrez la référence reçue lors de votre soumission pour consulter le statut de vos services.', 'Enter the reference received during submission to review the status of your services.')}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input"
            placeholder={text(lang, 'Référence de commande', 'Order reference')}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
          <button className="btn-primary sm:w-auto">{text(lang, 'Rechercher', 'Search')}</button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          {text(lang, 'Exemple : OD-123456-AB12CD', 'Example: OD-123456-AB12CD')}
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {order && (
        <div className="card mt-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[.16em] text-slate-500">
                {text(lang, 'Référence', 'Reference')}
              </div>
              <div className="font-mono font-semibold text-slate-900">{order.order_ref}</div>
            </div>
            <div className="text-sm text-slate-500">
              {new Date(order.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}
            </div>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-slate-800">{pick(item.service, 'name', lang)}</span>
                <StatusBadges item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {searched && !order && !error && (
        <p className="mt-4 text-sm text-slate-500">{text(lang, 'Recherche…', 'Searching…')}</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="card">
          <div className="text-sm font-bold text-oasis-green-dark">{text(lang, 'Besoin d’aide ?', 'Need help?')}</div>
          <p className="mt-2 text-sm text-slate-600">{text(lang, 'Notre équipe peut vous aider pour la référence, le paiement ou le suivi.', 'Our team can help you with your reference, payment, or tracking status.')}</p>
          <Link to="/contact" className="btn-outline mt-4 w-full">{text(lang, 'Contactez l’assistance', 'Contact support')}</Link>
        </div>
        <div className="card">
          <div className="text-sm font-bold text-oasis-blue">{text(lang, 'Avant de rechercher', 'Before you search')}</div>
          <p className="mt-2 text-sm text-slate-600">{text(lang, 'Gardez votre référence de commande prête pour un suivi immédiat.', 'Keep your order reference ready for immediate tracking.')}</p>
        </div>
      </div>
    </div>
  )
}
