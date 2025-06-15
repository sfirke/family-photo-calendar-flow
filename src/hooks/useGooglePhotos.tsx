
import { useState, useEffect } from 'react';
import { getImagesFromAlbum } from '@/utils/googlePhotosUtils';

interface PhotosCache {
  images: string[];
  lastUpdated: number;
  albumUrl: string;
}

export const useGooglePhotos = (albumUrl: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = (url: string) => `google-photos-cache-${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`;

  const getCache = (url: string): PhotosCache | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(url));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const setCache = (url: string, images: string[]) => {
    const cache: PhotosCache = {
      images,
      lastUpdated: Date.now(),
      albumUrl: url
    };
    localStorage.setItem(getCacheKey(url), JSON.stringify(cache));
  };

  const shouldUpdateCache = (cache: PhotosCache | null): boolean => {
    if (!cache) return true;
    
    const now = new Date();
    const lastUpdate = new Date(cache.lastUpdated);
    
    // Check if it's past 12pm today and cache is from before 12pm today
    const today12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    
    return now >= today12pm && lastUpdate < today12pm;
  };

  const fetchPhotos = async (url: string, forceRefresh = false) => {
    if (!url.trim()) {
      setImages([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cache = getCache(url);
      
      if (!forceRefresh && cache && !shouldUpdateCache(cache)) {
        console.log('Using cached Google Photos images');
        setImages(cache.images);
        setIsLoading(false);
        return;
      }

      console.log('Fetching fresh Google Photos images');
      const fetchedImages = await getImagesFromAlbum(url);
      
      setImages(fetchedImages);
      setCache(url, fetchedImages);
      
    } catch (err: any) {
      console.error('Error fetching Google Photos:', err);
      setError(err.message || 'Failed to fetch photos from album');
      
      // Try to use cached images as fallback
      const cache = getCache(url);
      if (cache) {
        setImages(cache.images);
      } else {
        setImages([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPhotos = () => {
    if (albumUrl) {
      fetchPhotos(albumUrl, true);
    }
  };

  useEffect(() => {
    fetchPhotos(albumUrl);
  }, [albumUrl]);

  // Set up daily refresh at 12pm
  useEffect(() => {
    const scheduleNextRefresh = () => {
      const now = new Date();
      const next12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      
      // If it's already past 12pm today, schedule for 12pm tomorrow
      if (now >= next12pm) {
        next12pm.setDate(next12pm.getDate() + 1);
      }
      
      const timeUntilRefresh = next12pm.getTime() - now.getTime();
      
      return setTimeout(() => {
        console.log('Automatic daily refresh of Google Photos at 12pm');
        refreshPhotos();
        // Schedule next refresh
        scheduleNextRefresh();
      }, timeUntilRefresh);
    };

    const timeoutId = scheduleNextRefresh();
    
    return () => clearTimeout(timeoutId);
  }, [albumUrl]);

  return {
    images,
    isLoading,
    error,
    refreshPhotos
  };
};
