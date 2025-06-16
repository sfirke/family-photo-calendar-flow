
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

    const { userId, action, calendarId } = await req.json();
    
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

    let accessToken = profile.google_access_token;

    // Handle webhook setup
    if (action === 'setup-webhooks') {
      console.log('Setting up webhooks for user:', userId);
      
      // Get list of calendars first
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
        throw new Error(`Failed to fetch calendars: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const webhookResults = [];

      // Set up webhook for each calendar
      for (const calendar of calendarsData.items || []) {
        try {
          const webhookPayload = {
            id: `${userId}-${calendar.id}-${Date.now()}`,
            type: 'web_hook',
            address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-webhook`,
            token: `${userId}:${calendar.id}`
          };

          const webhookResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events/watch`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload)
            }
          );

          if (webhookResponse.ok) {
            const webhookData = await webhookResponse.json();
            webhookResults.push({
              calendarId: calendar.id,
              success: true,
              channelId: webhookData.id,
              expiration: webhookData.expiration
            });
            console.log(`Webhook set up for calendar ${calendar.id}`);
          } else {
            console.error(`Failed to set up webhook for calendar ${calendar.id}:`, await webhookResponse.text());
            webhookResults.push({
              calendarId: calendar.id,
              success: false,
              error: `HTTP ${webhookResponse.status}`
            });
          }
        } catch (error) {
          console.error(`Error setting up webhook for calendar ${calendar.id}:`, error);
          webhookResults.push({
            calendarId: calendar.id,
            success: false,
            error: error.message
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          webhookResults,
          message: 'Webhook setup completed'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Handle list calendars action
    if (action === 'list-calendars') {
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

    // Default action: sync events (with optional specific calendar)
    const targetCalendarId = calendarId || 'primary';
    console.log(`Syncing events for calendar: ${targetCalendarId}`);

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=` + 
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

    // Store events in our database with proper all-day and multi-day event handling
    const eventInserts = events.map((event: any) => {
      // Check if this is an all-day event
      const isAllDay = event.start?.date && !event.start?.dateTime;
      
      let startTime, endTime;
      
      if (isAllDay) {
        // For all-day events, use the date and set time to indicate all-day
        const startDate = new Date(event.start.date);
        const endDate = new Date(event.end.date);
        
        // Set start time to beginning of day
        startTime = new Date(startDate).toISOString();
        // Set end time to end of day (or beginning of next day as provided by Google)
        endTime = new Date(endDate).toISOString();
        
        // Check if this is a multi-day event
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1) {
          console.log(`Processing multi-day all-day event: ${event.summary} spanning ${daysDiff} days from ${event.start.date} to ${event.end.date}`);
        } else {
          console.log(`Processing single all-day event: ${event.summary} on ${event.start.date}`);
        }
      } else {
        // For regular events with specific times
        startTime = event.start?.dateTime || event.start?.date;
        endTime = event.end?.dateTime || event.end?.date;
        
        // Check if this is a multi-day timed event
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);
        const daysDiff = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          console.log(`Processing multi-day timed event: ${event.summary} spanning ${daysDiff} days from ${startTime} to ${endTime}`);
        } else {
          console.log(`Processing single-day timed event: ${event.summary} from ${startTime} to ${endTime}`);
        }
      }

      return {
        user_id: userId,
        google_event_id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        start_time: startTime,
        end_time: endTime,
        location: event.location || null,
        attendees: event.attendees || [],
        calendar_id: targetCalendarId,
        is_all_day: isAllDay
      };
    });

    if (eventInserts.length > 0) {
      // Delete existing events for this calendar and user to avoid duplicates
      await supabaseClient
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('calendar_id', targetCalendarId);

      // Insert new events
      const { error: insertError } = await supabaseClient
        .from('calendar_events')
        .insert(eventInserts);

      if (insertError) {
        console.error('Error inserting events:', insertError);
        throw insertError;
      }
    }

    const allDayCount = eventInserts.filter(event => event.is_all_day).length;
    const timedCount = eventInserts.length - allDayCount;
    
    // Count multi-day events
    const multiDayCount = eventInserts.filter(event => {
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 1;
    }).length;
    
    console.log(`Successfully synced ${events.length} calendar events for user ${userId}, calendar ${targetCalendarId}`);
    console.log(`Breakdown: ${allDayCount} all-day events, ${timedCount} timed events, ${multiDayCount} multi-day events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: eventInserts,
        count: events.length,
        allDayCount,
        timedCount,
        multiDayCount,
        calendarId: targetCalendarId
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
