import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, text } from '../context/LangContext'

const formatXaf = (amount) => `${Number(amount).toLocaleString('fr-FR')} FCFA`

export default function MyDiplomaQuotes() {
  const { lang } = useLang()
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    const { data, error: queryError } = await supabase.from('credential_price_quotes')
      .select('*').order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else { setError(''); setQuotes(data || []) }
  }, [])

  useEffect(() => { load() }, [load])

  async function respond(quoteId, accept) {
    setBusyId(quoteId)
    const { error: rpcError } = await supabase.rpc('respond_to_credential_price', {
      p_quote_id: quoteId,
      p_accept: accept
    })
    setBusyId('')
    if (rpcError) setError(rpcError.message)
    else load()
  }

  return <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold">{text(lang, 'Mes devis d’équivalence', 'My diploma quotes')}</h1><p className="mt-2 text-slate-600">{text(lang, 'Le prix affiché est calculé automatiquement et reste fixe après l’envoi des documents.', 'The displayed price is calculated automatically and stays fixed after you submit your documents.')}</p></div>
      <Link to="/equivalence-diplome" className="btn-primary">{text(lang, 'Nouvelle demande d’équivalence', 'New equivalence request')}</Link>
    </div>
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    <div className="space-y-4">
      {quotes.map((quote) => {
        const finalPrice = quote.final_xaf
        const awaiting = quote.status === 'awaiting_acceptance'
        const explanation = quote.final_explanation?.[lang] || quote.final_explanation?.fr || ''
        return <article key={quote.id} className="card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{new Date(quote.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-CA')}</p><h2 className="mt-1 font-bold">{quote.inputs?.purpose || text(lang, 'Évaluation générale', 'General evaluation')} · {quote.credential_count} {text(lang, 'diplôme(s)', 'credential(s)')}</h2></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{text(lang, quote.status === 'estimated' ? 'Estimation' : quote.status === 'submitted' ? 'Documents transmis · traitement à venir' : quote.status === 'awaiting_acceptance' ? 'Votre accord requis' : quote.status === 'accepted' ? 'Accepté' : 'Refusé', quote.status.replaceAll('_', ' '))}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{text(lang, 'Estimation initiale', 'Initial estimate')}</p><p className="mt-1 text-lg font-bold">{formatXaf(quote.estimate_xaf)}</p></div>
            {finalPrice !== null && <div className={`rounded-xl p-3 ${awaiting ? 'bg-amber-50' : 'bg-oasis-blue-light'}`}><p className="text-xs text-slate-500">{text(lang, 'Prix final', 'Final price')}</p><p className="mt-1 text-lg font-bold">{formatXaf(finalPrice)}</p></div>}
          </div>
          {quote.documents?.length > 0 && <p className="mt-3 text-xs text-slate-500">{text(lang, 'Documents transmis : ', 'Documents submitted: ')}{quote.documents.map((document) => document.file_name).join(', ')}</p>}
          {explanation && <p className="mt-3 text-sm leading-6 text-slate-600">{explanation}</p>}
          {awaiting && <div className="mt-4 flex flex-wrap gap-2"><button disabled={busyId === quote.id} onClick={() => respond(quote.id, true)} className="btn-primary">{text(lang, 'Accepter le nouveau prix', 'Accept revised price')}</button><button disabled={busyId === quote.id} onClick={() => respond(quote.id, false)} className="btn-outline">{text(lang, 'Refuser et annuler', 'Decline and cancel')}</button></div>}
          {quote.status === 'declined' && <p className="mt-3 text-sm text-slate-500">{text(lang, 'Le traitement ne continuera pas avec ce prix.', 'Processing will not continue at this price.')}</p>}
        </article>
      })}
      {quotes.length === 0 && !error && <div className="card text-center text-slate-500">{text(lang, 'Aucun devis enregistré.', 'No saved quotes yet.')}</div>}
    </div>
  </div>
}
