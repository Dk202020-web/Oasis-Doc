import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, pick, text } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import RequirementField from '../components/RequirementField'

function DocumentIcon({ className = 'h-6 w-6' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V7h3M9 11h6M9 15h6" /></svg>
}

function CartIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 4.5h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.5l1.2-6.4H7" /><circle cx="9.5" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>
}

export default function ServiceDetail() {
  const { id } = useParams()
  const { lang } = useLang()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const [service, setService] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setLoadError(false)
      const { data: sv, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()
      if (!active) return
      if (serviceError || !sv) {
        setService(null)
        setLoadError(true)
        setLoading(false)
        return
      }
      setService(sv)
      const { data: reqs, error: requirementsError } = await supabase
        .from('service_requirements')
        .select('*')
        .eq('service_id', id)
        .order('sort_order')
      if (!active) return
      setRequirements(reqs || [])
      setLoadError(Boolean(requirementsError))
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [id])

  function setValue(reqId, val) {
    setValues((prev) => ({ ...prev, [reqId]: val }))
  }

  function validate() {
    for (const req of requirements) {
      if (req.is_required) {
        const v = values[req.id]
        const empty =
          v === undefined ||
          v === null ||
          v === '' ||
          (Array.isArray(v) && v.length === 0)
        if (empty) {
          setError(`Le champ "${pick(req, 'label', lang)}" est obligatoire.`)
          return false
        }
      }
    }
    setError('')
    return true
  }

  function requireAuth() {
    if (user) return true
    navigate('/connexion', { state: { from: location.pathname } })
    return false
  }

  function handleAddAndContinue() {
    if (!service) return
    if (!requireAuth()) return
    if (!validate()) return
    addItem(service, values)
    navigate('/services')
  }

  function handleAddAndCheckout() {
    if (!service) return
    if (!requireAuth()) return
    if (!validate()) return
    addItem(service, values)
    navigate('/panier')
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-8">Chargement…</div>
  }
  if (!service || loadError) {
    return <div className="mx-auto max-w-3xl px-4 py-8"><div role="alert" className="card text-center text-slate-600">{text(lang, 'Ce service est indisponible pour le moment. Réessayez plus tard.', 'This service is currently unavailable. Please try again later.')}<Link to="/services" className="mt-4 inline-flex">{text(lang, 'Voir les services', 'Browse services')}</Link></div></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card mb-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-oasis-green-light text-oasis-green-dark"><DocumentIcon /></div>
        <h1 className="text-2xl font-bold">{pick(service, 'name', lang)}</h1>
        <p className="mt-2 text-slate-600">
          {pick(service, 'description', lang)}
        </p>
        <div className="mt-4 flex gap-8">
          <div>
            <div className="text-xs uppercase text-slate-500">
              Tarif estimé
            </div>
            <div className="text-xl font-bold text-oasis-blue">
              {Number(service.price_xaf).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 rounded-2xl border border-oasis-blue/20 bg-oasis-blue-light/50 p-4 text-sm text-slate-700">
          <div className="font-bold text-oasis-blue">{text(lang, 'Demande de service', 'Service request')}</div>
          <p className="mt-1 leading-6">
            {text(lang, 'Pour soumettre une demande, vous devez d’abord créer un compte puis vous connecter.', 'To submit a request, you must first create an account and sign in.')}
          </p>
        </div>

        <h2 className="mb-4 text-lg font-semibold">Documents à fournir</h2>
        <div className="space-y-4">
          {requirements.map((req) => (
            <RequirementField
              key={req.id}
              requirement={req}
              value={values[req.id]}
              onChange={(v) => setValue(req.id, v)}
            />
          ))}
          {requirements.length === 0 && (
            <p className="text-sm text-slate-500">
              Aucune information supplémentaire requise pour ce service.
            </p>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button onClick={handleAddAndContinue} className="btn-primary flex-1">
            <CartIcon /> {text(lang, 'Enregistrer et ajouter un autre service', 'Save and add another service')}
          </button>
          <button onClick={handleAddAndCheckout} className="btn-accent flex-1">
            {text(lang, 'Commander directement', 'Order directly')}
          </button>
        </div>

        {!user && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>{text(lang, 'Vous n’êtes pas connecté.', 'You are not signed in.')}</span>
            <div className="flex gap-2">
              <Link to="/connexion" className="btn-outline !px-3 !py-1.5 text-sm">{text(lang, 'Connexion', 'Sign in')}</Link>
              <Link to="/inscription" className="btn-primary !px-3 !py-1.5 text-sm">{text(lang, 'Créer un compte', 'Create account')}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
