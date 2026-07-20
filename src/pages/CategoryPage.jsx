import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, pick } from '../context/LangContext'

function DocumentIcon({ className = 'h-5 w-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14 3.5V7h3M9 11h6M9 15h6" /></svg>
}

function ArrowIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.5 10h12M11 4.5 16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default function CategoryPage() {
  const { slug } = useParams()
  const { lang } = useLang()
  const [category, setCategory] = useState(null)
  const [sections, setSections] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()
      setCategory(cat)
      if (!cat) return
      const { data: secs } = await supabase
        .from('service_sections')
        .select('*, services(*)')
        .eq('category_id', cat.id)
        .order('sort_order')
      setSections(secs || [])
    }
    load()
  }, [slug])

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections
    const q = search.toLowerCase()
    return sections
      .map((s) => ({
        ...s,
        services: (s.services || []).filter(
          (sv) =>
            sv.is_active &&
            (pick(sv, 'name', lang).toLowerCase().includes(q) ||
              pick(sv, 'description', lang).toLowerCase().includes(q))
        )
      }))
      .filter((s) => s.services.length > 0)
  }, [sections, search, lang])

  if (!category) {
    return <div className="mx-auto max-w-6xl px-4 py-8">Chargement…</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 text-sm text-slate-500">
        <Link to="/services">Services</Link> {'>'} {pick(category, 'name', lang)}
      </div>
      <h1 className="mb-4 flex items-center gap-3 text-2xl font-bold">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-oasis-green-light text-oasis-green-dark"><DocumentIcon /></span> {pick(category, 'name', lang)}
      </h1>

      <input
        className="input mb-6 max-w-sm"
        placeholder="Rechercher un service…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-8">
        {filteredSections.map((section) => (
          <div key={section.id}>
            <h2 className="mb-2 text-lg font-semibold text-slate-800">
              {pick(section, 'name', lang)}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(section.services || [])
                .filter((sv) => sv.is_active)
                .map((service) => (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="card flex items-center justify-between gap-3 hover:shadow-md"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {pick(service, 'name', lang)}
                      </div>
                      <div className="text-sm text-oasis-blue">
                        {Number(service.price_xaf).toLocaleString('fr-FR')}{' '}
                        FCFA
                      </div>
                    </div>
                    <span className="text-slate-400"><ArrowIcon /></span>
                  </Link>
                ))}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && (
          <p className="text-slate-500">Aucun service trouvé.</p>
        )}
      </div>
    </div>
  )
}
