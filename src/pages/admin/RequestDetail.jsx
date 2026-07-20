import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useLang, pick } from '../../context/LangContext'
import StatusBadges from '../../components/StatusBadges'

export default function RequestDetail() {
  const { id } = useParams()
  const { lang } = useLang()
  const [item, setItem] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [files, setFiles] = useState([])
  const [deliverable, setDeliverable] = useState(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const { data: it } = await supabase
      .from('order_items')
      .select('*, service:services(*), order:orders(order_ref, user:users(full_name, email, phone))')
      .eq('id', id)
      .single()
    setItem(it)

    if (it) {
      const { data: reqs } = await supabase
        .from('service_requirements')
        .select('*')
        .eq('service_id', it.service_id)
      setRequirements(reqs || [])

      const { data: fls } = await supabase
        .from('order_item_files')
        .select('*')
        .eq('order_item_id', id)
      setFiles((fls || []).filter((f) => f.kind === 'source'))
      setDeliverable((fls || []).find((f) => f.kind === 'deliverable') || null)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function togglePaid() {
    await supabase
      .from('order_items')
      .update({ payment_status: item.payment_status === 'paid' ? 'pending' : 'paid' })
      .eq('id', id)
    load()
  }

  async function setInProgress() {
    await supabase.from('order_items').update({ work_status: 'in_progress' }).eq('id', id)
    load()
  }

  async function downloadSourceFile(path) {
    const { data } = await supabase.storage
      .from('order-source-files')
      .createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleMarkDone(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${item.order_id}/${id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from('order-deliverables')
        .upload(path, file)
      if (upErr) throw upErr
      await supabase.from('order_item_files').insert({
        order_item_id: id,
        storage_path: path,
        file_name: file.name,
        uploaded_by: 'admin',
        kind: 'deliverable'
      })
      await supabase.from('order_items').update({ work_status: 'done' }).eq('id', id)
      load()
    } catch (err) {
      console.error(err)
      alert("Échec de l'envoi du fichier.")
    } finally {
      setUploading(false)
    }
  }

  if (!item) return <div>Chargement…</div>

  function fieldLabel(reqId) {
    const req = requirements.find((r) => r.id === reqId)
    return req ? pick(req, 'label', lang) : reqId
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">
        {pick(item.service, 'name', lang)}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Commande {item.order?.order_ref} — {item.order?.user?.full_name} (
        {item.order?.user?.email})
        {item.order?.user?.phone && ` — ${item.order.user.phone}`}
      </p>

      <div className="mb-6 flex items-center gap-3">
        <StatusBadges item={item} />
        <button onClick={togglePaid} className="btn-outline !py-1 text-sm">
          {item.payment_status === 'paid' ? 'Marquer non-payé' : 'Marquer payé'}
        </button>
        {item.work_status === 'pending' && (
          <button onClick={setInProgress} className="btn-outline !py-1 text-sm">
            Démarrer le traitement
          </button>
        )}
      </div>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Informations soumises</h2>
        <div className="space-y-2 text-sm">
          {Object.entries(item.submitted_values || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-50 pb-1">
              <span className="text-slate-500">{fieldLabel(k)}</span>
              <span className="font-medium">{String(v)}</span>
            </div>
          ))}
          {Object.keys(item.submitted_values || {}).length === 0 && (
            <p className="text-slate-400">Aucune donnée texte soumise.</p>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Fichiers soumis par le client</h2>
        <div className="space-y-2 text-sm">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between">
              <span>{fieldLabel(f.requirement_id)} — {f.file_name}</span>
              <button
                onClick={() => downloadSourceFile(f.storage_path)}
                className="text-oasis-blue"
              >
                Télécharger
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-slate-400">Aucun fichier soumis.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Livraison du document final</h2>
        {deliverable ? (
          <p className="text-sm text-oasis-green">
            Déjà livré : {deliverable.file_name}
          </p>
        ) : (
          <div>
            <label className="label">
              Téléverser le document final (marque automatiquement "Terminé")
            </label>
            <input type="file" onChange={handleMarkDone} disabled={uploading} />
          </div>
        )}
      </div>
    </div>
  )
}
