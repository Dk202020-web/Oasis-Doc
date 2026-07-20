import { useLang, pick } from '../context/LangContext'

// Requirement "type" values, matching the service_requirements.type
// check constraint in the DB migration:
//   short_text | long_text | date | file_image | file_pdf | file_multi
// file_image  -> single image upload (jpg/png/webp)
// file_pdf    -> single PDF upload
// file_multi  -> multiple files, any of the accepted_formats

export default function RequirementField({ requirement, value, onChange }) {
  const { lang } = useLang()
  const label = pick(requirement, 'label', lang)
  const help = requirement.help_text

  const fieldTypeLabel = {
    short_text: 'Texte court',
    long_text: 'Texte long',
    date: 'Date',
    file_image: 'Image',
    file_pdf: 'PDF',
    file_multi: 'Fichiers'
  }[requirement.type] || 'Champ'

  const commonLabel = (
    <label className="label">
      {label}
      {requirement.is_required && <span className="text-red-500"> *</span>}
    </label>
  )

  const fileHint = (
    <p className="mt-2 text-xs text-slate-500">
      {help && <span>{help} · </span>}
      Formats: {(requirement.accepted_formats || []).join(', ') || 'PDF, JPG, PNG'} · Max:{' '}
      {requirement.max_size_mb || 5} MB
    </p>
  )

  const fieldShell = (children) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>{commonLabel}</div>
        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-oasis-blue ring-1 ring-oasis-blue/20">
          {fieldTypeLabel}
        </span>
      </div>
      {children}
      {help && <p className="mt-2 text-xs text-slate-500">{help}</p>}
    </div>
  )

  switch (requirement.type) {
    case 'long_text':
      return fieldShell(
        <textarea
          className="input min-h-[7rem]"
          rows={4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'date':
      return fieldShell(
        <input
          type="date"
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'file_image':
      return fieldShell(
        <div>
          <input
            type="file"
            accept="image/*"
            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-oasis-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-oasis-blue-dark"
            onChange={(e) => onChange(e.target.files[0] || null)}
          />
          {fileHint}
        </div>
      )
    case 'file_pdf':
      return fieldShell(
        <div>
          <input
            type="file"
            accept="application/pdf"
            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-oasis-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-oasis-blue-dark"
            onChange={(e) => onChange(e.target.files[0] || null)}
          />
          {fileHint}
        </div>
      )
    case 'file_multi':
      return fieldShell(
        <div>
          <input
            type="file"
            multiple
            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-oasis-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-oasis-blue-dark"
            onChange={(e) => onChange(Array.from(e.target.files || []))}
          />
          {fileHint}
        </div>
      )
    case 'short_text':
    default:
      return fieldShell(
        <input
          type="text"
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

export const REQUIREMENT_TYPES = [
  { value: 'short_text', label: 'Texte court' },
  { value: 'long_text', label: 'Texte long' },
  { value: 'date', label: 'Date' },
  { value: 'file_image', label: 'Image' },
  { value: 'file_pdf', label: 'PDF' },
  { value: 'file_multi', label: 'Fichiers multiples' }
]
