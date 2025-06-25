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

    const { userId, action, calendarId, manualSync, timeMin, timeMax, extendedRange } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Sync request:', { userId, action, manualSync, extendedRange });

    // Get user's Google access token from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // For hybrid users, tokens might not be stored in profiles yet
      return new Response(
        JSON.stringify({ 
          error: 'Google Calendar not connected. Please connect your Google account in settings.',
          success: false,
          requiresConnection: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Return 200 instead of 500 for better error handling
        }
      );
    }

    if (!profile?.google_access_token) {
      console.log('No Google access token found for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Google Calendar not connected. Please connect your Google account in settings.',
          success: false,
          requiresConnection: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    let accessToken = profile.google_access_token;

    // Check if token is expired and refresh if needed
    if (profile.google_token_expires_at) {
      const expiresAt = new Date(profile.google_token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now && profile.google_refresh_token) {
        console.log('Token expired, attempting refresh...');
        // Token refresh logic would go here
        // For now, we'll proceed with existing token
      }
    }

    // Handle webhook setup
    if (action === 'setup-webhooks') {
      console.log('Setting up webhooks for user:', userId);
      
      try {
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
          const errorText = await calendarsResponse.text();
          console.error('Failed to fetch calendars:', calendarsResponse.status, errorText);
          throw new Error(`Failed to fetch calendars: ${calendarsResponse.status}`);
        }

        const calendarsData = await calendarsResponse.json();
        const webhookResults = [];

        // Set up webhook for primary calendar only (to avoid quota issues)
        const primaryCalendar = calendarsData.items?.find((cal: any) => cal.primary) || calendarsData.items?.[0];
        
        if (primaryCalendar) {
          try {
            const channelId = `${userId.replace(/[^a-zA-Z0-9]/g, '')}_${primaryCalendar.id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`.substring(0, 64);
            
            const webhookPayload = {
              id: channelId,
              type: 'web_hook',
              address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-webhook`,
              token: `${userId}:${primaryCalendar.id}`
            };

            const webhookResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primaryCalendar.id)}/events/watch`,
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
                calendarId: primaryCalendar.id,
                success: true,
                channelId: webhookData.id,
                expiration: webhookData.expiration
              });
              console.log(`Webhook set up for primary calendar ${primaryCalendar.id}`);
            } else {
              const errorText = await webhookResponse.text();
              console.error(`Failed to set up webhook for primary calendar:`, errorText);
              webhookResults.push({
                calendarId: primaryCalendar.id,
                success: false,
                error: `HTTP ${webhookResponse.status}`
              });
            }
          } catch (error) {
            console.error(`Error setting up webhook for primary calendar:`, error);
            webhookResults.push({
              calendarId: primaryCalendar.id,
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
      } catch (error) {
        console.error('Webhook setup error:', error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to set up webhooks. Manual sync is still available.',
            webhookResults: []
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
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
    await supabaseClient
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);

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
            calendar_name: calendarName, // Store human-readable name
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
