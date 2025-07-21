import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  zipCode: string;
  apiKey: string;
  locationKey?: string;
}

interface CachedWeatherData {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for weather data (5-minute TTL)
const weatherCache = new Map<string, CachedWeatherData>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(apiKey: string): string {
  return `rate_limit_${apiKey}`;
}

function isRateLimited(apiKey: string): boolean {
  const key = getRateLimitKey(apiKey);
  const now = Date.now();
  const limit = rateLimitMap.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  limit.count++;
  return false;
}

function getCacheKey(zipCode: string, apiKey: string): string {
  return `${zipCode}_${apiKey}`;
}

function getCachedData(cacheKey: string): any | null {
  const cached = weatherCache.get(cacheKey);
  if (!cached) return null;

  const now = Date.now();
  if (now > cached.expiresAt) {
    weatherCache.delete(cacheKey);
    return null;
  }

  console.log(`Cache hit for key: ${cacheKey}`);
  return cached.data;
}

function setCachedData(cacheKey: string, data: any): void {
  const now = Date.now();
  weatherCache.set(cacheKey, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL
  });
  console.log(`Data cached for key: ${cacheKey}`);
}

async function getLocationKey(zipCode: string, apiKey: string): Promise<string> {
  const url = `http://dataservice.accuweather.com/locations/v1/postalcodes/search?apikey=${apiKey}&q=${zipCode}`;
  
  console.log(`Fetching location key for zip: ${zipCode}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get location key: ${response.status} ${response.statusText}`);
  }

  const locations = await response.json();
  if (!locations || locations.length === 0) {
    throw new Error(`No location found for zip code: ${zipCode}`);
  }

  const locationKey = locations[0].Key;
  console.log(`Location key found: ${locationKey} for zip: ${zipCode}`);
  return locationKey;
}

async function fetchCurrentConditions(locationKey: string, apiKey: string): Promise<any> {
  const url = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`;
  
  console.log(`Fetching current conditions for location: ${locationKey}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch current conditions: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data[0] || null;
}

async function fetchForecast(locationKey: string, apiKey: string): Promise<any> {
  const url = `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${apiKey}&details=true&metric=false`;
  
  console.log(`Fetching 5-day forecast for location: ${locationKey}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function fetchWeatherData(zipCode: string, apiKey: string, providedLocationKey?: string): Promise<any> {
  let locationKey = providedLocationKey;

  // Get location key if not provided
  if (!locationKey) {
    locationKey = await getLocationKey(zipCode, apiKey);
  }

  // Fetch both current conditions and forecast concurrently
  const [currentConditions, forecast] = await Promise.all([
    fetchCurrentConditions(locationKey, apiKey),
    fetchForecast(locationKey, apiKey)
  ]);

  return {
    locationKey,
    current: currentConditions,
    forecast: forecast,
    lastUpdated: new Date().toISOString()
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }

  try {
    const { zipCode, apiKey, locationKey }: WeatherRequest = await req.json();

    if (!zipCode || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: zipCode and apiKey' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Check rate limiting
    if (isRateLimited(apiKey)) {
      console.log(`Rate limit exceeded for API key: ${apiKey.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const cacheKey = getCacheKey(zipCode, apiKey);

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return new Response(
        JSON.stringify({ 
          ...cachedData, 
          cached: true,
          cacheTimestamp: weatherCache.get(cacheKey)?.timestamp 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Fetch fresh data
    console.log(`Fetching fresh weather data for zip: ${zipCode}`);
    const weatherData = await fetchWeatherData(zipCode, apiKey, locationKey);

    // Cache the data
    setCachedData(cacheKey, weatherData);

    // Clean up old cache entries periodically
    if (weatherCache.size > 100) {
      const now = Date.now();
      for (const [key, cached] of weatherCache.entries()) {
        if (now > cached.expiresAt) {
          weatherCache.delete(key);
        }
      }
    }

    return new Response(
      JSON.stringify({ ...weatherData, cached: false }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Weather proxy error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch weather data';
    let statusCode = 500;

    if (error.message.includes('location key')) {
      errorMessage = 'Invalid zip code or location not found';
      statusCode = 400;
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMessage = 'Invalid API key or access denied';
      statusCode = 401;
    } else if (error.message.includes('429')) {
      errorMessage = 'API rate limit exceeded. Please try again later.';
      statusCode = 429;
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);