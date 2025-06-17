
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
    
    // Enhanced retry mechanism with better error handling
    let lastError;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`HFD Proxy: Attempt ${attempt}/${maxRetries} to ${url}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const hfdResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'WixIntegration/1.0',
            'Accept': 'application/json',
            'Connection': 'keep-alive'
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log(`HFD Proxy: Response status: ${hfdResponse.status}`);
        console.log(`HFD Proxy: Response headers:`, Object.fromEntries(hfdResponse.headers.entries()));
        
        if (!hfdResponse.ok) {
          const errorText = await hfdResponse.text();
          console.error(`HFD API Error (${hfdResponse.status}):`, errorText);
          
          // Check if it's a server error that we should retry
          if (hfdResponse.status >= 500 && attempt < maxRetries) {
            throw new Error(`Server error ${hfdResponse.status}, will retry`);
          }
          
          // Try to parse as JSON for better error message
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          throw new Error(`HFD API Error (${hfdResponse.status}): ${errorData.message || errorText}`);
        }

        const responseText = await hfdResponse.text();
        console.log('HFD Proxy: Raw response:', responseText);

        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse HFD response as JSON:', parseError);
          // If it's not JSON, treat as success with the text response
          responseData = { message: responseText, success: true };
        }

        console.log('HFD Proxy: Parsed response:', JSON.stringify(responseData, null, 2));

        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        lastError = error;
        console.error(`HFD Proxy: Attempt ${attempt} failed:`, error.message);
        
        // Check if it's a network/timeout error that we should retry
        const isRetryableError = error.name === 'AbortError' || 
                                error.message.includes('network') ||
                                error.message.includes('timeout') ||
                                error.message.includes('connection') ||
                                error.message.includes('Server error');
        
        if (attempt < maxRetries && isRetryableError) {
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(`HFD Proxy: Waiting ${delay}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (!isRetryableError) {
          // Don't retry for non-network errors
          break;
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error('HFD Proxy Final Error:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      details: 'Check function logs for more information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
