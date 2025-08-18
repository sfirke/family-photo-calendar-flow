
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
    // debug removed: publicAlbumUrl change tracing
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
  // debug removed: fetchPhotos invocation details
    
    if (!albumUrl || albumUrl.trim() === '') {
  // debug removed: no album URL provided
      setImages([]);
      setError(null);
      return;
    }

    // Normalize the URL by trimming whitespace
    const normalizedUrl = albumUrl.trim();
  // debug removed: normalized URL

    // Check cache first unless forcing refresh
    if (!forceRefresh && !photosCache.shouldRefresh(normalizedUrl)) {
      if (loadPhotosFromCache()) {
  // debug removed: loaded from cache successfully
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
  // debug removed: validating URL
      
      // Validate URL format before attempting to fetch
      if (!validateGooglePhotosUrl(normalizedUrl)) {
        console.error('🖼️ URL validation failed for:', normalizedUrl);
        throw new Error('Invalid Google Photos album URL format. Please ensure the URL is a valid Google Photos share link.');
      }

  // debug removed: URL validation passed, fetching images
      
      const fetchedImages = await fetchAlbumImages(normalizedUrl);
  // debug removed: fetchAlbumImages result length
      
      if (fetchedImages && fetchedImages.length > 0) {
        // Randomize ALL photos before caching (no limit)
        const randomizedImages = [...fetchedImages].sort(() => Math.random() - 0.5);
        
        // Cache ALL the photos
        photosCache.set(randomizedImages, normalizedUrl);
        
        setImages(randomizedImages);
        setLastFetch(new Date());
        
        toast({
          title: "Photos loaded",
          description: `Successfully loaded ${fetchedImages.length} photos from the album.`,
        });
      } else {
  // debug removed: no images returned
        setImages([]);
        toast({
          title: "No photos found",
          description: "The album appears to be empty or inaccessible.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('🖼️ Error fetching photos:', err);
      console.error('🖼️ Error details:', {
        message: err.message,
        stack: err.stack,
        url: normalizedUrl
      });
      
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
  // debug removed: refreshPhotos called
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
      fetchPhotos(publicAlbumUrl, true);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  const testAlbumConnection = useCallback(async (testUrl: string): Promise<boolean> => {
    try {
  // debug removed: testing album connection
      
      const normalizedTestUrl = testUrl.trim();
  // debug removed: normalized test URL
      
      if (!validateGooglePhotosUrl(normalizedTestUrl)) {
        console.error('🖼️ Test URL validation failed for:', normalizedTestUrl);
        throw new Error('Invalid Google Photos album URL format');
      }

      setIsLoading(true);
  // debug removed: about to test fetch
      
      const testImages = await fetchAlbumImages(normalizedTestUrl);
  // debug removed: test fetch result length
      
      if (testImages && testImages.length > 0) {
        toast({
          title: "Connection successful",
          description: `Found ${testImages.length} photos in the album.`,
        });
        return true;
      } else {
  // debug removed: test returned no images
        toast({
          title: "No photos found",
          description: "The album appears to be empty or inaccessible.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err: any) {
      console.error('🖼️ Error testing album connection:', err);
      console.error('🖼️ Test error details:', {
        message: err.message,
        stack: err.stack,
        url: testUrl
      });
      
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
  // debug removed: album URL effect trigger
    
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
  // debug removed: calling fetchPhotos
      fetchPhotos(publicAlbumUrl);
    } else {
  // debug removed: clearing state due to invalid URL
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
    hasValidAlbumUrl: Boolean(publicAlbumUrl && publicAlbumUrl.trim() !== '' && validateGooglePhotosUrl(publicAlbumUrl.trim()))
  };
};
