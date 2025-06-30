import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ENV VARS
const HFD_ENV = Deno.env.get('HFD_ENV') || 'test';
const HFD_API_URL = Deno.env.get('HFD_API_URL') || 'https://api.hfd.co.il/rest/v2/shipments/create';
const HFD_CLIENT_NUMBER = parseInt(Deno.env.get('HFD_CLIENT_NUMBER') || '3399', 10);
const HFD_TOKEN = Deno.env.get('HFD_TOKEN') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL3J1bmNvbS5jby5pbC9jbGFpbXMvY2xpZW50bm8iOiIzMzk5IiwiaHR0cHM6Ly9ydW5jb20uY28uaWwvY2xhaW1zL3BocmFzZSI6IjdhMWExYmMxLTUwMTMtNGMwMS05OTEzLTJlZDk1NjVkMGYwYiIsImV4cCI6MTc2ODY0NjQ4OCwiaXNzIjoiaHR0cHM6Ly9ydW5jb20uY28uaWwiLCJhdWQiOiJodHRwczovL3J1bmNvbS5jby5pbCJ9.n9PRwZUUHrX721wzs6vss6xiCtioZND_zUu1TLVdQFE';
const HFD_API_TOKEN = Deno.env.get('HFD_API_TOKEN');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// טייפים
interface GovinaInput {
  code: 1 | 11;
  sum: number;
}

// The input now only needs the ID of the order we want to ship.
interface ShipmentInput {
  order_id: string;
}

interface HfdApiResponse {
  shipmentNumber?: number;
  parcel_id?: number;
  randNumber?: string;
  random_code?: string;
  errorCode?: number;
  errorMessage?: string;
  [key: string]: any;
}

const HFD_ERROR_MAP: Record<number, string> = {
  100: 'שם עיר לא תקין',
  200: 'שם רחוב לא תקין',
  500: 'מספר הזמנה כבר קיים במערכת',
  600: 'מספר הזמנה כבר קיים במערכת',
  800: 'חסר שם נמען',
  1500: 'לקוח לא רשאי להזמין',
  1600: 'אין מחיר לכתובת זו',
};

function validateIsraeliPhoneNumber(phone: string): boolean {
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  // Validates 10-digit mobile numbers and 9-digit landline numbers.
  return /^0[2-9]\d{7,8}$/.test(cleanedPhone);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// This validation now runs on the data from the fetched 'orders' table.
function validateInput(order: any): string[] {
  const errors: string[] = [];
  if (!order.customer_name) errors.push('שם הנמען (customer_name) חסר בהזמנה.');
  if (!order.customer_phone) {
    errors.push('טלפון הנמען (customer_phone) חסר בהזמנה.');
  } else if (!validateIsraeliPhoneNumber(order.customer_phone)) {
    errors.push('פורמט הטלפון בהזמנה אינו תקין.');
  }
  if (!order.shipping_address?.city) errors.push('שם העיר (city) חסר בכתובת המשלוח.');
  if (!order.shipping_address?.street) errors.push('שם הרחוב (street) חסר בכתובת המשלוח.');
  if (order.customer_email && !validateEmail(order.customer_email)) {
    errors.push('כתובת האימייל בהזמנה אינה תקינה.');
  }
  // Govina validation can be added here if needed in the future.
  return errors;
}

// The mapping now uses the order object instead of a shipment object.
function mapToHfdPayload(order: any) {
  const address = order.shipping_address || {};
  return {
    clientNumber: HFD_CLIENT_NUMBER,
    mesiraIsuf: 'מסירה',
    shipmentTypeCode: 35,
    ordererName: 'SwiftPick Delivery', // This will be replaced by the user's company name
    cargoTypeHaloch: 10,
    nameTo: order.customer_name || '',
    cityName: address.city || '',
    streetName: address.street || '',
    houseNum: address.street_number || '',
    apartment: address.apartment || '',
    telFirst: order.customer_phone || '',
    email: order.customer_email || '',
    productsPrice: order.total_amount || 0,
    shipmentWeight: order.weight || 0,
    referenceNum1: order.order_number || '',
    referenceNum2: '',
    // Govina logic can be added here if needed
    // deliveryAddress: can be built from address parts if required
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // The request body now contains just the order_id
    const { order_id }: ShipmentInput = await req.json();

    // Get user from session for security
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!order_id) {
      return new Response(JSON.stringify({ success: false, error: 'order_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch the order from the database to get all its details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch order or order not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Fetch user profile for company name
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('id', user.id)
        .single();

    if (profileError || !profile?.company_name) {
      console.error('Profile fetch error:', profileError);
       return new Response(JSON.stringify({ success: false, error: 'Could not find user profile or company name is not set.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate the data we got from the order
    const validationErrors = validateInput(order);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'Order data is invalid and cannot be shipped', validationErrors }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Map data from the fetched order to the HFD API payload
    const hfdPayload = {
      ...mapToHfdPayload(order),
      ordererName: profile.company_name,
    };
    console.log('HFD Payload:', hfdPayload);
    // קריאה ל-HFD
    const hfdRes = await fetch(HFD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HFD_TOKEN}`,
      },
      body: JSON.stringify(hfdPayload),
    });
    const hfdData: HfdApiResponse = await hfdRes.json();
    console.log('HFD Response:', hfdData);
    if (!hfdRes.ok || hfdData.errorCode) {
      const errorMsg = hfdData.errorCode && HFD_ERROR_MAP[hfdData.errorCode]
        ? HFD_ERROR_MAP[hfdData.errorCode]
        : hfdData.errorMessage || 'שגיאה לא ידועה מהשירות של HFD';
      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Save the new shipment to the database, linking it to the order
    const { data: newShipment, error: insertError } = await supabase
      .from('shipments')
      .insert({
        user_id: user.id,
        order_id: order.id,
        status: 'created',
        shipment_data: hfdPayload,
        hfd_shipment_number: String(hfdData.shipmentNumber || hfdData.parcel_id),
        tracking_number: String(hfdData.shipmentNumber || hfdData.parcel_id),
      })
      .select()
      .single();

    if (insertError) {
      console.error('DB Error:', insertError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save shipment to database' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // If shipment is created successfully, update the order status
    await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', order.id);

    // לוג סטטוס
    await supabase.from('shipment_status_log').insert({
      shipment_id: newShipment.id,
      status: 'created',
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'המשלוח נוצר בהצלחה!',
      shipment: {
        id: newShipment.id,
        hfdShipmentNumber: newShipment.hfd_shipment_number,
        status: newShipment.status,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unhandled Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'שגיאה פנימית בשרת' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 