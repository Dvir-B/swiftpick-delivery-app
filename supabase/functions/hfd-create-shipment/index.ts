import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// CORS headers - CRITICAL for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log(`Method: ${req.method}, URL: ${req.url}`);
  
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  // Only allow POST for actual function calls
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Processing POST request');
    const { order_id } = await req.json();
    console.log('Request data:', order_id);

    if (!order_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing order_id' }), { status: 400, headers: corsHeaders });
    }

    // --- AUTH ---
    const jwt = req.headers.get('authorization');
    if (!jwt) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt.replace('Bearer ', ''));
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    // --- FETCH SETTINGS ---
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('client_number, token, shipment_type_code, cargo_type_haloch')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      return new Response(JSON.stringify({ success: false, error: 'HFD settings not found. Please configure your HFD credentials in settings.' }), { status: 400, headers: corsHeaders });
    }

    // --- FETCH ORDER ---
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();
    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: corsHeaders });
    }

    // --- BUILD HFD PAYLOAD ---
    // Map order fields to HFD API fields (customize as needed)
    const shipping = order.shipping_address || order.delivery_address || order.address || {};
    const hfdPayload = {
      clientNumber: parseInt(hfdSettings.client_number),
      mesiraIsuf: 'מסירה',
      shipmentTypeCode: hfdSettings.shipment_type_code || 35,
      stageCode: 5,
      ordererName: order.company_name || 'SwiftPick',
      cargoTypeHaloch: hfdSettings.cargo_type_haloch || 10,
      cargoTypeHazor: 0,
      packsHaloch: '1',
      nameTo: shipping.name || order.customer_name || '',
      cityName: shipping.city || '',
      streetName: shipping.street || '',
      houseNum: shipping.house_number || '',
      telFirst: shipping.phone || order.customer_phone || '',
      email: shipping.email || order.customer_email || '',
      referenceNum1: order_id,
      // Add more fields as needed
    };

    // --- CALL HFD API ---
    const hfdResponse = await fetch('https://api.hfd.co.il/rest/v2/shipments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfdSettings.token}`,
      },
      body: JSON.stringify(hfdPayload)
    });

    const hfdResult = await hfdResponse.json();
    console.log('HFD API Response:', hfdResult);

    if (hfdResult.errorCode === '0') {
      // Success response
      return new Response(JSON.stringify({
        success: true,
        shipmentNumber: hfdResult.shipmentNumber,
        randNumber: hfdResult.randNumber,
        referenceNumber: hfdResult.referenceNumber1,
        deliveryLine: hfdResult.deliveryLine,
        deliveryArea: hfdResult.deliveryArea
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Error from HFD
      return new Response(JSON.stringify({
        success: false,
        error: hfdResult.errorMessage || 'Unknown HFD error',
        errorCode: hfdResult.errorCode
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
}); 