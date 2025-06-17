
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "wix-orders-webhook" up and running!`)

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
    console.log('Wix Webhook received:', JSON.stringify(body, null, 2))

    // Log all incoming webhook requests for debugging
    await supabase.from('webhook_logs').insert({
      platform: 'wix',
      event_type: body.eventType || 'unknown',
      payload: body,
      processed_at: new Date().toISOString()
    }).catch(err => console.error('Failed to log webhook:', err));

    // Handle Wix challenge verification
    if (body.challenge) {
      console.log('Responding to Wix challenge:', body.challenge)
      return new Response(JSON.stringify({ challenge: body.challenge }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Handle webhook verification
    if (body.data && body.instanceId) {
      const instanceId = body.instanceId;
      console.log(`Processing webhook for instanceId: ${instanceId}`);

      // Find user by instanceId
      const { data: credentials, error: credentialsError } = await supabase
        .from('wix_credentials')
        .select('user_id')
        .eq('app_id', instanceId)
        .single()

      if (credentialsError || !credentials) {
        console.error('Error finding user for instanceId:', instanceId, credentialsError);
        
        // Try to find by site_url if app_id doesn't match
        const { data: altCredentials, error: altError } = await supabase
          .from('wix_credentials')
          .select('user_id')
          .ilike('site_url', `%${instanceId}%`)
          .single()

        if (altError || !altCredentials) {
          throw new Error(`User not found for instanceId: ${instanceId}`);
        }
        
        credentials.user_id = altCredentials.user_id;
      }

      const userId = credentials.user_id;
      console.log(`Found user ${userId} for instanceId ${instanceId}`);

      // Decode and process the order data
      const decodedData = atob(body.data);
      const webhookData = JSON.parse(decodedData);
      
      console.log('Decoded webhook data:', JSON.stringify(webhookData, null, 2));

      // Handle different webhook event types
      if (webhookData.eventType === 'OrderCreated' || webhookData.order) {
        const wixOrder = webhookData.order || webhookData;
        
        console.log('Processing Wix Order:', JSON.stringify(wixOrder, null, 2));

        // Extract order data with better error handling
        const external_id = wixOrder._id || wixOrder.id;
        const order_number = wixOrder.number || wixOrder.orderNumber;
        
        if (!external_id || !order_number) {
          throw new Error('Webhook payload is missing essential order identifiers.');
        }

        // Extract customer information
        const buyerInfo = wixOrder.buyerInfo || wixOrder.billingInfo || {};
        const contactDetails = buyerInfo.contactDetails || buyerInfo;
        
        const customer_email = contactDetails.email || buyerInfo.email;
        const customer_name = `${contactDetails.firstName || ''} ${contactDetails.lastName || ''}`.trim() 
                            || buyerInfo.name || 'לא צוין';
        const customer_phone = contactDetails.phone || buyerInfo.phone;

        // Extract shipping information
        const shippingInfo = wixOrder.shippingInfo || wixOrder.fulfillment || {};
        const shipmentDetails = shippingInfo.shipmentDetails || {};
        const recipient = shipmentDetails.recipient || {};
        const address = shipmentDetails.address || shippingInfo.address || {};

        const shipping_address = {
          name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || customer_name,
          address: address.addressLine || address.addressLine1 || address.street,
          city: address.city,
          zipCode: address.postalCode || address.zipCode,
          country: address.country,
          state: address.subdivision || address.state,
          phone: recipient.phone || customer_phone,
          email: recipient.email || customer_email
        };

        // Extract totals and other info
        const totals = wixOrder.totals || {};
        const total_amount = totals.total || wixOrder.total || 0;
        const currency = wixOrder.currency || totals.currency || 'ILS';
        const weight = totals.weight?.value || totals.weight || 500;
        
        const order_date = wixOrder.dateCreated || wixOrder.createdDate || new Date().toISOString();

        const newOrder = {
          user_id: userId,
          external_id: String(external_id),
          order_number: String(order_number),
          platform: 'wix',
          customer_email,
          customer_name,
          customer_phone,
          shipping_address,
          total_amount: Number(total_amount),
          currency,
          weight: Number(weight),
          status: 'pending',
          order_date,
        };

        console.log('Constructed new order:', JSON.stringify(newOrder, null, 2));

        // Insert order with conflict handling
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
          
          // Log the activity
          await supabase.from('order_logs').insert({
            order_id: insertedOrder.id,
            user_id: userId,
            activity_type: 'order_created',
            details: { 
              source: 'wix_webhook',
              eventType: webhookData.eventType,
              instanceId: instanceId
            },
          });

          // If auto-processing is enabled, try to send to shipping
          const { data: hfdSettings } = await supabase
            .from('hfd_settings')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

          if (hfdSettings && hfdSettings.client_number && hfdSettings.token) {
            console.log('Auto-processing order to HFD...');
            
            try {
              // Create shipment data
              const shipmentData = {
                client_number: hfdSettings.client_number,
                token: hfdSettings.token,
                shipment_type_code: hfdSettings.shipment_type_code,
                cargo_type_haloch: hfdSettings.cargo_type_haloch,
                reference_num_1: order_number,
                reference_num_2: external_id,
                sender_name: "החנות שלי",
                sender_address: "כתובת השולח",
                sender_city: "תל אביב",
                sender_zip: "1234567",
                sender_phone: "03-1234567",
                recipient_name: shipping_address.name,
                recipient_address: shipping_address.address,
                recipient_city: shipping_address.city,
                recipient_zip: shipping_address.zipCode,
                recipient_phone: shipping_address.phone,
                weight: weight,
                pieces: 1,
                remarks: `הזמנה מ-Wix: ${order_number}`
              };

              // Call HFD proxy
              const hfdResponse = await supabase.functions.invoke('hfd-proxy', {
                body: { endpoint: 'shipments', payload: shipmentData },
              });

              if (hfdResponse.error) {
                throw new Error(hfdResponse.error.message);
              }

              const hfdResult = hfdResponse.data;
              
              if (hfdResult.shipmentNumber || hfdResult.shipment_number) {
                // Update order status
                await supabase
                  .from('orders')
                  .update({ status: 'shipped' })
                  .eq('id', insertedOrder.id);

                // Log success
                await supabase.from('order_logs').insert({
                  order_id: insertedOrder.id,
                  user_id: userId,
                  activity_type: 'shipment_created',
                  details: { 
                    hfdShipmentNumber: hfdResult.shipmentNumber || hfdResult.shipment_number,
                    context: 'auto_webhook'
                  },
                });

                console.log(`Order ${order_number} automatically sent to HFD with shipment number: ${hfdResult.shipmentNumber || hfdResult.shipment_number}`);
              }

            } catch (hfdError) {
              console.error('Failed to auto-process to HFD:', hfdError);
              
              // Update order to error status
              await supabase
                .from('orders')
                .update({ status: 'error' })
                .eq('id', insertedOrder.id);

              // Log error
              await supabase.from('order_logs').insert({
                order_id: insertedOrder.id,
                user_id: userId,
                activity_type: 'shipment_creation_failed',
                details: { 
                  error: hfdError.message,
                  context: 'auto_webhook'
                },
              });
            }
          }
        }
      } else {
        console.log('Webhook received but not an order creation event:', webhookData.eventType);
      }
    } else {
      console.log('Webhook received without data or instanceId, might be a test webhook.');
    }

    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in webhook handler:', error.message);
    
    // Log error to database if possible
    try {
      await supabase.from('webhook_logs').insert({
        platform: 'wix',
        event_type: 'error',
        payload: { error: error.message },
        processed_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
