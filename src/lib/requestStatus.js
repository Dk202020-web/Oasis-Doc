export const REQUEST_STATUS_OPTIONS = [
  { value: 'pending', labelFr: 'En attente', labelEn: 'Pending', tone: 'slate', step: 1 },
  { value: 'paid', labelFr: 'Payé', labelEn: 'Paid', tone: 'blue', step: 2 },
  { value: 'in_progress', labelFr: 'En cours', labelEn: 'In progress', tone: 'amber', step: 3 },
  { value: 'validated', labelFr: 'Validé', labelEn: 'Validated', tone: 'emerald', step: 4 },
  { value: 'completed', labelFr: 'Terminé', labelEn: 'Completed', tone: 'emerald', step: 4 },
  { value: 'available', labelFr: 'Disponible', labelEn: 'Available', tone: 'emerald', step: 4 },
  { value: 'rejected', labelFr: 'Rejeté', labelEn: 'Rejected', tone: 'rose', step: 4 }
]

const STATUS_INDEX = new Map(REQUEST_STATUS_OPTIONS.map((status) => [status.value, status]))

export const REQUEST_STATUS_SEQUENCE = ['pending', 'paid', 'in_progress', 'validated', 'completed', 'available', 'rejected']
export const REQUEST_STATUS_STAGE_LABELS = ['En attente / Pending', 'Paye / Paid', 'En cours / In progress', 'Final / Final']

export function getRequestStatusSequence() {
  return REQUEST_STATUS_SEQUENCE.slice()
}

export function normalizeRequestStatus(status) {
  if (!status) return 'pending'
  if (STATUS_INDEX.has(status)) return status
  if (status === 'done') return 'completed'
  return 'pending'
}

export function getRequestStatus(item) {
  if (!item) return 'pending'
  if (item.status) return normalizeRequestStatus(item.status)

  if (item.work_status === 'done') return 'available'
  if (item.work_status === 'in_progress') return 'in_progress'
  if (item.payment_status === 'paid') return 'paid'
  return 'pending'
}

export function getRequestStatusMeta(status) {
  return STATUS_INDEX.get(normalizeRequestStatus(status)) || STATUS_INDEX.get('pending')
}

export function getRequestStatusLabel(status) {
  const meta = getRequestStatusMeta(status)
  return `${meta.labelFr} / ${meta.labelEn}`
}

export function getRequestStatusLabelForLang(status, lang) {
  const meta = getRequestStatusMeta(status)
  return lang === 'en' ? meta.labelEn : meta.labelFr
}

export function getRequestStatusStep(status) {
  const normalized = normalizeRequestStatus(status)
  const meta = getRequestStatusMeta(normalized)
  return meta.step
}

export function isRequestTerminal(status) {
  return ['validated', 'completed', 'available', 'rejected'].includes(normalizeRequestStatus(status))
}

export function isRequestDeliverableReady(status) {
  return ['validated', 'completed', 'available'].includes(normalizeRequestStatus(status))
}

export function getRequestStatusTone(status) {
  return getRequestStatusMeta(status).tone
}
