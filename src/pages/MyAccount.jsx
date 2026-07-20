import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../supabaseClient'

export default function MyAccount() {
  const { profile, refreshProfile } = useAuth()
  const { lang, setLang } = useLang()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saved, setSaved] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    await supabase
      .from('users')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id)
    await refreshProfile()
    setSaved(true)
  }

  if (!profile) return <div className="mx-auto max-w-lg px-4 py-8">Chargement…</div>

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mon compte</h1>
      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="label">Nom complet</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50" value={profile.email} disabled />
        </div>
        <div>
          <label className="label">Langue préférée</label>
          <select
            className="input"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        {saved && <p className="text-sm text-oasis-green">Enregistré ✓</p>}
        <button className="btn-primary w-full">Enregistrer</button>
      </form>
    </div>
  )
}
