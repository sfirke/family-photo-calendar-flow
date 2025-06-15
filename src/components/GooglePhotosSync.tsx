
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PhotoAlbum {
  id: string;
  title: string;
  cover_photo_url?: string;
  media_items_count: number;
}

const GooglePhotosSync = () => {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const syncPhotos = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-photos', {
        body: { userId: user.id }
      });

      if (error) {
        throw error;
      }

      setAlbums(data.albums || []);
      setLastSync(new Date());
      toast({
        title: "Photos synced!",
        description: `Found ${data.albums?.length || 0} albums from your Google Photos.`,
      });
    } catch (error) {
      console.error('Error syncing photos:', error);
      toast({
        title: "Sync failed",
        description: "Unable to sync your Google Photos. Please try again.",
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

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadStoredAlbums();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Google Photos
          </CardTitle>
          <CardDescription>
            Sign in to sync your Google Photos albums
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Authentication required</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Google Photos
        </CardTitle>
        <CardDescription>
          Sync and display your Google Photos albums
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {albums.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Albums ({albums.length})</h4>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {albums.slice(0, 6).map((album) => (
                <div key={album.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium truncate">{album.title}</div>
                  <div className="text-gray-600">
                    {album.media_items_count} items
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GooglePhotosSync;
