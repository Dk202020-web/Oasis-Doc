import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const formatXaf = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`

export default function DiplomaRequests() {
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: queryError } = await supabase
        .from('credential_price_quotes')
        .select('*, customer:users!credential_price_quotes_user_id_fkey(full_name,email)')
        .order('created_at', { ascending: false })
      if (!active) return
      if (queryError) {
        setError(queryError.message)
        return
      }
      const result = await Promise.all((data || []).map(async (quote) => {
        const documents = await Promise.all((quote.documents || []).map(async (document) => {
          const { data: signed } = await supabase.storage
            .from('order-source-files').createSignedUrl(document.storage_path, 600)
          return { ...document, url: signed?.signedUrl || '' }
        }))
        return { ...quote, documents }
      }))
      if (active) setQuotes(result)
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Demandes d’équivalence de diplômes</h1>
      <p className="mb-5 max-w-3xl text-sm leading-6 text-slate-600">
        Les estimations et tarifs finaux sont calculés automatiquement à partir du parcours et du nombre de diplômes. Cette vue permet de suivre les demandes et d’accéder aux documents transmis.
      </p>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-4">
        {quotes.map((quote) => (
          <article key={quote.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{quote.customer?.full_name || quote.customer?.email || quote.user_id.slice(0, 8)}</h2>
                <p className="mt-1 text-xs text-slate-500">{new Date(quote.created_at).toLocaleString('fr-FR')} · {quote.inputs?.source_country || 'CM'} → {quote.inputs?.destination_country || 'CA'}</p>
              </div>
              <span className="rounded-full bg-oasis-green-light px-3 py-1 text-xs font-semibold text-oasis-green-dark">{quote.status === 'submitted' ? 'Documents transmis · à traiter' : quote.status}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Objectif</p><p className="mt-1 font-semibold">{quote.inputs?.purpose || '—'}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Diplômes</p><p className="mt-1 font-semibold">{quote.credential_count}</p></div>
              <div className="rounded-xl bg-oasis-blue-light p-3"><p className="text-xs text-slate-500">Prix calculé</p><p className="mt-1 font-semibold">{formatXaf(quote.final_xaf ?? quote.estimate_xaf)}</p></div>
            </div>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-semibold text-oasis-blue">Voir les informations du parcours et les documents</summary>
              <pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(quote.inputs, null, 2)}</pre>
              <div className="mt-3 flex flex-wrap gap-2">
                {quote.documents.map((document) => document.url && <a key={document.storage_path} href={document.url} target="_blank" rel="noreferrer" className="btn-outline !px-3 !py-1.5 text-sm">{document.file_name || document.kind}</a>)}
                {quote.documents.length === 0 && <span className="text-slate-500">Documents en attente du client.</span>}
              </div>
            </details>
          </article>
        ))}
        {quotes.length === 0 && !error && <div className="card text-center text-slate-500">Aucune demande d’équivalence pour le moment.</div>}
      </div>
    </div>
  )
}
