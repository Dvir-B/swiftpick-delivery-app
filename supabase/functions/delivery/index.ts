import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    console.log('Delivery Function: Received request:', { action, data });

    switch (action) {
      case 'create':
        return await handleCreateDelivery(data);
      case 'status':
        return await handleGetDeliveryStatus(data);
      case 'update':
        return await handleUpdateDeliveryStatus(data);
      case 'test':
        return await handleTestConnection();
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Delivery Function: Error:', error.message);
    console.error('Delivery Function: Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function handleCreateDelivery(orderData: any) {
  try {
    console.log('Delivery Function: Creating delivery for order:', JSON.stringify(orderData, null, 2));
    
    // Get HFD settings from database
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      throw new Error('HFD settings not found. Please configure HFD settings first.');
    }

    // Call HFD proxy to create shipment
    const shipmentPayload = {
      clientNumber: parseInt(hfdSettings.client_number),
      shipmentTypeCode: parseInt(hfdSettings.shipment_type_code) || 50,
      cargoTypeHaloch: parseInt(hfdSettings.cargo_type_haloch) || 1,
      nameTo: orderData.customer_name || orderData.recipient_name,
      cityName: orderData.shipping_address?.city || orderData.recipient_city,
      streetName: orderData.shipping_address?.address || orderData.recipient_address,
      houseNum: "1",
      telFirst: orderData.customer_phone || orderData.recipient_phone,
      shipmentRemarks: orderData.notes || orderData.remarks || `הזמנה: ${orderData.order_number || orderData.id}`,
      referenceNum1: orderData.order_number || orderData.id,
      referenceNum2: orderData.external_id || '',
      productsPrice: orderData.total_amount || 0,
      productPriceCurrency: "ILS",
      shipmentWeight: orderData.weight || 1000,
      token: hfdSettings.token
    };

    console.log('Delivery Function: Calling HFD proxy with payload:', JSON.stringify(shipmentPayload, null, 2));

    const { data: hfdResult, error: hfdError } = await supabase.functions.invoke('hfd-proxy', {
      body: { 
        endpoint: '/shipments', 
        payload: shipmentPayload,
        token: hfdSettings.token
      },
    });

    if (hfdError) {
      throw new Error(`HFD API Error: ${hfdError.message}`);
    }

    if (hfdResult.error) {
      throw new Error(`HFD API Error: ${hfdResult.error}`);
    }

    console.log('Delivery Function: HFD result:', JSON.stringify(hfdResult, null, 2));

    // Save shipment to database
    const { data: shipment, error: saveError } = await supabase
      .from('shipments')
      .insert({
        order_id: orderData.id,
        hfd_shipment_number: hfdResult.shipmentNumber?.toString() || hfdResult.parcel_id?.toString(),
        tracking_number: hfdResult.randNumber || hfdResult.random_code,
        shipment_data: hfdResult,
        status: 'sent_to_hfd'
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Database Error: ${saveError.message}`);
    }

    console.log('Delivery Function: Saved shipment to database:', JSON.stringify(shipment, null, 2));

    return new Response(JSON.stringify({
      success: true,
      shipment: {
        id: shipment.id,
        hfd_shipment_number: hfdResult.shipmentNumber || hfdResult.parcel_id,
        tracking_number: hfdResult.randNumber || hfdResult.random_code,
        status: 'sent_to_hfd'
      },
      message: `משלוח נוצר בהצלחה - מספר משלוח: ${hfdResult.shipmentNumber || hfdResult.parcel_id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Delivery Function: Error in handleCreateDelivery:', error);
    throw error;
  }
}

async function handleGetDeliveryStatus(data: { shipmentNumber: string }) {
  try {
    console.log('Delivery Function: Getting status for shipment:', data.shipmentNumber);
    
    // Get HFD settings
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      throw new Error('HFD settings not found');
    }

    // Call HFD proxy to get status
    const { data: statusResult, error: statusError } = await supabase.functions.invoke('hfd-proxy', {
      body: {
        endpoint: `/shipments/${data.shipmentNumber}`,
        payload: {},
        token: hfdSettings.token
      }
    });

    if (statusError) {
      throw new Error(`HFD API Error: ${statusError.message}`);
    }

    console.log('Delivery Function: Status result:', JSON.stringify(statusResult, null, 2));

    return new Response(JSON.stringify({
      success: true,
      status: statusResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Delivery Function: Error in handleGetDeliveryStatus:', error);
    throw error;
  }
}

async function handleUpdateDeliveryStatus(data: { shipmentId: string; status: string; details?: any }) {
  try {
    console.log('Delivery Function: Updating delivery status:', data);
    
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update({
        status: data.status,
        shipment_data: data.details,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.shipmentId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Database Error: ${updateError.message}`);
    }

    console.log('Delivery Function: Updated shipment:', JSON.stringify(updatedShipment, null, 2));

    return new Response(JSON.stringify({
      success: true,
      shipment: updatedShipment
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Delivery Function: Error in handleUpdateDeliveryStatus:', error);
    throw error;
  }
}

async function handleTestConnection() {
  try {
    console.log('Delivery Function: Testing HFD connection');
    
    // Get HFD settings
    const { data: hfdSettings, error: settingsError } = await supabase
      .from('hfd_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (settingsError || !hfdSettings) {
      throw new Error('HFD settings not found');
    }

    // Test with a minimal shipment
    const testPayload = {
      clientNumber: parseInt(hfdSettings.client_number),
      shipmentTypeCode: parseInt(hfdSettings.shipment_type_code) || 50,
      cargoTypeHaloch: parseInt(hfdSettings.cargo_type_haloch) || 1,
      nameTo: "בדיקה",
      cityName: "תל אביב",
      streetName: "דיזנגוף",
      houseNum: "1",
      telFirst: "050-1234567",
      shipmentRemarks: "בדיקת חיבור - לא לשליחה",
      referenceNum1: "TEST-" + Date.now(),
      productsPrice: 0,
      productPriceCurrency: "ILS",
      shipmentWeight: 100,
      token: hfdSettings.token
    };

    console.log('Delivery Function: Testing with payload:', JSON.stringify(testPayload, null, 2));

    const { data: result, error: testError } = await supabase.functions.invoke('hfd-proxy', {
      body: { 
        endpoint: '/shipments', 
        payload: testPayload,
        token: hfdSettings.token
      },
    });

    if (testError) {
      throw new Error(`HFD API Error: ${testError.message}`);
    }

    if (result.error) {
      throw new Error(`HFD API Error: ${result.error}`);
    }

    console.log('Delivery Function: Test connection result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: 'חיבור ל-HFD תקין',
      test_shipment_number: result.shipmentNumber || result.parcel_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Delivery Function: Error in handleTestConnection:', error);
    throw error;
  }
} 