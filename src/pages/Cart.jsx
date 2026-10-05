import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang, pick } from '../context/LangContext'
import { supabase } from '../supabaseClient'

function genOrderRef() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `OD-${Date.now().toString().slice(-6)}-${rand}`
}

// Uploads a single File to the 'order-source-files' bucket and returns
// the storage path. Path is namespaced by user id so RLS storage
// policies can scope access per-customer.
async function uploadFile(userId, orderRef, file) {
  const path = `${userId}/${orderRef}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('order-source-files')
    .upload(path, file)
  if (error) throw error
  return path
}

export default function Cart() {
  const { items, removeItem, clearCart, total } = useCart()
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmitOrder() {
    if (submitting) return
    if (!user) {
      navigate('/connexion', { state: { from: '/panier' } })
      return
    }
    if (items.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      const orderRef = genOrderRef()
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: user.id, order_ref: orderRef })
        .select()
        .single()
      if (orderErr) throw orderErr

      for (const item of items) {
        const { data: orderItem, error: itemErr } = await supabase
          .from('order_items')
            .insert({
            order_id: order.id,
            service_id: item.service.id,
            price_at_order: item.service.price_xaf,
            status: 'pending',
            submitted_values: sanitizeValuesForJson(item.values)
          })
          .select()
          .single()
        if (itemErr) throw itemErr

        for (const [reqId, val] of Object.entries(item.values)) {
          const files = Array.isArray(val) ? val : val instanceof File ? [val] : []
          for (const file of files) {
            const path = await uploadFile(user.id, orderRef, file)
            await supabase.from('order_item_files').insert({
              order_item_id: orderItem.id,
              requirement_id: reqId,
              storage_path: path,
              file_name: file.name,
              uploaded_by: 'user',
              kind: 'source'
            })
          }
        }
      }

      const { error: notifyError } = await supabase.functions.invoke('submit-order', {
        body: { event: 'new_order', orderId: order.id }
      })
      if (notifyError) console.error('Order saved, but admin email notification failed:', notifyError)

      clearCart()
      navigate('/confirmation', { state: { orderRef } })
    } catch (e) {
      console.error(e)
      setError(
        "Une erreur est survenue lors de l'envoi de votre commande. Réessayez."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Panier</h1>

      {items.length === 0 ? (
        <div className="card text-center text-slate-500">
          Votre panier est vide.{' '}
          <Link to="/services" className="text-oasis-blue">
            Parcourir les services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.cartId} className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 break-words">
                <div className="font-semibold">
                  {pick(item.service, 'name', lang)}
                </div>
                <div className="text-sm text-oasis-blue">
                  {Number(item.service.price_xaf).toLocaleString('fr-FR')} FCFA
                </div>
              </div>
              <button
                onClick={() => removeItem(item.cartId)}
                className="text-sm text-red-500"
              >
                Retirer
              </button>
            </div>
          ))}

          <div className="card flex items-center justify-between gap-3 bg-oasis-green-light">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-oasis-blue">
              {total.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="btn-accent w-full"
          >
            {submitting ? 'Envoi en cours…' : 'Soumettre la commande'}
          </button>
        </div>
      )}
    </div>
  )
}

// submitted_values must be JSON-safe — strip out File/File[] objects,
// keeping only text/date answers. Files are tracked separately in
// order_item_files (see loop above) with a reference to requirement_id.
function sanitizeValuesForJson(values) {
  const out = {}
  for (const [k, v] of Object.entries(values)) {
    if (v instanceof File || (Array.isArray(v) && v[0] instanceof File)) continue
    out[k] = v
  }
  return out
}
