import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useLang, pick } from '../../context/LangContext'
import StatusBadges from '../../components/StatusBadges'
import {
  REQUEST_STATUS_OPTIONS,
  getRequestStatus,
  getRequestStatusLabelForLang
} from '../../lib/requestStatus'

export default function RequestDetail() {
  const { id } = useParams()
  const { lang } = useLang()
  const [item, setItem] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [files, setFiles] = useState([])
  const [deliverable, setDeliverable] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [statusDraft, setStatusDraft] = useState('pending')

  async function load() {
    const { data: it } = await supabase
      .from('order_items')
      .select('*, service:services(*), order:orders(order_ref, user:users(full_name, email, phone))')
      .eq('id', id)
      .single()
    setItem(it)
    setStatusDraft(getRequestStatus(it))

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

  async function updateStatus() {
    const { error } = await supabase.from('order_items').update({ status: statusDraft }).eq('id', id)
    if (!error) {
      load()
      return
    }

    const fallback = (() => {
      switch (statusDraft) {
        case 'paid':
          return { payment_status: 'paid', work_status: 'pending' }
        case 'in_progress':
          return { payment_status: 'paid', work_status: 'in_progress' }
        case 'validated':
        case 'completed':
        case 'available':
          return { payment_status: 'paid', work_status: 'done' }
        case 'rejected':
          return { payment_status: 'pending', work_status: 'pending' }
        case 'pending':
        default:
          return { payment_status: 'pending', work_status: 'pending' }
      }
    })()

    const { error: fallbackError } = await supabase.from('order_items').update(fallback).eq('id', id)
    if (fallbackError) {
      console.error(fallbackError)
      alert("Impossible d'enregistrer le statut.")
      return
    }
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
      await supabase.from('order_items').update({ status: 'available' }).eq('id', id)
      load()
    } catch (err) {
      console.error(err)
      alert("Echec de l'envoi du fichier.")
    } finally {
      setUploading(false)
    }
  }

  if (!item) return <div>Chargement...</div>

  function fieldLabel(reqId) {
    const req = requirements.find((r) => r.id === reqId)
    return req ? pick(req, 'label', lang) : reqId
  }

  const currentStatus = getRequestStatus(item)

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">
        {pick(item.service, 'name', lang)}
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Commande {item.order?.order_ref} - {item.order?.user?.full_name} (
        {item.order?.user?.email})
        {item.order?.user?.phone && ` - ${item.order.user.phone}`}
      </p>

      <div className="mb-6">
        <StatusBadges item={item} variant="full" />
      </div>

      <div className="card mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Changer le statut</h2>
          <span className="text-xs text-slate-500">
            {getRequestStatusLabelForLang(currentStatus, lang)}
          </span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label">Statut actuel / Current status</label>
            <select
              className="input"
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
            >
              {REQUEST_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {lang === 'en' ? status.labelEn : status.labelFr}
                </option>
              ))}
            </select>
          </div>
          <button onClick={updateStatus} className="btn-primary sm:w-auto">
            Enregistrer le statut
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {lang === 'en'
            ? 'The request follows one status column: pending, paid, in progress, then a final state such as validated, available, completed, or rejected.'
            : 'La progression suit une seule colonne de statut: en attente, payé, en cours, puis un statut final comme validé, disponible, terminé ou rejeté.'}
        </p>
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
            <p className="text-slate-400">Aucune donnee texte soumise.</p>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Fichiers soumis par le client</h2>
        <div className="space-y-2 text-sm">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between">
              <span>{fieldLabel(f.requirement_id)} - {f.file_name}</span>
              <button
                onClick={() => downloadSourceFile(f.storage_path)}
                className="text-oasis-blue"
              >
                Telecharger
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
            Deja livre : {deliverable.file_name}
          </p>
        ) : (
          <div>
            <label className="label">
              Televerser le document final (marque automatiquement
              "Disponible")
            </label>
            <input type="file" onChange={handleMarkDone} disabled={uploading} />
          </div>
        )}
      </div>
    </div>
  )
}
