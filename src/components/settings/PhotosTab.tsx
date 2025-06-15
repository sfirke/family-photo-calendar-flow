
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoAlbum {
  id: string;
  title: string;
  cover_photo_url?: string;
  media_items_count: number;
}

const PhotosTab = () => {
  const { user } = useAuth();
  const { backgroundDuration, setBackgroundDuration, selectedAlbum, setSelectedAlbum } = useSettings();
  const { toast } = useToast();
  
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (minutes: number) => {
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  const syncPhotos = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google Photos sync...');
      
      const { data, error: functionError } = await supabase.functions.invoke('sync-google-photos', {
        body: { userId: user.id }
      });

      console.log('Function response:', data, functionError);

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(functionError.message || 'Function call failed');
      }

      // Check if the response indicates an error even with 200 status
      if (data && !data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      if (data && data.success) {
        setAlbums(data.albums || []);
        setLastSync(new Date());
        toast({
          title: "Photos synced!",
          description: `Found ${data.count || 0} albums from your Google Photos.`,
        });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      console.error('Error syncing photos:', error);
      let errorMessage = error.message || 'Unable to sync your Google Photos. Please try again.';
      
      // Handle specific error cases
      if (errorMessage.includes('Google access token not found')) {
        errorMessage = 'Please reconnect your Google account with Photos permission from the Account tab.';
      } else if (errorMessage.includes('Insufficient permissions')) {
        errorMessage = 'Please reconnect your Google account and grant Photos access from the Account tab.';
      } else if (errorMessage.includes('Network error')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredAlbums = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('photo_albums')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading albums:', error);
        return;
      }
      
      setAlbums(data || []);
      
      // Check if we have albums and set last sync time
      if (data && data.length > 0) {
        setLastSync(new Date(data[0].created_at));
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadStoredAlbums();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Background Photos
          </CardTitle>
          <CardDescription>
            Sync and select a Google Photos album for rotating background images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {lastSync ? `Last synced: ${lastSync.toLocaleString()}` : 'Not synced yet'}
                </div>
                <Button
                  onClick={syncPhotos}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync Photos
                </Button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Sync Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('reconnect') && (
                      <p className="text-xs text-red-600 mt-1">
                        Go to Settings → Account tab to reconnect your Google account.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {albums.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium">Select Album for Background</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="album-select">Choose an album:</Label>
                    <Select value={selectedAlbum || ""} onValueChange={setSelectedAlbum}>
                      <SelectTrigger id="album-select">
                        <SelectValue placeholder="Select an album for background photos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No album selected</SelectItem>
                        {albums.map((album) => (
                          <SelectItem key={album.id} value={album.id}>
                            {album.title} ({album.media_items_count} items)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {albums.slice(0, 4).map((album) => (
                      <div key={album.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium truncate">{album.title}</div>
                        <div className="text-gray-600">
                          {album.media_items_count} items
                        </div>
                      </div>
                    ))}
                  </div>
                  {albums.length > 4 && (
                    <p className="text-xs text-gray-500">
                      Showing 4 of {albums.length} albums
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Connect your Google account to access photo albums</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Background Settings</CardTitle>
          <CardDescription>
            Configure how background images are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="duration-slider">
              Background Duration: {formatDuration(backgroundDuration)}
            </Label>
            <Slider
              id="duration-slider"
              min={1}
              max={30}
              step={1}
              value={[backgroundDuration]}
              onValueChange={(value) => setBackgroundDuration(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>1 minute</span>
              <span>30 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotosTab;
