
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

    const { userId } = await req.json();
    
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

    // Fetch albums from Google Photos API
    const photosResponse = await fetch(
      'https://photoslibrary.googleapis.com/v1/albums?pageSize=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!photosResponse.ok) {
      const errorData = await photosResponse.text();
      console.error('Google Photos API error:', errorData);
      throw new Error(`Google Photos API error: ${photosResponse.status}`);
    }

    const photosData = await photosResponse.json();
    const albums = photosData.albums || [];

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
      await supabaseClient
        .from('photo_albums')
        .delete()
        .eq('user_id', userId);

      // Insert new albums
      const { error: insertError } = await supabaseClient
        .from('photo_albums')
        .insert(albumInserts);

      if (insertError) {
        console.error('Error inserting albums:', insertError);
        throw insertError;
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
