import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, pick, text } from '../context/LangContext'
import { getCategoryImageUrl } from '../lib/categoryImage'

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
  const categoryImage = useMemo(() => getCategoryImageUrl(category, 0), [category])

  useEffect(() => {
    let isActive = true

    async function load() {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!isActive) return

      setCategory(cat)

      if (!cat) return

      const { data: secs } = await supabase
        .from('service_sections')
        .select('*, services(*)')
        .eq('category_id', cat.id)
        .order('sort_order')

      if (isActive) setSections(secs || [])
    }

    load()

    return () => {
      isActive = false
    }
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
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4A37] to-[#102E22] px-5 py-6 text-white shadow-[0_12px_20px_-14px_rgba(15,23,42,.35)]">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                <DocumentIcon />
              </span>
              {pick(category, 'name', lang)}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {pick(category, 'description', lang) || text(lang, 'Explorez tous les services de cette categorie.', 'Explore every service in this category.')}
            </p>
          </div>
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 sm:h-24 sm:w-24">
            <img src={categoryImage} alt={pick(category, 'name', lang)} className="h-full w-full object-contain p-2" />
          </div>
        </div>
      </div>

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
