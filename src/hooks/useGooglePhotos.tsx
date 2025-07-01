
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

  // Add debug logging for publicAlbumUrl
  useEffect(() => {
    console.log('🖼️ useGooglePhotos - publicAlbumUrl changed:', publicAlbumUrl);
    console.log('🖼️ useGooglePhotos - publicAlbumUrl type:', typeof publicAlbumUrl);
    console.log('🖼️ useGooglePhotos - publicAlbumUrl length:', publicAlbumUrl?.length);
  }, [publicAlbumUrl]);

  const loadPhotosFromCache = useCallback(() => {
    const cached = photosCache.get();
    if (cached && cached.albumUrl === publicAlbumUrl) {
      setImages(cached.photos.map(p => p.url));
      setLastFetch(new Date(cached.lastUpdate));
      return true;
    }
    return false;
  }, [publicAlbumUrl]);

  const fetchPhotos = useCallback(async (albumUrl: string, forceRefresh: boolean = false) => {
    console.log('🖼️ fetchPhotos called with albumUrl:', albumUrl);
    console.log('🖼️ fetchPhotos - albumUrl type:', typeof albumUrl);
    console.log('🖼️ fetchPhotos - forceRefresh:', forceRefresh);
    
    if (!albumUrl || albumUrl.trim() === '') {
      console.log('🖼️ No album URL provided, clearing images');
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
      console.log('🖼️ Validating Google Photos URL:', albumUrl);
      if (!validateGooglePhotosUrl(albumUrl)) {
        throw new Error('Invalid Google Photos album URL format');
      }

      console.log('🖼️ URL validation passed, fetching images...');
      const fetchedImages = await fetchAlbumImages(albumUrl);
      
      if (fetchedImages.length > 0) {
        // Randomize ALL photos before caching (no limit)
        const randomizedImages = [...fetchedImages].sort(() => Math.random() - 0.5);
        
        // Cache ALL the photos
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
      console.error('🖼️ Error fetching photos:', err);
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
    console.log('🖼️ refreshPhotos called with publicAlbumUrl:', publicAlbumUrl);
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
      fetchPhotos(publicAlbumUrl, true);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  const testAlbumConnection = useCallback(async (testUrl: string): Promise<boolean> => {
    try {
      console.log('🖼️ Testing album connection with URL:', testUrl);
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
      console.error('🖼️ Error testing album connection:', err);
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

  // Updated to return all photos by default, with optional count parameter
  const getRandomizedPhotos = useCallback((count?: number) => {
    return photosCache.getRandomizedPhotos(count);
  }, []);

  // Load photos on mount and when album URL changes
  useEffect(() => {
    console.log('🖼️ useEffect triggered - publicAlbumUrl:', publicAlbumUrl);
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
      fetchPhotos(publicAlbumUrl);
    } else {
      console.log('🖼️ No valid publicAlbumUrl, clearing state');
      setImages([]);
      setError(null);
      setLastFetch(null);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  // Set up daily refresh interval
  useEffect(() => {
    if (!publicAlbumUrl || publicAlbumUrl.trim() === '') return;

    const checkForDailyRefresh = () => {
      if (photosCache.isExpired()) {
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
    hasValidAlbumUrl: Boolean(publicAlbumUrl && publicAlbumUrl.trim() !== '' && validateGooglePhotosUrl(publicAlbumUrl))
  };
};
