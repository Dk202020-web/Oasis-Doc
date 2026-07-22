import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useLang, pick } from '../../context/LangContext'
import StatusBadges from '../../components/StatusBadges'
import { REQUEST_STATUS_OPTIONS, getRequestStatus } from '../../lib/requestStatus'

function shortId(uuid) {
  return `#${uuid.slice(0, 6).toUpperCase()}`
}

export default function RequestsQueue() {
  const { lang } = useLang()
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase
      .from('order_items')
      .select('*, service:services(*), order:orders(order_ref, user:users(full_name, id))')
      .order('created_at', { ascending: false })
    setItems(data || [])
  }

  const filtered = items.filter((i) => {
    if (statusFilter !== 'all' && getRequestStatus(i) !== statusFilter) return false
    return true
  })

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{lang === 'en' ? 'Requests' : 'Demandes'}</h1>

      <div className="mb-4 flex gap-3">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{lang === 'en' ? 'All statuses' : 'Tous les statuts'}</option>
          {REQUEST_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {lang === 'en' ? status.labelEn : status.labelFr}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{lang === 'en' ? 'Client' : 'Client'}</th>
              <th className="px-4 py-2">{lang === 'en' ? 'Service' : 'Service'}</th>
              <th className="px-4 py-2">{lang === 'en' ? 'Order ref.' : 'Réf. commande'}</th>
              <th className="px-4 py-2">{lang === 'en' ? 'Status' : 'Statut'}</th>
              <th className="px-4 py-2">{lang === 'en' ? 'Date' : 'Date'}</th>
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
                  {new Date(item.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}
                </td>
                <td className="px-4 py-2">
                  <Link
                    to={`/admin/requests/${item.id}`}
                    className="text-oasis-blue"
                  >
                    {lang === 'en' ? 'Open →' : 'Ouvrir →'}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {lang === 'en' ? 'No requests.' : 'Aucune demande.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

