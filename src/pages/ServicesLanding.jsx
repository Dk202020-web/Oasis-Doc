import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useLang, pick, text } from '../context/LangContext'
import { getCategoryImageUrl } from '../lib/categoryImage'

const cardThemes = [
  { top: 'from-[#1F4A37] to-[#102E22]', button: 'bg-[#1F4A37] hover:bg-[#102E22]', accent: 'text-[#1F4A37]' },
  { top: 'from-[#3D7A59] to-[#1F4A37]', button: 'bg-[#2E6A4B] hover:bg-[#163E2D]', accent: 'text-[#2E6A4B]' },
  { top: 'from-[#A9C9AF] to-[#4F8361]', button: 'bg-[#4F8361] hover:bg-[#2E6A4B]', accent: 'text-[#2E6A4B]' }
]

function Arrow() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 10h12M11 4.5 16.5 10 11 15.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocumentIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3.5h7l3 3V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M14 3.5V7h3M9 11h6M9 15h6" />
    </svg>
  )
}

function HeadsetIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5V13Zm16 0h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13Z" />
      <path d="M17 18c0 1.5-1.6 2.5-4 2.5" />
    </svg>
  )
}

export default function ServicesLanding() {
  const { lang } = useLang()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let isActive = true

    supabase
      .from('categories')
      .select('*, service_sections(*, services(*))')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (isActive) setCategories(data || [])
      })

    return () => {
      isActive = false
    }
  }, [])

  const processedCategories = useMemo(() => {
    return categories.map((category, index) => {
      const theme = cardThemes[index % cardThemes.length]
      const services =
        category.service_sections?.flatMap((section) => section.services || []).filter((service) => service.is_active) || []
      const description = category.slug === 'equivalence-diplome'
        ? text(lang, 'Analyse et orientation des diplômes pour le Canada', 'Credential analysis and guidance for Canada')
        : index === 0
          ? text(lang, 'Certification de documents existants', 'Certification of existing documents')
          : index === 1
            ? text(lang, 'Obtention de documents officiels', 'Official document requests')
            : text(lang, 'Traduction certifiée de documents', 'Certified document translation')
      const imageUrl = getCategoryImageUrl(category, index)

      return { category, theme, services, description, imageUrl }
    })
  }, [categories, lang])

  const featuredService = useMemo(() => {
    const preferred = categories.find((category) => category.slug === 'obtention')
    const source = preferred || categories[0]
    return source?.service_sections?.flatMap((section) => section.services || []).find((service) => service.is_active) || null
  }, [categories])

  return (
    <div className="bg-oasis-bg pb-20 pt-12 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-11 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-oasis-green-dark">Oasis-Doc</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.04em] text-slate-900 sm:text-4xl">
            {text(lang, 'Vos démarches, organisées simplement.', 'Your requests, simply organized.')}
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            {text(
              lang,
              'Choisissez une catégorie, consultez les services disponibles et démarrez votre demande en ligne.',
              'Choose a category, explore the available services, and start your request online.'
            )}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {processedCategories.map(({ category, theme, services, description, imageUrl }) => (
            <article
              key={category.id}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_20px_-14px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80"
            >
              <div className={`min-h-32 bg-gradient-to-br ${theme.top} px-5 py-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-extrabold tracking-[-.025em]">
                      {pick(category, 'name', lang)}
                    </h2>
                    <p className="mt-1.5 text-sm text-white/90">{description}</p>
                    <p className="mt-3 text-xs font-semibold text-white/85">
                      {services.length || '—'} {text(lang, 'services disponibles', 'services available')}
                    </p>
                  </div>
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 sm:h-24 sm:w-24">
                    <img
                      src={imageUrl}
                      alt={pick(category, 'name', lang)}
                      className="h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-500">
                  {text(lang, 'Services populaires', 'Popular services')}
                </p>
                <div className="mt-3 min-h-20 space-y-2.5">
                  {services.slice(0, 3).map((service) => (
                    <Link className="group flex items-start justify-between gap-3 text-sm" key={service.id} to={category.slug === 'equivalence-diplome' ? '/equivalence-diplome' : `/service/${service.id}`}>
                      <span className="flex min-w-0 items-start gap-2 text-slate-700">
                        <DocumentIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span className="line-clamp-1 group-hover:text-slate-950">
                          {pick(service, 'name', lang)}
                        </span>
                      </span>
                      <span className={`shrink-0 text-xs font-extrabold ${theme.accent}`}>
                        {category.slug === 'equivalence-diplome'
                          ? text(lang, 'Selon le parcours', 'Pathway-based pricing')
                          : `${Number(service.price_xaf).toLocaleString('fr-FR')} FCFA`}
                      </span>
                    </Link>
                  ))}
                  {services.length === 0 && (
                    <p className="text-sm text-slate-400">
                      {text(lang, 'Services bientot disponibles.', 'Services coming soon.')}
                    </p>
                  )}
                </div>
                <Link
                  to={`/services/${category.slug}`}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold text-white transition ${theme.button}`}
                >
                  {text(lang, 'Voir tous les services', 'View all services')}
                  <Arrow />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {featuredService && (
          <section className="mt-12 flex flex-col gap-5 rounded-2xl border border-oasis-sage bg-white p-6 shadow-[0_12px_20px_-18px_rgba(16,46,34,.3)] sm:flex-row sm:items-center sm:p-7">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-oasis-blue text-white shadow-lg shadow-oasis-blue/25">
              <DocumentIcon className="h-8 w-8" />
            </span>
            <div className="flex-1">
              <span className="inline-flex rounded-full bg-[#f5ebc7] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#78580b]">
            {text(lang, 'Service à découvrir', 'Featured service')}
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-oasis-blue">
                {pick(featuredService, 'name', lang)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {text(
                  lang,
                  'Une demande guidee pour obtenir votre document officiel sans multiplier les deplacements.',
                  'A guided request to obtain your official document without unnecessary travel.'
                )}
              </p>
              <div className="mt-3 flex gap-4 text-xs font-bold">
                <span className="text-oasis-green-dark">
                  {text(lang, 'Traitement suivi', 'Tracked processing')}
                </span>
                <span className="text-oasis-blue">
                  {Number(featuredService.price_xaf).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
            <Link
              to={`/service/${featuredService.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-oasis-blue px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-oasis-blue/20 transition hover:bg-oasis-blue-dark"
            >
              {text(lang, 'Demarrer la demande', 'Start request')}
              <Arrow />
            </Link>
          </section>
        )}

        <section className="mt-12 rounded-2xl border border-oasis-sage bg-oasis-green-light/60 px-6 py-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-oasis-blue shadow-sm">
            <HeadsetIcon />
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            {text(lang, 'Besoin d’aide pour choisir ?', 'Need help choosing?')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {text(
              lang,
              'Notre equipe est disponible pour vous conseiller avant votre demande.',
              'Our team is available to advise you before you start.'
            )}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="inline-flex items-center justify-center rounded-lg bg-oasis-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-oasis-blue-dark">
              {text(lang, 'Contacter l’assistance', 'Contact support')}
            </Link>
            <Link to="/comment-ca-marche" className="inline-flex items-center justify-center rounded-lg border border-oasis-blue/20 bg-white px-5 py-3 text-sm font-bold text-oasis-blue transition hover:bg-oasis-green-light">
              {text(lang, 'Comment ça marche', 'How it works')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
