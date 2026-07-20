// Optional Edge Function — not wired up by default in v1.
// The frontend currently talks to Supabase directly (auth + RLS already
// enforce that a user can only create orders/items under their own
// account). This function is scaffolded per the stack recommendation in
// the spec (section 10.1) as the natural place to add later:
//   - server-side validation of submitted_values against
//     service_requirements before insert
//   - a hook to notify the admin (email/SMS) when a new order lands
//   - eventually, real payment gateway webhook handling (CinetPay etc.)
//
// To deploy: `supabase functions deploy submit-order`
// To call from the frontend: supabase.functions.invoke('submit-order', { body: {...} })

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { orderId } = await req.json()
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400
      })
    }

    // Example: fetch the order + items for a future validation/notify step.
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, order: data }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500
    })
  }
})
