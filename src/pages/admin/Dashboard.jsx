import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { getRequestStatus, isRequestDeliverableReady } from '../../lib/requestStatus'

export default function Dashboard() {
  const [counts, setCounts] = useState({
    pending: 0,
    paid: 0,
    in_progress: 0,
    final: 0,
    rejected: 0
  })
  const [diplomaRequests, setDiplomaRequests] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('status, payment_status, work_status')
      const { count } = await supabase.from('credential_price_quotes').select('id', { count: 'exact', head: true })
      setDiplomaRequests(count || 0)
      const next = { pending: 0, paid: 0, in_progress: 0, final: 0, rejected: 0 }
      for (const row of data || []) {
        const status = getRequestStatus(row)
        if (status === 'pending') next.pending++
        else if (status === 'paid') next.paid++
        else if (status === 'in_progress') next.in_progress++
        else if (status === 'rejected') next.rejected++
        else if (isRequestDeliverableReady(status) || ['validated', 'completed', 'available'].includes(status)) next.final++
      }
      setCounts(next)
    }
    load()
  }, [])

  const cards = [
    { label: 'En attente / Pending', value: counts.pending, color: 'text-slate-600' },
    { label: 'Paye / Paid', value: counts.paid, color: 'text-oasis-green' },
    { label: 'En cours / In progress', value: counts.in_progress, color: 'text-amber-600' },
    { label: 'Finalise / Finalized', value: counts.final, color: 'text-oasis-blue' },
    { label: 'Rejete / Rejected', value: counts.rejected, color: 'text-rose-600' }
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
            <div className="mt-1 text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>
      <Link to="/admin/equivalences" className="card mt-4 flex items-center justify-between gap-4 transition hover:ring-2 hover:ring-oasis-blue/20">
        <div><p className="text-sm font-semibold text-slate-600">Demandes d’équivalence de diplômes</p><p className="mt-1 text-xs text-slate-500">Suivre les dossiers, les documents et les tarifs calculés automatiquement</p></div>
        <span className="text-2xl font-extrabold text-oasis-blue">{diplomaRequests}</span>
      </Link>
    </div>
  )
}
