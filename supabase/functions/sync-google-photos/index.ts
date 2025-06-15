
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

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      throw new Error('Invalid request body');
    }

    const { userId } = body;
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Starting Google Photos sync for user ${userId}`);

    // Get user's Google access token
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile?.google_access_token) {
      console.error('No Google access token found for user:', userId);
      throw new Error('Google access token not found. Please reconnect your Google account with Photos permission.');
    }

    // Check if token is expired and refresh if needed
    let accessToken = profile.google_access_token;
    const expiresAt = profile.google_token_expires_at ? new Date(profile.google_token_expires_at) : null;
    
    if (expiresAt && expiresAt < new Date() && profile.google_refresh_token) {
      console.log('Token expired, attempting to refresh');
      
      try {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            refresh_token: profile.google_refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          
          // Update the profile with new token
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              google_access_token: accessToken,
              google_token_expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString()
            })
            .eq('id', userId);
          
          if (updateError) {
            console.error('Failed to update refreshed token:', updateError);
          } else {
            console.log('Token refreshed successfully');
          }
        } else {
          const errorText = await refreshResponse.text();
          console.error('Failed to refresh token:', errorText);
          throw new Error('Failed to refresh Google access token. Please reconnect your Google account.');
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        throw new Error('Failed to refresh Google access token. Please reconnect your Google account.');
      }
    }

    console.log('Fetching albums from Google Photos API');

    // Fetch albums from Google Photos API
    let photosResponse;
    try {
      photosResponse = await fetch(
        'https://photoslibrary.googleapis.com/v1/albums?pageSize=50',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (fetchError) {
      console.error('Network error fetching albums:', fetchError);
      throw new Error('Network error connecting to Google Photos API');
    }

    if (!photosResponse.ok) {
      const errorData = await photosResponse.text();
      console.error('Google Photos API error:', photosResponse.status, errorData);
      
      if (photosResponse.status === 401) {
        throw new Error('Google access token is invalid or expired. Please reconnect your Google account.');
      } else if (photosResponse.status === 403) {
        throw new Error('Insufficient permissions to access Google Photos. Please reconnect your Google account and grant Photos access.');
      } else if (photosResponse.status >= 500) {
        throw new Error('Google Photos service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`Google Photos API error: ${photosResponse.status}`);
    }

    let photosData;
    try {
      photosData = await photosResponse.json();
    } catch (parseError) {
      console.error('Failed to parse Google Photos response:', parseError);
      throw new Error('Invalid response from Google Photos API');
    }

    const albums = photosData.albums || [];
    console.log(`Found ${albums.length} albums`);

    // Store albums in our database
    const albumInserts = albums.map((album: any) => ({
      user_id: userId,
      google_album_id: album.id,
      title: album.title || 'Untitled Album',
      cover_photo_url: album.coverPhotoBaseUrl || null,
      media_items_count: parseInt(album.mediaItemsCount) || 0
    }));

    if (albumInserts.length > 0) {
      // Delete existing albums for this user to avoid duplicates
      const { error: deleteError } = await supabaseClient
        .from('photo_albums')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing albums:', deleteError);
        // Don't throw here, continue with insert
      }

      // Insert new albums
      const { error: insertError } = await supabaseClient
        .from('photo_albums')
        .insert(albumInserts);

      if (insertError) {
        console.error('Error inserting albums:', insertError);
        throw new Error('Failed to save albums to database');
      }
    }

    console.log(`Successfully synced ${albums.length} photo albums for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        albums: albumInserts,
        count: albums.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in sync-google-photos:', error);
    
    // Return a proper error response with 200 status but success: false
    // This prevents the "non-2xx status code" error on the frontend
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Changed from 500 to 200 to avoid "non-2xx" error
      }
    );
  }
});
