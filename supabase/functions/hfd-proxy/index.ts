
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const HFD_API_BASE_URL = "https://test.hfd.co.il/RunCom.WebAPI/api/v1";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, payload } = await req.json();
    if (!endpoint || !payload) {
      throw new Error('Missing endpoint or payload in request body');
    }

    const url = `${HFD_API_BASE_URL}/${endpoint}`;
    
    const hfdResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await hfdResponse.json();

    if (!hfdResponse.ok) {
      const errorMessage = responseData.errorMessage || responseData.message || JSON.stringify(responseData);
      throw new Error(`HFD API Error (${hfdResponse.status}): ${errorMessage}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('HFD Proxy Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
