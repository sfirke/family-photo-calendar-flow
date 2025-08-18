// Supabase Edge Function: iCal Proxy
// Fetches remote iCal (ICS) resources server-side to bypass browser CORS restrictions.
// Usage:
//   GET /functions/v1/ical-proxy?url=<encoded_ics_url>
// Environment:
//   (Optional) ALLOWED_ICAL_HOSTS comma separated list. Defaults include common calendar hosts.
// Security:
//   - Restricts outbound fetches to allowed hostnames.
//   - Basic rate limiting per IP.
//   - Strips Set-Cookie headers.
// Returns:
//   200 text/calendar (or text/plain) with Access-Control-Allow-Origin:* on success.

// deno-lint-ignore-file no-explicit-any
// @ts-expect-error Deno deploy provides this remote module at runtime; type defs not bundled
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

const DEFAULT_ALLOWED = [
  'calendar.google.com',
  'www.google.com',
  'outlook.live.com',
  'office365.com',
  'graph.microsoft.com',
  'p50-calendars.icloud.com',
  'p51-calendars.icloud.com',
  'caldav.icloud.com'
];

// @ts-expect-error Deno global available in Edge runtime when executed
const envAllowed = (Deno.env.get('ALLOWED_ICAL_HOSTS') || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const ALLOWED = new Set([...DEFAULT_ALLOWED, ...envAllowed]);

interface RateState { count: number; reset: number }
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP
const rateMap = new Map<string, RateState>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  let st = rateMap.get(key);
  if (!st || now > st.reset) {
    st = { count: 1, reset: now + RATE_LIMIT_WINDOW };
    rateMap.set(key, st);
    return false;
  }
  if (st.count >= RATE_LIMIT_MAX) return true;
  st.count++;
  return false;
}

function errorResponse(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function sanitizeUrl(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const urlObj = new URL(req.url);
  const targetParam = urlObj.searchParams.get('url');
  const target = sanitizeUrl(targetParam);
  if (!target) {
    return errorResponse('Missing or invalid url parameter');
  }

  if (!ALLOWED.has(target.hostname)) {
    return errorResponse(`Host not allowed: ${target.hostname}`, 403);
  }

  const ip = req.headers.get('x-forwarded-for') || 'anon';
  if (isRateLimited(ip)) {
    return errorResponse('Rate limit exceeded', 429);
  }

  // Basic allowlist for schemes
  if (target.protocol !== 'https:') {
    return errorResponse('Only https URLs are permitted');
  }

  // Fetch ICS
  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: {
        'Accept': 'text/calendar, text/plain, */*',
        'User-Agent': 'FamilyCalendarICSProxy/1.0'
      }
    });
  } catch (e) {
    return errorResponse('Upstream fetch failed: ' + (e instanceof Error ? e.message : 'unknown'), 502);
  }

  if (!upstream.ok) {
    return errorResponse(`Upstream responded ${upstream.status}`, 502);
  }

  const text = await upstream.text();
  // Minimal verification
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    return errorResponse('Response does not appear to be a VCALENDAR payload', 422);
  }

  return new Response(text, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': upstream.headers.get('content-type')?.includes('text') ? upstream.headers.get('content-type')! : 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
});
