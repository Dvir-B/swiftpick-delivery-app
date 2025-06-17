
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

    console.log(`HFD Proxy: Making request to ${endpoint} with payload:`, JSON.stringify(payload, null, 2));

    const url = `${HFD_API_BASE_URL}/${endpoint}`;
    
    // Retry mechanism for network issues
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`HFD Proxy: Attempt ${attempt} to ${url}`);
        
        const hfdResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WixIntegration/1.0'
          },
          body: JSON.stringify(payload),
        });

        console.log(`HFD Proxy: Response status: ${hfdResponse.status}`);
        
        if (!hfdResponse.ok) {
          const errorText = await hfdResponse.text();
          console.error(`HFD API Error (${hfdResponse.status}):`, errorText);
          
          // Try to parse as JSON for better error message
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          throw new Error(`HFD API Error (${hfdResponse.status}): ${errorData.message || errorText}`);
        }

        const responseData = await hfdResponse.json();
        console.log('HFD Proxy: Success response:', JSON.stringify(responseData, null, 2));

        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        lastError = error;
        console.error(`HFD Proxy: Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error('HFD Proxy Final Error:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
