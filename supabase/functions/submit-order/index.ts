import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  if (!apiKey || !from) throw new Error('Email is not configured: set RESEND_API_KEY and EMAIL_FROM')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text })
  })
  if (!response.ok) throw new Error(`Email provider error (${response.status}): ${await response.text()}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json({ error: 'Authorization required' }, 401)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const token = authorization.replace(/^Bearer\s+/i, '')
    const authClient = createClient(supabaseUrl, anonKey)
    const { data: authData, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Invalid session' }, 401)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: profile } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
    const isAdmin = profile?.role === 'admin'
    const { event, orderId, orderItemId } = await req.json()
    const { data: settings } = await supabase.from('settings').select('key,value').in('key', ['admin_email'])
    const adminEmail = settings?.find((row) => row.key === 'admin_email')?.value?.trim()

    if (event === 'new_order') {
      if (!orderId) return json({ error: 'orderId is required' }, 400)
      const { data: order, error } = await supabase
        .from('orders').select('id,order_ref,user_id,user:users(full_name,email),order_items(service:services(name_fr,name_en),order_item_files(storage_path,file_name,kind))')
        .eq('id', orderId).single()
      if (error || !order) return json({ error: 'Order not found' }, 404)
      if (order.user_id !== authData.user.id && !isAdmin) return json({ error: 'Forbidden' }, 403)
      if (!adminEmail) return json({ error: 'Set admin_email in Admin Settings first' }, 400)
      const serviceLines: string[] = []
      for (const item of order.order_items || []) {
        serviceLines.push(`- ${item.service?.name_fr || item.service?.name_en || 'Service'}`)
        for (const file of item.order_item_files || []) {
          if (file.kind !== 'source') continue
          const { data: signed } = await supabase.storage.from('order-source-files').createSignedUrl(file.storage_path, 60 * 60 * 24 * 7, { download: file.file_name || true })
          if (signed?.signedUrl) serviceLines.push(`  ${file.file_name || 'Document'} (lien valable 7 jours): ${signed.signedUrl}`)
        }
      }
      await sendEmail(adminEmail, `Nouvelle demande ${order.order_ref}`, `Nouvelle demande reçue.\nRéférence: ${order.order_ref}\nClient: ${order.user?.full_name || ''}\nEmail: ${order.user?.email || ''}\nServices et documents:\n${serviceLines.join('\n')}\n\nLes documents sont accessibles via des liens privés valables 7 jours. Connectez-vous au panneau administrateur pour consulter la demande.`)
      return json({ ok: true })
    }

    if (event === 'deliverable_ready') {
      if (!isAdmin) return json({ error: 'Admin access required' }, 403)
      if (!orderItemId) return json({ error: 'orderItemId is required' }, 400)
      const { data: item, error } = await supabase.from('order_items')
        .select('id,order:orders(order_ref,user:users(full_name,email)),service:services(name_fr,name_en),order_item_files(storage_path,file_name,kind)')
        .eq('id', orderItemId).single()
      if (error || !item) return json({ error: 'Request not found' }, 404)
      const file = item.order_item_files?.find((entry: any) => entry.kind === 'deliverable')
      const recipient = item.order?.user?.email
      if (!file || !recipient) return json({ error: 'Deliverable or customer email is missing' }, 400)
      const { data: signed, error: signedError } = await supabase.storage.from('order-deliverables').createSignedUrl(file.storage_path, 60 * 60 * 24 * 7, { download: file.file_name || true })
      if (signedError || !signed?.signedUrl) throw signedError || new Error('Could not create secure download link')
      await sendEmail(recipient, `Votre document est prêt – ${item.order?.order_ref}`, `Bonjour ${item.order?.user?.full_name || ''},\n\nVotre document pour le service ${item.service?.name_fr || item.service?.name_en || ''} est prêt. Téléchargez-le avec ce lien sécurisé (valable 7 jours) :\n${signed.signedUrl}\n\nRéférence: ${item.order?.order_ref}`)
      return json({ ok: true })
    }

    return json({ error: 'Unknown event' }, 400)
  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
})
