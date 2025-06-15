
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "wix-orders-webhook" up and running!`)

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))
    
    // Wix sends a verification request when setting up a webhook.
    // We need to respond with the challenge code.
    if (body.challenge) {
       return new Response(JSON.stringify({challenge: body.challenge}), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       })
    }

    // You can process other webhook events here in the future.

    return new Response(JSON.stringify({ message: 'Webhook received successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
