
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-resource-uri',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get webhook headers from Google
    const channelId = req.headers.get('x-goog-channel-id');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceUri = req.headers.get('x-goog-resource-uri');
    const channelToken = req.headers.get('x-goog-channel-token');

    console.log('Webhook received:', {
      channelId,
      resourceState,
      resourceUri,
      channelToken,
      method: req.method
    });

    // Verify the webhook is from Google (basic verification)
    if (!channelId || !resourceState) {
      console.log('Invalid webhook - missing required headers');
      return new Response('Invalid webhook', { status: 400, headers: corsHeaders });
    }

    // Extract calendar ID and user ID from channel token
    // Format: userId:calendarId
    if (!channelToken) {
      console.log('Missing channel token');
      return new Response('Missing token', { status: 400, headers: corsHeaders });
    }

    const [userId, calendarId] = channelToken.split(':');
    if (!userId || !calendarId) {
      console.log('Invalid channel token format');
      return new Response('Invalid token format', { status: 400, headers: corsHeaders });
    }

    // Handle different resource states
    if (resourceState === 'exists') {
      console.log(`Calendar ${calendarId} updated for user ${userId}`);
      
      // Trigger a sync for this user's calendar
      const { error: syncError } = await supabaseClient.functions.invoke('sync-google-calendar', {
        body: { userId, calendarId }
      });

      if (syncError) {
        console.error('Error triggering sync:', syncError);
      } else {
        console.log('Sync triggered successfully');
      }

      // Store webhook event for potential client notification
      const { error: insertError } = await supabaseClient
        .from('webhook_events')
        .insert({
          user_id: userId,
          calendar_id: calendarId,
          event_type: 'calendar_updated',
          resource_state: resourceState,
          processed_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing webhook event:', insertError);
      }
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
