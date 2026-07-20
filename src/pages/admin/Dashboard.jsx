import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function Dashboard() {
  const [counts, setCounts] = useState({
    pending: 0,
    paid: 0,
    in_progress: 0,
    done: 0
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('order_items')
        .select('payment_status, work_status')
      const next = { pending: 0, paid: 0, in_progress: 0, done: 0 }
      for (const row of data || []) {
        if (row.payment_status === 'pending') next.pending++
        if (row.payment_status === 'paid') next.paid++
        if (row.work_status === 'in_progress') next.in_progress++
        if (row.work_status === 'done') next.done++
      }
      setCounts(next)
    }
    load()
  }, [])

  const cards = [
    { label: 'En attente de paiement', value: counts.pending, color: 'text-slate-600' },
    { label: 'Payées', value: counts.paid, color: 'text-oasis-green' },
    { label: 'En cours', value: counts.in_progress, color: 'text-amber-600' },
    { label: 'Terminées', value: counts.done, color: 'text-oasis-blue' }
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
            <div className="mt-1 text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
