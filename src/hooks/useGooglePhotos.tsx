
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
    console.log('🖼️ fetchPhotos - albumUrl length:', albumUrl?.length);
    console.log('🖼️ fetchPhotos - forceRefresh:', forceRefresh);
    
    if (!albumUrl || albumUrl.trim() === '') {
      console.log('🖼️ No album URL provided, clearing images');
      setImages([]);
      setError(null);
      return;
    }

    // Normalize the URL by trimming whitespace
    const normalizedUrl = albumUrl.trim();
    console.log('🖼️ fetchPhotos - normalized URL:', normalizedUrl);

    // Check cache first unless forcing refresh
    if (!forceRefresh && !photosCache.shouldRefresh(normalizedUrl)) {
      if (loadPhotosFromCache()) {
        console.log('🖼️ fetchPhotos - loaded from cache successfully');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🖼️ Validating Google Photos URL:', normalizedUrl);
      
      // Validate URL format before attempting to fetch
      if (!validateGooglePhotosUrl(normalizedUrl)) {
        console.error('🖼️ URL validation failed for:', normalizedUrl);
        throw new Error('Invalid Google Photos album URL format. Please ensure the URL is a valid Google Photos share link.');
      }

      console.log('🖼️ URL validation passed, fetching images...');
      console.log('🖼️ About to call fetchAlbumImages with URL:', normalizedUrl);
      
      const fetchedImages = await fetchAlbumImages(normalizedUrl);
      console.log('🖼️ fetchAlbumImages returned:', fetchedImages?.length, 'images');
      
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
        console.log('🖼️ No images returned from fetchAlbumImages');
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
    console.log('🖼️ refreshPhotos called with publicAlbumUrl:', publicAlbumUrl);
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
      fetchPhotos(publicAlbumUrl, true);
    }
  }, [publicAlbumUrl, fetchPhotos]);

  const testAlbumConnection = useCallback(async (testUrl: string): Promise<boolean> => {
    try {
      console.log('🖼️ Testing album connection with URL:', testUrl);
      console.log('🖼️ testAlbumConnection - URL type:', typeof testUrl);
      console.log('🖼️ testAlbumConnection - URL length:', testUrl?.length);
      
      const normalizedTestUrl = testUrl.trim();
      console.log('🖼️ testAlbumConnection - normalized URL:', normalizedTestUrl);
      
      if (!validateGooglePhotosUrl(normalizedTestUrl)) {
        console.error('🖼️ Test URL validation failed for:', normalizedTestUrl);
        throw new Error('Invalid Google Photos album URL format');
      }

      setIsLoading(true);
      console.log('🖼️ About to test fetchAlbumImages with URL:', normalizedTestUrl);
      
      const testImages = await fetchAlbumImages(normalizedTestUrl);
      console.log('🖼️ Test fetchAlbumImages returned:', testImages?.length, 'images');
      
      if (testImages && testImages.length > 0) {
        toast({
          title: "Connection successful",
          description: `Found ${testImages.length} photos in the album.`,
        });
        return true;
      } else {
        console.log('🖼️ Test returned no images');
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
    console.log('🖼️ useEffect triggered - publicAlbumUrl:', publicAlbumUrl);
    console.log('🖼️ useEffect - publicAlbumUrl type:', typeof publicAlbumUrl);
    console.log('🖼️ useEffect - publicAlbumUrl length:', publicAlbumUrl?.length);
    
    if (publicAlbumUrl && publicAlbumUrl.trim() !== '') {
      console.log('🖼️ useEffect - calling fetchPhotos');
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
    hasValidAlbumUrl: Boolean(publicAlbumUrl && publicAlbumUrl.trim() !== '' && validateGooglePhotosUrl(publicAlbumUrl.trim()))
  };
};
