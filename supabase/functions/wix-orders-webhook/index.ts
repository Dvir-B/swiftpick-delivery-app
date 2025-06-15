
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "wix-orders-webhook" up and running!`)

// Create a Supabase client with the service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))

    if (body.challenge) {
      console.log('Responding to Wix challenge')
      return new Response(JSON.stringify({ challenge: body.challenge }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (body.data && body.instanceId) {
      const instanceId = body.instanceId;
      console.log(`Processing webhook for instanceId: ${instanceId}`);

      const { data: credentials, error: credentialsError } = await supabase
        .from('wix_credentials')
        .select('user_id')
        .eq('app_id', instanceId)
        .single()

      if (credentialsError || !credentials) {
        console.error('Error finding user for instanceId:', instanceId, credentialsError);
        throw new Error(`User not found for instanceId: ${instanceId}`);
      }

      const userId = credentials.user_id;
      console.log(`Found user ${userId} for instanceId ${instanceId}`);

      const decodedData = atob(body.data);
      const wixOrder = JSON.parse(decodedData);
      
      console.log('Decoded Wix Order:', JSON.stringify(wixOrder, null, 2));

      const {
        _id: external_id,
        number: order_number,
        buyerInfo,
        shippingInfo,
        totals,
        dateCreated,
        currency,
      } = wixOrder.order;

      if (!external_id || !order_number) {
        throw new Error('Webhook payload is missing essential order identifiers.');
      }

      const customer_email = buyerInfo?.contactDetails?.email;
      const customer_name = `${buyerInfo?.contactDetails?.firstName || ''} ${buyerInfo?.contactDetails?.lastName || ''}`.trim();
      const customer_phone = buyerInfo?.contactDetails?.phone;
      
      const recipient = shippingInfo?.shipmentDetails?.recipient;
      const address = shippingInfo?.shipmentDetails?.address;

      const shipping_address = address ? {
        name: `${recipient?.firstName || ''} ${recipient?.lastName || ''}`.trim(),
        address: address?.addressLine,
        city: address?.city,
        zipCode: address?.postalCode,
        country: address?.country,
        state: address?.subdivision,
        phone: recipient?.phone,
        email: recipient?.email
      } : {};

      const newOrder = {
        user_id: userId,
        external_id,
        order_number: String(order_number),
        platform: 'wix',
        customer_email,
        customer_name,
        customer_phone,
        shipping_address: shipping_address,
        total_amount: totals?.total,
        currency: currency,
        weight: totals?.weight?.value,
        status: 'pending',
        order_date: dateCreated,
      };

      console.log('Constructed new order:', JSON.stringify(newOrder, null, 2));

      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert(newOrder)
        .select('id')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`Order ${order_number} already exists. Ignoring.`);
        } else {
          console.error('Error inserting order:', insertError);
          throw new Error(`Failed to insert order: ${insertError.message}`);
        }
      } else if (insertedOrder) {
         console.log(`Order ${order_number} saved successfully with ID ${insertedOrder.id}`);
        await supabase.from('order_logs').insert({
          order_id: insertedOrder.id,
          user_id: userId,
          activity_type: 'order_created',
          details: { source: 'wix_webhook' },
        });
      }
    } else {
      console.log('Webhook received without data or instanceId, ignoring.');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in webhook handler:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
