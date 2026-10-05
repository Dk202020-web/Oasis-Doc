import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang, pick, text } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const formatXaf = (amount) => `${Number(amount).toLocaleString('fr-FR')} FCFA`
const countryName = (country, lang) => {
  if (!country) return ''
  try {
    return new Intl.DisplayNames([lang === 'fr' ? 'fr' : 'en'], { type: 'region' }).of(country.code) || country[`name_${lang}`] || country.code
  } catch {
    return country[`name_${lang}`] || country.name_en || country.code
  }
}
const countryOptionLabel = (country, role, lang) => {
  const supported = role === 'source' ? country.code === 'CM' : country.code === 'CA'
  return supported
    ? countryName(country, lang)
    : `${countryName(country, lang)} (${text(lang, 'parcours non disponible', 'pathway unavailable')})`
}

export default function DiplomaEquivalence() {
  const { lang } = useLang()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const requestedPurpose = searchParams.get('purpose')
  const validPurposes = ['study', 'immigration', 'work', 'licensing', 'general']
  const [purpose, setPurpose] = useState(validPurposes.includes(requestedPurpose) ? requestedPurpose : 'general')
  const [qualification, setQualification] = useState('general')
  const [academicSystem, setAcademicSystem] = useState('lmd')
  const [institutionReview, setInstitutionReview] = useState('known')
  const [credentialCount, setCredentialCount] = useState(1)
  const [quote, setQuote] = useState(null)
  const [diplomaFile, setDiplomaFile] = useState(null)
  const [transcriptFile, setTranscriptFile] = useState(null)
  const [documentsSaved, setDocumentsSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState([])
  const [sourceCountryCode, setSourceCountryCode] = useState('CM')
  const [destinationCountryCode, setDestinationCountryCode] = useState('CA')
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [institutionSearch, setInstitutionSearch] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('credential_countries').select('*').eq('active', true).order('sort_order'),
      supabase.from('credential_institutions').select('*, aliases:credential_institution_aliases(alias)').eq('active', true).order('sort_order')
    ]).then(([countryResult, institutionResult]) => {
      setCountries(countryResult.data || [])
      setInstitutions(institutionResult.data || [])
    })
  }, [])

  const sourceCountry = countries.find((country) => country.code === sourceCountryCode)
  const destinationCountry = countries.find((country) => country.code === destinationCountryCode)
  const isSupportedPathway = countries.length > 0 && sourceCountryCode === 'CM' && destinationCountryCode === 'CA'
  const matchingInstitutions = institutions.filter((institution) =>
    institution.country_code === sourceCountryCode && !institution.parent_id &&
    `${institution.name_fr} ${institution.name_en} ${(institution.aliases || []).map((alias) => alias.alias).join(' ')}`.toLowerCase().includes(institutionSearch.toLowerCase())
  )
  const matchingComponents = institutions.filter((institution) => institution.parent_id === institutionId)

  async function estimate(e) {
    e.preventDefault()
    setError('')
    setQuote(null)
    setDocumentsSaved(false)
    if (!isSupportedPathway) {
      setError(text(lang, 'Ce parcours n’est pas encore disponible. Pour le moment, seules les demandes du Cameroun vers le Canada sont prises en charge.', 'This pathway is not available yet. Currently, only requests from Cameroon to Canada are supported.'))
      return
    }
    if (!user) {
      setError(text(lang, 'Connectez-vous pour obtenir une estimation enregistrée.', 'Sign in to get a saved estimate.'))
      return
    }
    if (!institutionId) {
      setError(text(lang, 'Sélectionnez votre établissement.', 'Select your institution.'))
      return
    }
    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('create_credential_price_quote', {
      p_inputs: {
        source_country: sourceCountryCode,
        destination_country: destinationCountryCode,
        institution_id: institutionId,
        institution_component_id: componentId || null,
        purpose,
        qualification_type: qualification,
        academic_system: academicSystem,
        institution_review: institutionReview === 'known' ? null : 'needs_verification',
        credential_count: Number(credentialCount)
      }
    })
    setLoading(false)
    if (rpcError) {
      setError(text(lang, 'Impossible de calculer le tarif. Réessayez plus tard.', 'Could not calculate the price. Please try again.'))
      console.error(rpcError)
      return
    }
    setQuote(data)
  }

  async function uploadDocuments(e) {
    e.preventDefault()
    if (!diplomaFile || !quote?.id || !user) return
    setError('')
    setUploading(true)
    const files = [
      { file: diplomaFile, kind: 'diploma' },
      ...(transcriptFile ? [{ file: transcriptFile, kind: 'transcript' }] : [])
    ]
    try {
      const documents = []
      for (const { file, kind } of files) {
        const safeName = file.name.replace(/[\\/]/g, '_')
        const storagePath = `${user.id}/diploma-quotes/${quote.id}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('order-source-files').upload(storagePath, file)
        if (uploadError) throw uploadError
        documents.push({ storage_path: storagePath, file_name: file.name, kind })
      }
      const { error: saveError } = await supabase.rpc('attach_credential_documents', {
        p_quote_id: quote.id,
        p_documents: documents
      })
      if (saveError) throw saveError
      setDocumentsSaved(true)
    } catch (uploadError) {
      console.error(uploadError)
      setError(text(lang, 'Le téléversement a échoué. Vérifiez les formats et réessayez.', 'Upload failed. Check the file types and try again.'))
    } finally {
      setUploading(false)
    }
  }

  const selectClass = 'input'
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-oasis-green-dark">{sourceCountry && destinationCountry ? `${countryName(sourceCountry, lang)} → ${countryName(destinationCountry, lang)}` : text(lang, 'Sélectionnez les pays', 'Select the countries')}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{text(lang, 'Équivalence de diplômes', 'Diploma equivalence')}</h1>
        <p className="mt-3 leading-7 text-slate-600">{text(lang, 'Soumettez votre diplôme pour une analyse d’équivalence adaptée à votre projet au Canada. Votre parcours détermine le traitement et le tarif de la demande.', 'Submit your credential for an equivalence analysis tailored to your plans in Canada. Your pathway determines how the request is handled and priced.')}</p>
      </div>

      <form onSubmit={estimate} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">{text(lang, 'Pays d’obtention', 'Country where credential was obtained')}</span>
            <select className={selectClass} value={sourceCountryCode} onChange={(event) => { setSourceCountryCode(event.target.value); setInstitutionId(''); setComponentId(''); setInstitutionSearch(''); setError('') }} required>
              <option value="">{text(lang, 'Sélectionnez un pays', 'Select a country')}</option>
              {countries.map((country) => <option key={country.code} value={country.code}>{countryOptionLabel(country, 'source', lang)}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">{text(lang, 'Pays de destination', 'Destination country')}</span>
            <select className={selectClass} value={destinationCountryCode} onChange={(event) => { setDestinationCountryCode(event.target.value); setError('') }} required>
              <option value="">{text(lang, 'Sélectionnez un pays', 'Select a country')}</option>
              {countries.map((country) => <option key={country.code} value={country.code}>{countryOptionLabel(country, 'destination', lang)}</option>)}
            </select>
          </label>
        </div>
        {!isSupportedPathway && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{text(lang, 'Ce parcours n’est pas encore pris en charge. Vous pouvez choisir les pays, mais seule la demande du Cameroun vers le Canada est actuellement disponible.', 'This pathway is not supported yet. You can select the countries, but Cameroon to Canada is currently the only available request pathway.')}</p>}
        <label className="block"><span className="label">{text(lang, 'Université / établissement', 'University / institution')}</span>
          <input className={selectClass} list="credential-institutions" value={institutionSearch} autoComplete="off" disabled={!isSupportedPathway} placeholder={text(lang, 'Rechercher un établissement', 'Search institutions')} onChange={(event) => {
            setInstitutionSearch(event.target.value)
            const match = matchingInstitutions.find((institution) => institution.name_fr === event.target.value || institution.name_en === event.target.value || institution.aliases?.some((alias) => alias.alias.toLowerCase() === event.target.value.toLowerCase()))
            setInstitutionId(match?.id || '')
            setComponentId('')
          }} required />
          <datalist id="credential-institutions">{matchingInstitutions.map((institution) => <option key={institution.id} value={pick(institution, 'name', lang)} />)}</datalist>
        </label>
        {institutionId && matchingComponents.length > 0 && <label className="block"><span className="label">{text(lang, 'Faculté, école ou composante (facultatif)', 'Faculty, school, or component (optional)')}</span>
          <select className={selectClass} value={componentId} onChange={(event) => setComponentId(event.target.value)}>
            <option value="">{text(lang, 'Sélectionnez une composante', 'Select a component')}</option>
            {matchingComponents.map((institution) => <option key={institution.id} value={institution.id}>{pick(institution, 'name', lang)}</option>)}
          </select>
        </label>}
        <label className="block"><span className="label">{text(lang, 'Objectif au Canada', 'Purpose in Canada')}</span>
          <select className={selectClass} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="study">{text(lang, 'Études', 'Study')}</option><option value="immigration">Immigration</option><option value="work">{text(lang, 'Travail', 'Work')}</option><option value="licensing">{text(lang, 'Licence professionnelle', 'Professional licensing')}</option><option value="general">{text(lang, 'Évaluation générale', 'General evaluation')}</option>
          </select>
        </label>
        <label className="block"><span className="label">{text(lang, 'Type de diplôme', 'Credential type')}</span>
          <select className={selectClass} value={qualification} onChange={(e) => setQualification(e.target.value)}>
            <option value="general">{text(lang, 'Diplôme général', 'General credential')}</option><option value="professional">{text(lang, 'Diplôme professionnel / technique', 'Professional / technical credential')}</option><option value="engineering">{text(lang, 'Diplôme d’ingénieur', 'Engineering credential')}</option><option value="medical">{text(lang, 'Diplôme médical / santé', 'Medical / health credential')}</option><option value="doctoral">{text(lang, 'Doctorat / spécialisé', 'Doctoral / specialized credential')}</option>
          </select>
        </label>
        <label className="block"><span className="label">{text(lang, 'Système académique', 'Academic system')}</span>
          <select className={selectClass} value={academicSystem} onChange={(e) => setAcademicSystem(e.target.value)}>
            <option value="lmd">LMD</option><option value="former_system">{text(lang, 'Ancien système universitaire', 'Former university system')}</option><option value="professional">{text(lang, 'Professionnel / technique', 'Professional / technical')}</option><option value="engineering">{text(lang, 'Ingénierie', 'Engineering')}</option><option value="medical">{text(lang, 'Médical / santé', 'Medical / health')}</option><option value="unknown">{text(lang, 'Je ne sais pas', "I don't know")}</option>
          </select>
        </label>
        <label className="block"><span className="label">{text(lang, 'Établissement', 'Institution')}</span>
          <select className={selectClass} value={institutionReview} onChange={(e) => setInstitutionReview(e.target.value)}>
            <option value="known">{text(lang, 'Établissement facilement identifiable', 'Institution readily identifiable')}</option><option value="needs_review">{text(lang, 'Établissement ou composante à vérifier', 'Institution or component needs verification')}</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">{text(lang, 'Le prix dépend du travail de vérification, pas du nom de l’université.', 'Pricing reflects verification work, not the university name.')}</span>
        </label>
        <label className="block"><span className="label">{text(lang, 'Nombre de diplômes', 'Number of credentials')}</span>
          <input className={selectClass} type="number" min="1" max="20" value={credentialCount} onChange={(e) => setCredentialCount(e.target.value)} required />
          <span className="mt-1 block text-xs text-slate-500">{text(lang, 'Les diplômes supplémentaires du même parcours ont un tarif marginal réduit.', 'Additional credentials on the same pathway use a reduced marginal price.')}</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading || !isSupportedPathway} className="btn-primary w-full">{loading ? text(lang, 'Calcul…', 'Calculating…') : text(lang, 'Continuer avec cette demande', 'Continue with this request')}</button>
      </form>

      {quote && <section className="card mt-5" aria-live="polite">
        <p className="text-sm font-semibold text-slate-500">{text(lang, 'Prix estimé', 'Estimated price')}</p>
        <p className="mt-1 text-3xl font-extrabold text-oasis-blue">{formatXaf(quote.estimate_xaf)}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{pick(quote, 'message', lang)}</p>
        {quote.breakdown?.length > 0 && <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          {quote.breakdown.filter((item) => item.amount_xaf !== 0).map((item, index) => <li key={`${item.factor_type}-${index}`} className="flex justify-between gap-4"><span>{pick(item, 'label', lang)}</span><span className="shrink-0 font-semibold">{formatXaf(item.amount_xaf)}</span></li>)}
        </ul>}
        <p className="mt-4 text-xs text-slate-500">{text(lang, 'Cette analyse est interne et préliminaire. Elle ne constitue pas une équivalence canadienne officielle.', 'This is an internal preliminary analysis. It is not an official Canadian equivalency.')}</p>
        {!documentsSaved ? <form onSubmit={uploadDocuments} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <h2 className="font-bold">{text(lang, 'Documents pour la revue', 'Documents for review')}</h2>
          <p className="text-sm text-slate-600">{text(lang, 'Ajoutez une copie lisible du diplôme. Le relevé de notes est facultatif à cette étape.', 'Add a readable copy of the diploma. A transcript is optional at this stage.')}</p>
          <label className="block text-sm">{text(lang, 'Diplôme (PDF, JPG ou PNG)', 'Diploma (PDF, JPG or PNG)')}<input className="input mt-1" type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={(e) => setDiplomaFile(e.target.files?.[0] || null)} /></label>
          <label className="block text-sm">{text(lang, 'Relevé de notes (facultatif)', 'Transcript (optional)')}<input className="input mt-1" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)} /></label>
          <button className="btn-outline" disabled={uploading || !diplomaFile}>{uploading ? text(lang, 'Téléversement…', 'Uploading…') : text(lang, 'Envoyer les documents', 'Upload documents')}</button>
        </form> : <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-oasis-green">{text(lang, 'Documents transmis. Votre tarif reste fixe et votre demande est prête à être traitée.', 'Documents submitted. Your price stays fixed and your request is ready for processing.')}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </section>}
    </div>
  )
}
