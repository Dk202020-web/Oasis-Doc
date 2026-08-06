import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../supabaseClient'

export default function MyAccount() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const { lang, setLang } = useLang()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saved, setSaved] = useState(false)
  const profileId = profile?.id || user?.id
  const email = profile?.email || user?.email || ''

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
    setSaved(false)
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    if (!profileId) return

    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, phone })
      .eq('id', profileId)

    if (error) {
      console.error(error)
      return
    }

    await refreshProfile()
    setSaved(true)
  }

  if (loading) return <div className="mx-auto max-w-lg px-4 py-8">Chargementâ€¦</div>
  if (!profileId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 text-sm text-red-600">
        Impossible de charger votre profil.
      </div>
    )
  }

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
          <label className="label">TÃ©lÃ©phone</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input bg-slate-50" value={email} disabled />
        </div>
        <div>
          <label className="label">Langue prÃ©fÃ©rÃ©e</label>
          <select
            className="input"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="fr">FranÃ§ais</option>
            <option value="en">English</option>
          </select>
        </div>
        {saved && <p className="text-sm text-oasis-green">EnregistrÃ© âœ“</p>}
        <button className="btn-primary w-full">Enregistrer</button>
      </form>
    </div>
  )
}
