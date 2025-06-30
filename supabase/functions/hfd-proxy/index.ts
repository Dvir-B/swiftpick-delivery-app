import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const HFD_API_BASE_URL = "https://api.hfd.co.il/rest/v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, payload, token } = await req.json();
    
    if (!endpoint || !payload) {
      throw new Error('Missing endpoint or payload in request body');
    }

    if (!token) {
      throw new Error('Missing HFD authentication token');
    }

    console.log(`HFD Proxy: Making request to ${endpoint} with payload:`, JSON.stringify(payload, null, 2));

    const url = `${HFD_API_BASE_URL}${endpoint}`;
    console.log(`HFD Proxy: Full URL: ${url}`);
    
    // Enhanced retry mechanism with better error handling
    let lastError;
    const maxRetries = 3;
    const baseDelay = 2000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`HFD Proxy: Attempt ${attempt}/${maxRetries} to ${url}`);
        
        // Create the request with proper authentication
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function/1.0)',
            'Cache-Control': 'no-cache',
            'Connection': 'close'
          },
          body: JSON.stringify(payload),
        };

        console.log('HFD Proxy: Request headers:', JSON.stringify({
          ...requestOptions.headers,
          'Authorization': 'Bearer [REDACTED]' // Don't log the actual token
        }, null, 2));
        console.log('HFD Proxy: Request body length:', requestOptions.body.length);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('HFD Proxy: Request timeout after 30 seconds');
          controller.abort();
        }, 30000);
        
        const hfdResponse = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log(`HFD Proxy: Response status: ${hfdResponse.status}`);
        console.log(`HFD Proxy: Response statusText: ${hfdResponse.statusText}`);
        console.log(`HFD Proxy: Response headers:`, Object.fromEntries(hfdResponse.headers.entries()));
        
        if (!hfdResponse.ok) {
          const errorText = await hfdResponse.text();
          console.error(`HFD API Error (${hfdResponse.status}):`, errorText);
          
          // For client errors (4xx), don't retry
          if (hfdResponse.status >= 400 && hfdResponse.status < 500) {
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }
            
            return new Response(JSON.stringify({ 
              error: `HFD API Error (${hfdResponse.status}): ${errorData.message || errorText}`,
              status: hfdResponse.status,
              details: errorData
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400, // Return 400 for client errors instead of 500
            });
          }
          
          // For server errors (5xx), retry
          if (hfdResponse.status >= 500 && attempt < maxRetries) {
            throw new Error(`Server error ${hfdResponse.status}, will retry`);
          }
          
          throw new Error(`HFD API Error (${hfdResponse.status}): ${errorText}`);
        }

        const responseText = await hfdResponse.text();
        console.log('HFD Proxy: Raw response:', responseText);

        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse HFD response as JSON:', parseError);
          console.log('Response was:', responseText);
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
        console.error(`HFD Proxy: Error name: ${error.name}`);
        console.error(`HFD Proxy: Error stack:`, error.stack);
        
        // Check if it's a network/timeout error that we should retry
        const isRetryableError = error.name === 'AbortError' || 
                                error.message.includes('network') ||
                                error.message.includes('timeout') ||
                                error.message.includes('connection') ||
                                error.message.includes('Server error') ||
                                error.message.includes('fetch');
        
        console.log(`HFD Proxy: Is retryable error: ${isRetryableError}`);
        
        if (attempt < maxRetries && isRetryableError) {
          const delay = baseDelay * attempt;
          console.log(`HFD Proxy: Waiting ${delay}ms before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (!isRetryableError) {
          console.log('HFD Proxy: Non-retryable error, breaking retry loop');
          break;
        }
      }
    }

    // If we get here, all retries failed
    console.error('HFD Proxy: All retries exhausted, final error:', lastError?.message);
    throw lastError;

  } catch (error) {
    console.error('HFD Proxy Final Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error information
    const errorResponse = {
      error: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString(),
      details: 'Check function logs for more information',
      suggestion: error.name === 'TypeError' && error.message.includes('fetch') 
        ? 'This appears to be a network connectivity issue. Please verify the HFD API endpoint is accessible.'
        : 'Please check your HFD credentials and API endpoint configuration.'
    };
    
    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
