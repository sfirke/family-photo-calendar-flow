
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { userId, action } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's Google access token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.google_access_token) {
      throw new Error('Google access token not found. Please reconnect your Google account.');
    }

    // Check if token is expired and refresh if needed
    let accessToken = profile.google_access_token;
    const expiresAt = profile.google_token_expires_at ? new Date(profile.google_token_expires_at) : null;
    
    if (expiresAt && expiresAt < new Date() && profile.google_refresh_token) {
      console.log('Refreshing expired Google token');
      // Token refresh logic would go here in a real implementation
      // For now, we'll use the existing token and let Google API handle the error
    }

    // Handle different actions
    if (action === 'list-calendars') {
      // Fetch calendar list from Google Calendar API
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!calendarsResponse.ok) {
        const errorData = await calendarsResponse.text();
        console.error('Google Calendar API error:', errorData);
        throw new Error(`Google Calendar API error: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];

      return new Response(
        JSON.stringify({ 
          success: true, 
          calendars: calendars.map((cal: any) => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary || false
          }))
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Default action: sync events
    // Fetch calendar events from Google Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=' + 
      new Date().toISOString(),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.text();
      console.error('Google Calendar API error:', errorData);
      throw new Error(`Google Calendar API error: ${calendarResponse.status}`);
    }

    const calendarData = await calendarResponse.json();
    const events = calendarData.items || [];

    // Store events in our database
    const eventInserts = events.map((event: any) => ({
      user_id: userId,
      google_event_id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || null,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      attendees: event.attendees || [],
      calendar_id: 'primary'
    }));

    if (eventInserts.length > 0) {
      // Delete existing events for this user to avoid duplicates
      await supabaseClient
        .from('calendar_events')
        .delete()
        .eq('user_id', userId);

      // Insert new events
      const { error: insertError } = await supabaseClient
        .from('calendar_events')
        .insert(eventInserts);

      if (insertError) {
        console.error('Error inserting events:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully synced ${events.length} calendar events for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: eventInserts,
        count: events.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in sync-google-calendar:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
