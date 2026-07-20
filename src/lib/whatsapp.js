// The number customers send payment-proof screenshots to.
// Kept as a fallback constant; the live value is read from the
// `settings` table (key = 'whatsapp_number') so the admin can change
// it from the dashboard without a redeploy.
export const DEFAULT_WHATSAPP_NUMBER = '+237690409736'

export function buildWhatsAppLink(orderRef, number = DEFAULT_WHATSAPP_NUMBER) {
  const digits = number.replace(/[^\d]/g, '')
  const message = `Bonjour, je viens d'effectuer une commande sur Oasis-Doc (reference: ${orderRef}). Voici la preuve de paiement.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
