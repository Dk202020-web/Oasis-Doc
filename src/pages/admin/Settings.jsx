import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { DEFAULT_CONTACTS, DEFAULT_WHATSAPP_NUMBER, normalizeContacts } from '../../lib/whatsapp'

export default function Settings() {
  const [contactText, setContactText] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadContacts() {
      if (!supabase) return

      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['whatsapp_contacts', 'whatsapp_number', 'admin_email'])

      if (error) return

      const rows = Array.isArray(data) ? data : []
      const contactsRow = rows.find((row) => row.key === 'whatsapp_contacts')
      const primaryRow = rows.find((row) => row.key === 'whatsapp_number')
      const emailRow = rows.find((row) => row.key === 'admin_email')
      setAdminEmail(emailRow?.value || '')

      if (contactsRow?.value) {
        setContactText(
          normalizeContacts(contactsRow.value)
            .map((item) => `${item.label}|${item.number}`)
            .join('\n')
        )
      } else if (primaryRow?.value) {
        setContactText(`Support WhatsApp|${primaryRow.value}`)
      } else {
        setContactText(
          DEFAULT_CONTACTS.map((item) => `${item.label}|${item.number}`).join('\n')
        )
      }
    }

    loadContacts()
  }, [])

  function validateContacts(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const errors = []
    const contacts = []

    lines.forEach((line, index) => {
      const [label, number] = line.split('|').map((part) => part.trim())
      if (!number) {
        errors.push(`Ligne ${index + 1} : ajoutez un numéro WhatsApp après le séparateur |.`)
        return
      }

      const cleanedNumber = number.replace(/[^\d+]/g, '')
      if (!cleanedNumber || cleanedNumber.length < 8) {
        errors.push(`Ligne ${index + 1} : numéro WhatsApp invalide.`)
        return
      }

      contacts.push({
        label: label || 'WhatsApp',
        number: cleanedNumber
      })
    })

    return { contacts, errors }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!supabase) return

    const { contacts, errors } = validateContacts(contactText)

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '))
      setSaved(false)
      return
    }

    const primaryNumber = contacts[0]?.number || DEFAULT_WHATSAPP_NUMBER

    setErrorMessage('')

    await supabase
      .from('settings')
      .upsert({ key: 'whatsapp_contacts', value: JSON.stringify(contacts) })

    await supabase
      .from('settings')
      .upsert({ key: 'whatsapp_number', value: primaryNumber })

    await supabase
      .from('settings')
      .upsert({ key: 'admin_email', value: adminEmail.trim() })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Réglages</h1>
      <form onSubmit={handleSave} className="card max-w-xl space-y-4">
        <div>
          <label className="label">Email de notification administrateur</label>
          <input className="input" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@exemple.com" />
          <p className="mt-1 text-xs text-slate-500">Reçoit les nouvelles demandes et les notifications d'envoi des documents.</p>
        </div>
        <div>
          <label className="label">
            Contacts WhatsApp à afficher (un contact par ligne)
          </label>
          <textarea
            className="input min-h-[140px]"
            value={contactText}
            onChange={(e) => setContactText(e.target.value)}
            placeholder="Support|+237690409736"
          />
          <p className="mt-1 text-xs text-slate-500">
            Format attendu : Libellé | numéro. Exemple : Support|+237690409736
          </p>
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {saved && <p className="text-sm text-oasis-green">Enregistré ✓</p>}
        <button className="btn-primary">Enregistrer</button>
      </form>
    </div>
  )
}
