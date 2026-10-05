import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useLang, pick } from '../context/LangContext'
import StatusBadges from '../components/StatusBadges'
import { getRequestStatus, isRequestDeliverableReady } from '../lib/requestStatus'

export default function MyOrders() {
  const { user } = useAuth()
  const { lang } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    let active = true
    setLoading(true)
    supabase
      .from('orders')
      .select('*, order_items(*, service:services(*), order_item_files(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        setOrders(data || [])
        setLoadError(error ? (lang === 'en' ? 'Could not load your orders. Please try again.' : 'Impossible de charger vos commandes. Réessayez.') : '')
        setLoading(false)
      })
    return () => { active = false }
  }, [user, lang])

  async function downloadDeliverable(path) {
    const { data, error } = await supabase.storage
      .from('order-deliverables')
      .createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    if (error) console.error(error)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mes commandes</h1>

      {loading && <p className="text-slate-500">{lang === 'en' ? 'Loading orders…' : 'Chargement des commandes…'}</p>}
      {loadError && <p role="alert" className="mb-4 text-sm text-red-600">{loadError}</p>}
      {!loading && !loadError && orders.length === 0 && (
        <p className="text-slate-500">Vous n'avez pas encore de commande.</p>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="break-all font-mono font-semibold">
                {order.order_ref}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="space-y-3">
              {(order.order_items || []).map((item) => {
                const deliverable = (item.order_item_files || []).find(
                  (f) => f.kind === 'deliverable'
                )
                const status = getRequestStatus(item)
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center"
                  >
                    <span>{pick(item.service, 'name', lang)}</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadges item={item} />
                      {isRequestDeliverableReady(status) && deliverable && (
                        <button
                          onClick={() =>
                            downloadDeliverable(deliverable.storage_path)
                          }
                          className="text-sm text-oasis-blue underline"
                        >
                          Télécharger
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
