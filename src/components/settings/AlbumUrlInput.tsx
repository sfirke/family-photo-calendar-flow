import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';

const AlbumUrlInput = () => {
  const { publicAlbumUrl, setPublicAlbumUrl } = useSettings();
  const { toast } = useToast();
  
  const [albumUrl, setAlbumUrl] = useState(publicAlbumUrl || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const validateAlbumUrl = async (url: string) => {
    if (!url.trim()) {
      setValidationStatus('idle');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    
    try {
      // Basic validation for Google Photos album URL format
      const googlePhotosPattern = /^https:\/\/photos\.google\.com\/share\/.+/;
      const googlePhotosAppPattern = /^https:\/\/photos\.app\.goo\.gl\/.+/;
      
      if (!googlePhotosPattern.test(url) && !googlePhotosAppPattern.test(url)) {
        throw new Error('Please enter a valid Google Photos album share URL');
      }

      // For now, we'll just validate the URL format
      // In a real implementation, you might want to make a test request
      setValidationStatus('valid');
      toast({
        title: "Album URL validated",
        description: "The Google Photos album URL appears to be valid.",
      });
    } catch (error: any) {
      console.error('Error validating album URL:', error);
      setValidationStatus('invalid');
      
      toast({
        title: "Invalid URL",
        description: error.message || 'Please check your Google Photos album URL.',
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveAlbumUrl = () => {
    if (validationStatus === 'valid' || albumUrl.trim() === '') {
      setPublicAlbumUrl(albumUrl.trim());
      toast({
        title: "Album URL saved",
        description: albumUrl.trim() ? "Background photos will be loaded from this album." : "Reverted to default background images.",
      });
    }
  };

  useEffect(() => {
    setAlbumUrl(publicAlbumUrl || '');
  }, [publicAlbumUrl]);

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Camera className="h-5 w-5" />
          Background Photos
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Use photos from a public Google Photos album for rotating background images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-url" className="text-gray-700 dark:text-gray-300">Google Photos Album Share URL</Label>
            <div className="flex gap-2">
              <Input
                id="album-url"
                placeholder="https://photos.google.com/share/..."
                value={albumUrl}
                onChange={(e) => setAlbumUrl(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
              <Button
                onClick={() => validateAlbumUrl(albumUrl)}
                disabled={isValidating || !albumUrl.trim()}
                size="sm"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                Validate
              </Button>
            </div>
            
            {validationStatus === 'valid' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Valid Google Photos album URL</span>
              </div>
            )}
            
            {validationStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Invalid or inaccessible album URL</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={saveAlbumUrl}
              disabled={albumUrl === publicAlbumUrl || (albumUrl.trim() && validationStatus !== 'valid')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Save Album URL
            </Button>
            {albumUrl.trim() && (
              <Button
                onClick={() => {
                  setAlbumUrl('');
                  setPublicAlbumUrl('');
                  setValidationStatus('idle');
                }}
                size="sm"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">How to get a shareable Google Photos album URL:</p>
                <ol className="mt-2 text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                  <li>Go to Google Photos and create or select an album</li>
                  <li>Click the share button and select "Create link"</li>
                  <li>Copy the generated share URL and paste it above</li>
                  <li>Make sure the album is set to "Anyone with the link"</li>
                </ol>
              </div>
            </div>
          </div>

          {!publicAlbumUrl && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>Add a Google Photos album URL to use custom background images</p>
              <p className="text-sm mt-1">Default landscape images will be used until then</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumUrlInput;
