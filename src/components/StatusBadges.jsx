import { useLang, text } from '../context/LangContext'

const paidStyles = {
  pending: 'bg-slate-100 text-slate-600',
  paid: 'bg-oasis-green-light text-oasis-green'
}
const workStyles = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-oasis-green-light text-oasis-green'
}
const workLabels = {
  pending: ['En attente', 'Pending'],
  in_progress: ['En cours', 'In progress'],
  done: ['Terminé', 'Completed']
}

export default function StatusBadges({ item }) {
  const { lang } = useLang()

  return (
    <div className="flex gap-2">
      <span className={`badge ${paidStyles[item.payment_status]}`}>
        {text(lang, item.payment_status === 'paid' ? 'Payé' : 'Non payé', item.payment_status === 'paid' ? 'Paid' : 'Unpaid')}
      </span>
      <span className={`badge ${workStyles[item.work_status]}`}>
        {workLabels[item.work_status][lang === 'en' ? 1 : 0]}
      </span>
    </div>
  )
}
