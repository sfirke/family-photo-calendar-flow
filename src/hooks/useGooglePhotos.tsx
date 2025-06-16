
import { useState, useEffect, useCallback, useRef } from 'react';
import { getImagesFromAlbum } from '@/utils/googlePhotosUtils';
import { IntervalManager } from '@/utils/performanceUtils';

interface PhotosCache {
  images: string[];
  lastUpdated: number;
  albumUrl: string;
}

// Fisher-Yates shuffle algorithm for proper randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGooglePhotos = (albumUrl: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  const getCacheKey = (url: string) => `google-photos-cache-${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;

  const getCache = useCallback((url: string): PhotosCache | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(url));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, []);

  const setCache = useCallback((url: string, images: string[]) => {
    const cache: PhotosCache = {
      images,
      lastUpdated: Date.now(),
      albumUrl: url
    };
    try {
      localStorage.setItem(getCacheKey(url), JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache photos:', error);
    }
  }, []);

  const shouldUpdateCache = useCallback((cache: PhotosCache | null): boolean => {
    if (!cache) return true;
    
    const now = new Date();
    const lastUpdate = new Date(cache.lastUpdated);
    
    // Check if it's past 12pm today and cache is from before 12pm today
    const today12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    
    return now >= today12pm && lastUpdate < today12pm;
  }, []);

  const fetchPhotos = useCallback(async (url: string, forceRefresh = false) => {
    if (!url.trim()) {
      setImages([]);
      setError(null);
      return;
    }

    // Prevent excessive API calls (minimum 10 minutes between calls for 24/7 operation)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (!forceRefresh && timeSinceLastFetch < 10 * 60 * 1000) {
      return;
    }

    setIsLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      const cache = getCache(url);
      
      if (!forceRefresh && cache && !shouldUpdateCache(cache)) {
        const shuffledImages = shuffleArray(cache.images);
        setImages(shuffledImages);
        setIsLoading(false);
        retryCountRef.current = 0; // Reset retry count on success
        return;
      }

      const fetchedImages = await getImagesFromAlbum(url);
      const shuffledImages = shuffleArray(fetchedImages);
      
      setImages(shuffledImages);
      setCache(url, fetchedImages);
      retryCountRef.current = 0; // Reset retry count on success
      
    } catch (err: any) {
      console.warn('Error fetching Google Photos:', err);
      setError(err.message || 'Failed to fetch photos from album');
      
      // For 24/7 operation, always try to use cached images as fallback
      const cache = getCache(url);
      if (cache && cache.images.length > 0) {
        const shuffledImages = shuffleArray(cache.images);
        setImages(shuffledImages);
        setError(null); // Clear error if we have cached fallback
      } else {
        setImages([]);
      }

      // Implement exponential backoff for retries
      retryCountRef.current += 1;
      if (retryCountRef.current < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        setTimeout(() => {
          if (albumUrl === url) { // Only retry if URL hasn't changed
            fetchPhotos(url, true);
          }
        }, retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCache, setCache, shouldUpdateCache]);

  const refreshPhotos = useCallback(() => {
    if (albumUrl) {
      fetchPhotos(albumUrl, true);
    }
  }, [albumUrl, fetchPhotos]);

  useEffect(() => {
    fetchPhotos(albumUrl);
  }, [albumUrl, fetchPhotos]);

  // Optimized daily refresh for 24/7 operation
  useEffect(() => {
    const scheduleNextRefresh = () => {
      const now = new Date();
      const next12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      
      // If it's already past 12pm today, schedule for 12pm tomorrow
      if (now >= next12pm) {
        next12pm.setDate(next12pm.getDate() + 1);
      }
      
      const timeUntilRefresh = next12pm.getTime() - now.getTime();
      
      // Use IntervalManager for better cleanup
      IntervalManager.setInterval('photos-daily-refresh', () => {
        refreshPhotos();
      }, 24 * 60 * 60 * 1000); // Daily

      // Initial timeout to first refresh
      setTimeout(() => {
        refreshPhotos();
      }, timeUntilRefresh);
    };

    if (albumUrl) {
      scheduleNextRefresh();
    }
    
    return () => {
      IntervalManager.clearInterval('photos-daily-refresh');
    };
  }, [albumUrl, refreshPhotos]);

  return {
    images,
    isLoading,
    error,
    refreshPhotos
  };
};
