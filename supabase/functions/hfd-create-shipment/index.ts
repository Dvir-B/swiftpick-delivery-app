import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const requestData = await req.json();
    console.log('Request data:', requestData);

    // For now, return a test response to confirm CORS is working
    const testResponse = {
      success: true,
      message: 'Edge Function is working with CORS!',
      received: requestData,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(testResponse), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500
    });
  }
}); 