import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminUsers() {
  const [invites, setInvites] = useState([])
  const [admins, setAdmins] = useState([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data: inv } = await supabase
      .from('admin_invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(inv || [])
    const { data: adm } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
    setAdmins(adm || [])
  }

  useEffect(() => { load() }, [])

  async function handleInvite(e) {
    e.preventDefault()
    setError('')
    const clean = email.trim().toLowerCase()
    if (!clean) return
    const { error } = await supabase.from('admin_invites').insert({ email: clean })
    if (error) {
      setError(error.message)
      return
    }
    setEmail('')
    load()
  }

  async function removeInvite(id) {
    await supabase.from('admin_invites').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Co-admins</h1>
      <p className="mb-6 text-sm text-slate-600">
        Ajoutez l'email d'une personne pour qu'elle devienne administrateur
        automatiquement dès son inscription (ou immédiatement si elle a déjà
        un compte). Les co-admins ont les mêmes droits que vous.
      </p>

      <form onSubmit={handleInvite} className="card mb-6 flex max-w-md gap-2">
        <input
          type="email"
          required
          className="input"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-primary">Ajouter</button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Administrateurs actuels</h2>
        <ul className="space-y-1 text-sm">
          {admins.map((a) => (
            <li key={a.id}>{a.full_name} — {a.email}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Invitations en attente</h2>
        <ul className="space-y-1 text-sm">
          {invites
            .filter((i) => !admins.some((a) => a.email?.trim().toLowerCase() === i.email?.trim().toLowerCase()))
            .map((i) => (
              <li key={i.id} className="flex items-center justify-between">
                {i.email}
                <button onClick={() => removeInvite(i.id)} className="text-red-500">
                  Retirer
                </button>
              </li>
            ))}
          {invites.length === 0 && (
            <p className="text-slate-400">Aucune invitation.</p>
          )}
        </ul>
      </div>
    </div>
  )
}
