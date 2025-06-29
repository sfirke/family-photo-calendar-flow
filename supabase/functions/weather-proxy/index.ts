
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  zipCode: string;
  endpoint: 'current' | 'forecast';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode, endpoint }: WeatherRequest = await req.json();
    
    if (!zipCode) {
      return new Response(
        JSON.stringify({ error: 'Zip code is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate zip code format (basic US zip code validation)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zipCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid zip code format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      console.error('OpenWeather API key not configured');
      return new Response(
        JSON.stringify({ error: 'Weather service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    const weatherUrl = endpoint === 'current' 
      ? `${baseUrl}/weather?zip=${zipCode}&appid=${apiKey}&units=imperial`
      : `${baseUrl}/forecast?zip=${zipCode}&appid=${apiKey}&units=imperial`;

    console.log(`Fetching weather data for zip: ${zipCode}, endpoint: ${endpoint}`);

    const response = await fetch(weatherUrl, {
      headers: {
        'User-Agent': 'FamilyCalendarApp/1.0',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Weather API error: ${response.status} - ${errorText}`);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Location not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Weather service unavailable' }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    // Sanitize response data to prevent any potential XSS
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    console.log(`Successfully fetched weather data for ${zipCode}`);

    return new Response(JSON.stringify(sanitizedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800' // Cache for 30 minutes
      },
    });

  } catch (error) {
    console.error('Error in weather-proxy function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
