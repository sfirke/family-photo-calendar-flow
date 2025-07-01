
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, RefreshCw, AlertCircle, CheckCircle, ExternalLink, TestTube, Info } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { validateGooglePhotosUrl, getUrlValidationError, getSuggestedUrlFormat } from '@/utils/googlePhotos/urlExtractor';

interface AlbumUrlInputProps {
  onTestConnection: (url: string) => Promise<boolean>;
}

const AlbumUrlInput = ({ onTestConnection }: AlbumUrlInputProps) => {
  const { publicAlbumUrl, setPublicAlbumUrl } = useSettings();
  const { toast } = useToast();
  
  const [albumUrl, setAlbumUrl] = useState(publicAlbumUrl || '');
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  const validateAlbumUrl = useCallback((url: string) => {
    if (!url.trim()) {
      setValidationStatus('idle');
      setValidationError('');
      return;
    }

    console.log('Validating URL:', url);

    if (validateGooglePhotosUrl(url)) {
      setValidationStatus('valid');
      setValidationError('');
      console.log('URL validation passed');
    } else {
      setValidationStatus('invalid');
      const error = getUrlValidationError(url);
      setValidationError(error);
      console.warn('URL validation failed:', error);
      
      toast({
        title: "Invalid URL format",
        description: error,
        variant: "destructive"
      });
    }
  }, [toast]);

  const testConnection = async () => {
    if (!albumUrl.trim() || validationStatus !== 'valid') return;
    
    setIsTesting(true);
    try {
      const success = await onTestConnection(albumUrl);
      if (success) {
        toast({
          title: "Connection successful",
          description: "Album is accessible and contains photos.",
        });
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      toast({
        title: "Connection failed",
        description: "Could not access the album. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
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
    validateAlbumUrl(publicAlbumUrl || '');
  }, [publicAlbumUrl, validateAlbumUrl]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateAlbumUrl(albumUrl);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [albumUrl, validateAlbumUrl]);

  const suggestedFormats = getSuggestedUrlFormat();

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Camera className="h-5 w-5" />
          Google Photos Album
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Connect a public Google Photos album for rotating background images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-url" className="text-gray-700 dark:text-gray-300">Album Share URL</Label>
            <div className="flex gap-2">
              <Input
                id="album-url"
                placeholder="https://photos.google.com/share/..."
                value={albumUrl}
                onChange={(e) => setAlbumUrl(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
              <Button
                onClick={testConnection}
                disabled={isTesting || validationStatus !== 'valid'}
                size="sm"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <TestTube className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                Test
              </Button>
            </div>
            
            {validationStatus === 'valid' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Valid Google Photos album URL format</span>
              </div>
            )}
            
            {validationStatus === 'invalid' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{validationError}</span>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">Supported URL formats:</p>
                      <ul className="mt-2 text-blue-700 dark:text-blue-300 space-y-1">
                        {suggestedFormats.map((format, index) => (
                          <li key={index} className="font-mono text-xs">{format}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
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
                  setValidationError('');
                }}
                size="sm"
                variant="outline"
                className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumUrlInput;
