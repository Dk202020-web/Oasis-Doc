import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { REQUIREMENT_TYPES } from '../../components/RequirementField'

const ICONS = ['📄', '🎓', '⚖️', '🌐', '🏛️', '📜', '✈️', '🏥']

export default function CatalogManager() {
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [requirements, setRequirements] = useState([])

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

  // --- Category ---
  async function addCategory() {
    const name = prompt('Nom de la catégorie (FR) ?')
    if (!name) return
    const nameEn = prompt('Nom (EN) ?', name) || name
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    await supabase.from('categories').insert({
      name_fr: name, name_en: nameEn, slug,
      icon: ICONS[categories.length % ICONS.length],
      sort_order: categories.length
    })
    loadCategories()
  }
  async function toggleCategoryActive(cat) {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    loadCategories()
  }
  async function deleteCategory(cat) {
    if (!confirm(`Supprimer la catégorie "${cat.name_fr}" ?`)) return
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
      category_id: selectedCategoryId, name_fr: name, name_en: nameEn,
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
      section_id: selectedSectionId, name_fr: name, name_en: nameEn,
      description_fr: '', description_en: '', price_xaf: price
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

  // --- Requirement ---
  async function addRequirement() {
    if (!selectedServiceId) return
    const label = prompt('Libellé du champ (FR) ?')
    if (!label) return
    const labelEn = prompt('Libellé (EN) ?', label) || label
    const type = prompt(
      `Type de champ ? (${REQUIREMENT_TYPES.map((t) => t.value).join(' | ')})`,
      'short_text'
    )
    const isRequired = confirm('Ce champ est-il obligatoire ?')
    await supabase.from('service_requirements').insert({
      service_id: selectedServiceId,
      label_fr: label,
      label_en: labelEn,
      type: REQUIREMENT_TYPES.some((t) => t.value === type) ? type : 'short_text',
      is_required: isRequired,
      accepted_formats: type?.startsWith('file') ? ['pdf', 'jpg', 'png'] : null,
      max_size_mb: type?.startsWith('file') ? 5 : null,
      sort_order: requirements.length
    })
    loadRequirements(selectedServiceId)
  }
  async function deleteRequirement(reqId) {
    if (!confirm('Supprimer ce champ ?')) return
    await supabase.from('service_requirements').delete().eq('id', reqId)
    loadRequirements(selectedServiceId)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Gestion du catalogue</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Categories */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Catégories</h2>
            <button onClick={addCategory} className="text-sm text-oasis-blue">+ Ajouter</button>
          </div>
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Champs requis — {services.find((s) => s.id === selectedServiceId)?.name_fr}
            </h2>
            <button onClick={addRequirement} className="text-sm text-oasis-blue">+ Ajouter un champ</button>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm">
            <label>Prix (XAF):</label>
            <input
              type="number"
              className="input w-32"
              defaultValue={services.find((s) => s.id === selectedServiceId)?.price_xaf}
              onBlur={(e) => updateServicePrice(services.find((s) => s.id === selectedServiceId), e.target.value)}
            />
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">Libellé</th>
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
                    Aucun champ défini.
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
