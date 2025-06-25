
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, action, calendarId, manualSync, timeMin, timeMax, extendedRange, profileData } = await req.json();
    
    if (!userId) {
      console.error('User ID is required');
      return new Response(
        JSON.stringify({ 
          error: 'User ID is required',
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`Processing request for user: ${userId}, action: ${action || 'sync'}`);

    // Handle profile storage action (for storing Google tokens after auth)
    if (action === 'store-profile') {
      console.log('Storing profile data for user:', userId);
      
      if (!profileData) {
        console.error('Profile data is required for store-profile action');
        return new Response(
          JSON.stringify({ 
            error: 'Profile data is required for store-profile action',
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      const { error: upsertError } = await supabaseClient
        .from('profiles')
        .upsert({
          id: userId,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          google_access_token: profileData.google_access_token,
          google_refresh_token: profileData.google_refresh_token,
          google_token_expires_at: profileData.google_token_expires_at
        });

      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        return new Response(
          JSON.stringify({ 
            error: `Failed to store profile: ${upsertError.message}`,
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      console.log('Profile stored successfully for user:', userId);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Profile stored successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Get user's Google access token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user profile. Please reconnect your Google account.',
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    if (!profile?.google_access_token) {
      console.error('No Google access token found for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Google access token not found. Please reconnect your Google account.',
          success: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    let accessToken = profile.google_access_token;
    console.log('Found Google access token for user:', userId);

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
        console.error('Failed to fetch calendars for webhook setup:', calendarsResponse.status);
        return new Response(
          JSON.stringify({ 
            error: `Failed to fetch calendars: ${calendarsResponse.status}`,
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: calendarsResponse.status 
          }
        );
      }

      const calendarsData = await calendarsResponse.json();
      const webhookResults = [];

      // Set up webhook for each calendar
      for (const calendar of calendarsData.items || []) {
        try {
          // Create a valid channel ID (only alphanumeric, dash, underscore, plus, forward slash, equals)
          const channelId = `${userId.replace(/[^a-zA-Z0-9]/g, '')}_${calendar.id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`.substring(0, 64);
          
          const webhookPayload = {
            id: channelId,
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
      console.log('Listing calendars for user:', userId);
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
        return new Response(
          JSON.stringify({ 
            error: `Google Calendar API error: ${calendarsResponse.status}`,
            success: false 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: calendarsResponse.status 
          }
        );
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

    // Default action: sync events from all calendars or specific calendar
    console.log('Starting calendar sync for user:', userId);
    
    // Get list of all calendars with their names first
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let calendarsToSync = [];
    let calendarNameMap = new Map();

    if (calendarsResponse.ok) {
      const calendarsData = await calendarsResponse.json();
      calendarsToSync = calendarsData.items || [];
      
      // Create a map of calendar ID to human-readable name
      calendarsToSync.forEach((cal: any) => {
        calendarNameMap.set(cal.id, cal.summary || cal.id);
      });
    } else {
      console.error('Failed to fetch calendars, using primary calendar as fallback');
      // Fallback to primary calendar
      calendarsToSync = [{ id: 'primary', summary: 'Primary Calendar' }];
      calendarNameMap.set('primary', 'Primary Calendar');
    }

    // If specific calendar is requested, filter the list
    if (calendarId) {
      calendarsToSync = calendarsToSync.filter((cal: any) => cal.id === calendarId);
    }

    // Set up date range for sync
    let syncTimeMin, syncTimeMax;
    if (manualSync && extendedRange) {
      syncTimeMin = timeMin;
      syncTimeMax = timeMax;
    } else {
      // Default: next 2 months
      const now = new Date();
      syncTimeMin = now.toISOString();
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + 2);
      syncTimeMax = futureDate.toISOString();
    }

    console.log(`Syncing events from ${syncTimeMin} to ${syncTimeMax} for ${calendarsToSync.length} calendars`);

    // Clear existing events for this user to avoid duplicates
    const { error: deleteError } = await supabaseClient
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error clearing existing events:', deleteError);
    }

    let totalEventCount = 0;
    let allDayCount = 0;
    let timedCount = 0;
    let multiDayCount = 0;

    // Sync events from each calendar
    for (const calendar of calendarsToSync) {
      try {
        const eventsUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?maxResults=250&orderBy=startTime&singleEvents=true&timeMin=${syncTimeMin}&timeMax=${syncTimeMax}`;
        
        const calendarResponse = await fetch(eventsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!calendarResponse.ok) {
          console.error(`Failed to fetch events for calendar ${calendar.id}:`, calendarResponse.status);
          continue;
        }

        const calendarData = await calendarResponse.json();
        const events = calendarData.items || [];

        // Get human-readable calendar name
        const calendarName = calendarNameMap.get(calendar.id) || calendar.summary || calendar.id;

        // Process events for this calendar
        const eventInserts = events.map((event: any) => {
          const isAllDay = event.start?.date && !event.start?.dateTime;
          
          let startTime, endTime;
          
          if (isAllDay) {
            const startDate = new Date(event.start.date);
            const endDate = new Date(event.end.date);
            startTime = startDate.toISOString();
            endTime = endDate.toISOString();
            
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > 1) {
              multiDayCount++;
            }
            allDayCount++;
          } else {
            startTime = event.start?.dateTime || event.start?.date;
            endTime = event.end?.dateTime || event.end?.date;
            
            const startDateTime = new Date(startTime);
            const endDateTime = new Date(endTime);
            const daysDiff = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 1) {
              multiDayCount++;
            }
            timedCount++;
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
            calendar_id: calendar.id,
            calendar_name: calendarName,
            is_all_day: isAllDay
          };
        });

        if (eventInserts.length > 0) {
          const { error: insertError } = await supabaseClient
            .from('calendar_events')
            .insert(eventInserts);

          if (insertError) {
            console.error(`Error inserting events for calendar ${calendar.id}:`, insertError);
          } else {
            totalEventCount += eventInserts.length;
            console.log(`Synced ${eventInserts.length} events from calendar "${calendarName}" (${calendar.id})`);
          }
        }
      } catch (error) {
        console.error(`Error syncing calendar ${calendar.id}:`, error);
      }
    }

    console.log(`Successfully synced ${totalEventCount} total events for user ${userId}`);
    console.log(`Breakdown: ${allDayCount} all-day events, ${timedCount} timed events, ${multiDayCount} multi-day events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventCount: totalEventCount,
        allDayCount,
        timedCount,
        multiDayCount,
        calendarsCount: calendarsToSync.length,
        syncRange: { timeMin: syncTimeMin, timeMax: syncTimeMax },
        calendars: calendarsToSync.map((cal: any) => ({
          id: cal.id,
          name: calendarNameMap.get(cal.id) || cal.summary || cal.id
        }))
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
