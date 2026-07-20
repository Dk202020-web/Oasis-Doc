import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useLang, pick } from '../../context/LangContext'
import StatusBadges from '../../components/StatusBadges'

function shortId(uuid) {
  return `#${uuid.slice(0, 6).toUpperCase()}`
}

export default function RequestsQueue() {
  const { lang } = useLang()
  const [items, setItems] = useState([])
  const [paidFilter, setPaidFilter] = useState('all')
  const [workFilter, setWorkFilter] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('order_items')
      .select(
        '*, service:services(*), order:orders(order_ref, user:users(full_name, id))'
      )
      .order('created_at', { ascending: false })
    setItems(data || [])
  }

  const filtered = items.filter((i) => {
    if (paidFilter !== 'all' && i.payment_status !== paidFilter) return false
    if (workFilter !== 'all' && i.work_status !== workFilter) return false
    return true
  })

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Demandes</h1>

      <div className="mb-4 flex gap-3">
        <select
          className="input w-auto"
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
        >
          <option value="all">Tous les paiements</option>
          <option value="pending">Non payé</option>
          <option value="paid">Payé</option>
        </select>
        <select
          className="input w-auto"
          value={workFilter}
          onChange={(e) => setWorkFilter(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Client</th>
              <th className="px-4 py-2">Service</th>
              <th className="px-4 py-2">Réf. commande</th>
              <th className="px-4 py-2">Statuts</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {item.order?.user?.full_name || '—'} —{' '}
                  {item.order?.user?.id && shortId(item.order.user.id)}
                </td>
                <td className="px-4 py-2">{pick(item.service, 'name', lang)}</td>
                <td className="px-4 py-2 font-mono">{item.order?.order_ref}</td>
                <td className="px-4 py-2">
                  <StatusBadges item={item} />
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-2">
                  <Link
                    to={`/admin/requests/${item.id}`}
                    className="text-oasis-blue"
                  >
                    Ouvrir →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Aucune demande.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
