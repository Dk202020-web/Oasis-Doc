import { supabase } from '../supabaseClient'

// The primary fallback contact used by the app when the admin has not
// configured a live value in the settings table.
export const DEFAULT_WHATSAPP_NUMBER = '+237690409736'

export const DEFAULT_CONTACTS = [
  {
    label: 'Support WhatsApp',
    number: DEFAULT_WHATSAPP_NUMBER
  }
]

let contactsPromise = null

export function normalizeContacts(raw) {
  if (Array.isArray(raw)) {
    const parsed = raw
      .map((item) => {
        if (!item) return null
        if (typeof item === 'string') {
          const [label, number] = item.split('|').map((part) => part.trim())
          if (!number) return null
          return { label: label || 'WhatsApp', number }
        }
        if (typeof item === 'object' && item.number) {
          return {
            label: item.label || 'WhatsApp',
            number: item.number
          }
        }
        return null
      })
      .filter(Boolean)

    if (parsed.length > 0) return parsed
  }

  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim()

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsedJson = JSON.parse(trimmed)
        const jsonContacts = normalizeContacts(parsedJson)
        if (jsonContacts.length > 0) return jsonContacts
      } catch {
        // Fall through to the line-based parser below.
      }
    }

    const items = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (items.length > 0) {
      const parsed = items
        .map((line) => {
          const [label, number] = line.split('|').map((part) => part.trim())
          if (!number) return null
          return { label: label || 'WhatsApp', number }
        })
        .filter(Boolean)

      if (parsed.length > 0) return parsed
    }

    return [{ label: 'WhatsApp', number: trimmed }]
  }

  return DEFAULT_CONTACTS
}

export function getPrimaryContact(contacts = DEFAULT_CONTACTS) {
  return contacts[0] || DEFAULT_CONTACTS[0]
}

export async function fetchWhatsAppContacts() {
  if (contactsPromise) return contactsPromise

  contactsPromise = (async () => {
    if (!supabase) return DEFAULT_CONTACTS

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['whatsapp_contacts', 'whatsapp_number'])

      if (error) throw error

      const rows = Array.isArray(data) ? data : []
      const contactsRow = rows.find((row) => row.key === 'whatsapp_contacts')
      const primaryRow = rows.find((row) => row.key === 'whatsapp_number')

      const contacts = normalizeContacts(
        contactsRow?.value || (primaryRow?.value ? [primaryRow.value] : [])
      )

      return contacts
    } catch {
      return DEFAULT_CONTACTS
    }
  })()

  return contactsPromise
}

export function buildWhatsAppLink(orderRef, number = DEFAULT_WHATSAPP_NUMBER) {
  const digits = String(number || DEFAULT_WHATSAPP_NUMBER).replace(/[^\d]/g, '')
  const message = `Bonjour, je viens d'effectuer une commande sur Oasis-Doc (reference: ${orderRef}). Voici la preuve de paiement.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
