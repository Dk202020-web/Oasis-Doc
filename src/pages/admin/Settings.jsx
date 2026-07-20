import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { DEFAULT_WHATSAPP_NUMBER } from '../../lib/whatsapp'

export default function Settings() {
  const [waNumber, setWaNumber] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_number')
      .maybeSingle()
      .then(({ data }) => setWaNumber(data?.value || DEFAULT_WHATSAPP_NUMBER))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    await supabase
      .from('settings')
      .upsert({ key: 'whatsapp_number', value: waNumber })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Réglages</h1>
      <form onSubmit={handleSave} className="card max-w-md space-y-4">
        <div>
          <label className="label">
            Numéro WhatsApp pour les preuves de paiement
          </label>
          <input
            className="input"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="+237690409736"
          />
          <p className="mt-1 text-xs text-slate-500">
            Affiché sur l'écran de confirmation de commande et la page
            Contact.
          </p>
        </div>
        {saved && <p className="text-sm text-oasis-green">Enregistré ✓</p>}
        <button className="btn-primary">Enregistrer</button>
      </form>
    </div>
  )
}
