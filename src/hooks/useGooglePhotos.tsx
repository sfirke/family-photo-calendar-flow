
import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { fetchAlbumImages } from '@/utils/googlePhotos/fetcher';
import { validateGooglePhotosUrl } from '@/utils/googlePhotos/urlExtractor';
import { photosCache } from '@/utils/photosCache';
import { useToast } from '@/hooks/use-toast';

export const useGooglePhotos = () => {
  const { publicAlbumUrl } = useSettings();
  const { toast } = useToast();
  
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const loadPhotosFromCache = useCallback(() => {
    const cached = photosCache.get();
    if (cached && cached.albumUrl === publicAlbumUrl) {
      setImages(cached.photos.map(p => p.url));
      setLastFetch(new Date(cached.lastUpdate));
      console.log(`Loaded ${cached.photos.length} photos from cache`);
      return true;
    }
    return false;
  }, [publicAlbumUrl]);

  const fetchPhotos = useCallback(async (albumUrl: string, forceRefresh: boolean = false) => {
    if (!albumUrl) {
      setImages([]);
      setError(null);
      return;
    }

    // Check cache first unless forcing refresh
    if (!forceRefresh && !photosCache.shouldRefresh(albumUrl)) {
      if (loadPhotosFromCache()) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!validateGooglePhotosUrl(albumUrl)) {
        throw new Error('Invalid Google Photos album URL format');
      }

      console.log('Fetching photos from album:', albumUrl);
      const fetchedImages = await fetchAlbumImages(albumUrl);
      
      if (fetchedImages.length > 0) {
        // Randomize the photos before caching
        const randomizedImages = [...fetchedImages].sort(() => Math.random() - 0.5);
        
        // Cache the photos
        photosCache.set(randomizedImages, albumUrl);
        
        setImages(randomizedImages);
        setLastFetch(new Date());
        
        toast({
          title: "Photos loaded",
          description: `Successfully loaded ${fetchedImages.length} photos from the album.`,
        });
      } else {
        setImages([]);
        toast({
          title: "No photos found",
          description: "The album appears to be empty or inaccessible.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error fetching photos:', err);
      setError(err.message || 'Failed to fetch photos from album');
      
      // Try to load from cache as fallback
      if (!loadPhotosFromCache()) {
        setImages([]);
      }
      
      toast({
        title: "Failed to load photos",
        description: err.message || 'Could not fetch photos from the album.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadPhotosFromCache, toast]);

  const refreshPhotos = useCallback(() => {
    if (publicAlbumUrl) {
      fetchPhotos(publicAlbumUrl, true);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  const testAlbumConnection = useCallback(async (testUrl: string): Promise<boolean> => {
    try {
      if (!validateGooglePhotosUrl(testUrl)) {
        throw new Error('Invalid Google Photos album URL format');
      }

      setIsLoading(true);
      const testImages = await fetchAlbumImages(testUrl);
      
      if (testImages.length > 0) {
        toast({
          title: "Connection successful",
          description: `Found ${testImages.length} photos in the album.`,
        });
        return true;
      } else {
        toast({
          title: "No photos found",
          description: "The album appears to be empty or inaccessible.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err: any) {
      console.error('Error testing album connection:', err);
      toast({
        title: "Connection failed",
        description: err.message || 'Could not access the album.',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearCache = useCallback(() => {
    photosCache.clear();
    setImages([]);
    setLastFetch(null);
    setError(null);
    
    toast({
      title: "Cache cleared",
      description: "Photo cache has been cleared.",
    });
  }, [toast]);

  const getRandomizedPhotos = useCallback((count: number = 50) => {
    return photosCache.getRandomizedPhotos(count);
  }, []);

  // Load photos on mount and when album URL changes
  useEffect(() => {
    if (publicAlbumUrl) {
      fetchPhotos(publicAlbumUrl);
    } else {
      setImages([]);
      setError(null);
      setLastFetch(null);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  // Set up daily refresh interval
  useEffect(() => {
    if (!publicAlbumUrl) return;

    const checkForDailyRefresh = () => {
      if (photosCache.isExpired()) {
        console.log('Photos cache expired, refreshing...');
        fetchPhotos(publicAlbumUrl, true);
      }
    };

    // Check every hour for expired cache
    const interval = setInterval(checkForDailyRefresh, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [publicAlbumUrl, fetchPhotos]);

  return {
    images,
    isLoading,
    error,
    lastFetch,
    refreshPhotos,
    testAlbumConnection,
    clearCache,
    getRandomizedPhotos,
    hasValidAlbumUrl: Boolean(publicAlbumUrl && validateGooglePhotosUrl(publicAlbumUrl))
  };
};
