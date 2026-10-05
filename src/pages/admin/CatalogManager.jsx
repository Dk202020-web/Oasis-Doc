import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { REQUIREMENT_TYPES } from '../../components/RequirementField'
import { getDefaultCategoryImage } from '../../lib/categoryImage'

const ICONS = ['📄', '🎓', '⚖️', '🌐', '🏛️', '📝', '✈️', '🏥']

function emptyRequirementDraft() {
  return {
    label_fr: '',
    label_en: '',
    type: 'short_text',
    help_text: '',
    is_required: true,
    max_size_mb: 5
  }
}

export default function CatalogManager() {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [requirementDraft, setRequirementDraft] = useState(emptyRequirementDraft)
  const [categoryDraft, setCategoryDraft] = useState({
    name_fr: '',
    name_en: '',
    image_file: null
  })
  const [categoryPreview, setCategoryPreview] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data || [])
  }

  async function loadSections(categoryId) {
    if (!categoryId) return setSections([])
    const { data } = await supabase
      .from('service_sections')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order')
    setSections(data || [])
  }

  async function loadServices(sectionId) {
    if (!sectionId) return setServices([])
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('section_id', sectionId)
      .order('id')
    setServices(data || [])
  }

  async function loadRequirements(serviceId) {
    if (!serviceId) return setRequirements([])
    const { data } = await supabase
      .from('service_requirements')
      .select('*')
      .eq('service_id', serviceId)
      .order('sort_order')
    setRequirements(data || [])
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => {
    loadSections(selectedCategoryId)
    setSelectedSectionId(null)
    setServices([])
    setSelectedServiceId(null)
    setRequirements([])
  }, [selectedCategoryId])
  useEffect(() => {
    loadServices(selectedSectionId)
    setSelectedServiceId(null)
    setRequirements([])
  }, [selectedSectionId])
  useEffect(() => { loadRequirements(selectedServiceId) }, [selectedServiceId])
  useEffect(() => {
    setRequirementDraft(emptyRequirementDraft())
  }, [selectedServiceId])
  useEffect(() => {
    if (!categoryDraft.image_file) {
      setCategoryPreview('')
      return undefined
    }
    const preview = URL.createObjectURL(categoryDraft.image_file)
    setCategoryPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [categoryDraft.image_file])

  useEffect(() => {
    if (!showCategoryForm) {
      setCategoryDraft({ name_fr: '', name_en: '', image_file: null })
    }
  }, [showCategoryForm])

  // --- Category ---
  function updateCategoryDraft(field, value) {
    setCategoryDraft((current) => ({ ...current, [field]: value }))
  }

  async function addCategory(e) {
    e.preventDefault()
    const name = categoryDraft.name_fr.trim()
    const nameEn = categoryDraft.name_en.trim()
    if (!name || !nameEn) return

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')

    let image_path = null
    if (categoryDraft.image_file) {
      const ext = categoryDraft.image_file.name.split('.').pop() || 'png'
      const safeName = `${slug}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(safeName, categoryDraft.image_file, { upsert: true })
      if (uploadError) {
        alert('Impossible de televerser limage de categorie.')
        return
      }
      image_path = safeName
    }

    const { error } = await supabase.from('categories').insert({
      name_fr: name,
      name_en: nameEn,
      slug,
      icon: ICONS[categories.length % ICONS.length],
      image_path,
      sort_order: categories.length
    })

    if (error) {
      alert("Impossible de creer la categorie.")
      return
    }

    setCategoryDraft({ name_fr: '', name_en: '', image_file: null })
    setShowCategoryForm(false)
    loadCategories()
  }

  async function toggleCategoryActive(cat) {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    loadCategories()
  }

  async function deleteCategory(cat) {
    if (!confirm(`Supprimer la categorie "${cat.name_fr}" ?`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    if (selectedCategoryId === cat.id) {
      setSelectedCategoryId(null)
    }
    loadCategories()
  }

  // --- Section ---
  async function addSection() {
    if (!selectedCategoryId) return
    const name = prompt('Nom de la section (FR) ?')
    if (!name) return
    const nameEn = prompt('Nom (EN) ?', name) || name
    await supabase.from('service_sections').insert({
      category_id: selectedCategoryId,
      name_fr: name,
      name_en: nameEn,
      sort_order: sections.length
    })
    loadSections(selectedCategoryId)
  }

  async function deleteSection(section) {
    if (!confirm(`Supprimer la section "${section.name_fr}" ?`)) return
    await supabase.from('service_sections').delete().eq('id', section.id)
    if (selectedSectionId === section.id) {
      setSelectedSectionId(null)
    }
    loadSections(selectedCategoryId)
  }

  // --- Service ---
  async function addService() {
    if (!selectedSectionId) return
    const name = prompt('Nom du service (FR) ?')
    if (!name) return
    const nameEn = prompt('Nom (EN) ?', name) || name
    const price = Number(prompt('Prix (XAF) ?', '0')) || 0
    await supabase.from('services').insert({
      section_id: selectedSectionId,
      name_fr: name,
      name_en: nameEn,
      description_fr: '',
      description_en: '',
      price_xaf: price
    })
    loadServices(selectedSectionId)
  }

  async function toggleServiceActive(sv) {
    await supabase.from('services').update({ is_active: !sv.is_active }).eq('id', sv.id)
    loadServices(selectedSectionId)
  }

  async function deleteService(sv) {
    if (!confirm(`Supprimer le service "${sv.name_fr}" ?`)) return
    await supabase.from('services').delete().eq('id', sv.id)
    if (selectedServiceId === sv.id) {
      setSelectedServiceId(null)
      setRequirements([])
    }
    loadServices(selectedSectionId)
  }

  async function updateServicePrice(sv, price) {
    await supabase.from('services').update({ price_xaf: Number(price) }).eq('id', sv.id)
    loadServices(selectedSectionId)
  }

  function updateRequirementDraft(field, value) {
    setRequirementDraft((current) => ({ ...current, [field]: value }))
  }

  async function addRequirement(e) {
    e.preventDefault()
    if (!selectedServiceId) return
    if (!requirementDraft.label_fr.trim() || !requirementDraft.label_en.trim()) return

    const selectedType =
      REQUIREMENT_TYPES.find((t) => t.value === requirementDraft.type)?.value || 'short_text'
    const isFileType = selectedType.startsWith('file_')

    await supabase.from('service_requirements').insert({
      service_id: selectedServiceId,
      label_fr: requirementDraft.label_fr.trim(),
      label_en: requirementDraft.label_en.trim(),
      type: selectedType,
      help_text: requirementDraft.help_text.trim() || null,
      is_required: Boolean(requirementDraft.is_required),
      accepted_formats: isFileType
        ? selectedType === 'file_pdf'
          ? ['pdf']
          : ['pdf', 'jpg', 'jpeg', 'png', 'webp']
        : null,
      max_size_mb: isFileType ? Number(requirementDraft.max_size_mb) || 5 : null,
      sort_order: requirements.length
    })
    loadRequirements(selectedServiceId)
    setRequirementDraft(emptyRequirementDraft())
  }

  async function deleteRequirement(reqId) {
    if (!confirm('Supprimer ce champ ?')) return
    await supabase.from('service_requirements').delete().eq('id', reqId)
    loadRequirements(selectedServiceId)
  }

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const fileType = REQUIREMENT_TYPES.find((t) => t.value === requirementDraft.type)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Gestion du catalogue</h1>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {/* Categories */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Categories</h2>
            <button
              type="button"
              onClick={() => setShowCategoryForm((open) => !open)}
              className="text-sm text-oasis-blue"
            >
              {showCategoryForm ? 'Masquer' : '+ Ajouter'}
            </button>
          </div>
          {showCategoryForm && (
            <form onSubmit={addCategory} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3">
                <div>
                  <label className="label">Nom FR</label>
                  <input
                    type="text"
                    className="input"
                    value={categoryDraft.name_fr}
                    onChange={(e) => updateCategoryDraft('name_fr', e.target.value)}
                    placeholder="Legalisation"
                  />
                </div>
                <div>
                  <label className="label">Nom EN</label>
                  <input
                    type="text"
                    className="input"
                    value={categoryDraft.name_en}
                    onChange={(e) => updateCategoryDraft('name_en', e.target.value)}
                    placeholder="Legalisation"
                  />
                </div>
                <div>
                  <label className="label">Illustration</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => updateCategoryDraft('image_file', e.target.files?.[0] || null)}
                  />
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Apercu
                  </div>
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                    {categoryPreview ? (
                      <img src={categoryPreview} alt="Apercu de la categorie" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {getDefaultCategoryImage(categories.length)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {categoryPreview ? 'Image choisie' : `Placeholder: ${getDefaultCategoryImage(categories.length)}`}
                  </span>
                  <button type="submit" className="btn-primary w-auto">
                    Ajouter
                  </button>
                </div>
              </div>
            </form>
          )}
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm ${
                  selectedCategoryId === cat.id ? 'bg-oasis-blue text-white' : 'hover:bg-slate-50'
                }`}
              >
                <span>{cat.icon} {cat.name_fr}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleCategoryActive(cat)}
                    className={`badge ${cat.is_active ? 'bg-oasis-green-light text-oasis-green' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {cat.is_active ? 'actif' : 'inactif'}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className="text-xs font-bold text-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400">Aucune categorie.</p>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Sections</h2>
            <button onClick={addSection} disabled={!selectedCategoryId} className="text-sm text-oasis-blue disabled:opacity-30">+ Ajouter</button>
          </div>
          <div className="space-y-1">
            {sections.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSectionId(s.id)}
                className={`cursor-pointer rounded px-2 py-1.5 text-sm ${
                  selectedSectionId === s.id ? 'bg-oasis-blue text-white' : 'hover:bg-slate-50'
                }`}
              >
                <span>{s.name_fr}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSection(s) }}
                  className="ml-2 text-xs font-bold text-red-500"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {selectedCategoryId && sections.length === 0 && (
              <p className="text-xs text-slate-400">Aucune section.</p>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Services</h2>
            <button onClick={addService} disabled={!selectedSectionId} className="text-sm text-oasis-blue disabled:opacity-30">+ Ajouter</button>
          </div>
          <div className="space-y-1">
            {services.map((sv) => (
              <div
                key={sv.id}
                onClick={() => setSelectedServiceId(sv.id)}
                className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm ${
                  selectedServiceId === sv.id ? 'bg-oasis-blue text-white' : 'hover:bg-slate-50'
                }`}
              >
                <span>{sv.name_fr}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleServiceActive(sv)}
                    className={`badge ${sv.is_active ? 'bg-oasis-green-light text-oasis-green' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {sv.is_active ? 'actif' : 'inactif'}
                  </button>
                  <button
                    onClick={() => deleteService(sv)}
                    className="text-xs font-bold text-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements builder for selected service */}
      {selectedServiceId && (
        <div className="card mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">
              Champs requis - {selectedService?.name_fr}
            </h2>
            <span className="text-xs text-slate-500">
              Formulaire de creation du champ
            </span>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm">
            <label>Prix (XAF):</label>
            <input
              type="number"
              className="input w-32"
              defaultValue={selectedService?.price_xaf}
              onBlur={(e) => updateServicePrice(selectedService, e.target.value)}
            />
          </div>

          <form onSubmit={addRequirement} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">Nouveau champ</h3>
                <p className="text-xs text-slate-500">
                  Renseignez les champs FR et EN, puis choisissez le type.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-oasis-blue ring-1 ring-oasis-blue/20">
                {fileType?.label || 'Texte court'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Libelle FR</label>
                <input
                  type="text"
                  className="input"
                  value={requirementDraft.label_fr}
                  onChange={(e) => updateRequirementDraft('label_fr', e.target.value)}
                  placeholder="Numero du document"
                />
              </div>
              <div>
                <label className="label">Libelle EN</label>
                <input
                  type="text"
                  className="input"
                  value={requirementDraft.label_en}
                  onChange={(e) => updateRequirementDraft('label_en', e.target.value)}
                  placeholder="Document number"
                />
              </div>
              <div>
                <label className="label">Type de champ</label>
                <select
                  className="input"
                  value={requirementDraft.type}
                  onChange={(e) => updateRequirementDraft('type', e.target.value)}
                >
                  {REQUIREMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Champ obligatoire</label>
                <select
                  className="input"
                  value={requirementDraft.is_required ? 'yes' : 'no'}
                  onChange={(e) => updateRequirementDraft('is_required', e.target.value === 'yes')}
                >
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">Aide / Help text</label>
                <textarea
                  className="input min-h-24"
                  rows={3}
                  value={requirementDraft.help_text}
                  onChange={(e) => updateRequirementDraft('help_text', e.target.value)}
                  placeholder="Expliquez quoi saisir ou televerser"
                />
              </div>
              {requirementDraft.type.startsWith('file_') && (
                <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                  <div>
                    <label className="label">Formats acceptes</label>
                    <input
                      type="text"
                      className="input"
                      value={
                        requirementDraft.type === 'file_pdf'
                          ? 'pdf'
                          : 'pdf, jpg, jpeg, png, webp'
                      }
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="label">Taille max (MB)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={requirementDraft.max_size_mb}
                      onChange={(e) => updateRequirementDraft('max_size_mb', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                Creer le champ
              </button>
            </div>
          </form>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">Libelle</th>
                <th className="py-1">Type</th>
                <th className="py-1">Obligatoire</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-1.5">{r.label_fr}</td>
                  <td className="py-1.5">
                    {REQUIREMENT_TYPES.find((t) => t.value === r.type)?.label || r.type}
                  </td>
                  <td className="py-1.5">{r.is_required ? 'Oui' : 'Non'}</td>
                  <td className="py-1.5">
                    <button onClick={() => deleteRequirement(r.id)} className="text-red-500">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {requirements.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-slate-400">
                    Aucun champ defini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
