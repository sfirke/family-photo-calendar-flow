
interface CachedPhoto {
  url: string;
  cachedAt: number;
  albumUrl: string;
}

interface PhotosCache {
  photos: CachedPhoto[];
  lastUpdate: number;
  albumUrl: string;
}

const CACHE_KEY = 'family_calendar_photos_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const photosCache = {
  get: (): PhotosCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as PhotosCache;
      
      // Check if cache is expired
      const now = Date.now();
      if (now - data.lastUpdate > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading photos cache:', error);
      return null;
    }
  },

  set: (photos: string[], albumUrl: string): void => {
    try {
      const now = Date.now();
      const cachedPhotos: CachedPhoto[] = photos.map(url => ({
        url,
        cachedAt: now,
        albumUrl
      }));

      const cache: PhotosCache = {
        photos: cachedPhotos,
        lastUpdate: now,
        albumUrl
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching photos:', error);
    }
  },

  clear: (): void => {
    localStorage.removeItem(CACHE_KEY);
  },

  isExpired: (): boolean => {
    const cache = photosCache.get();
    if (!cache) return true;
    
    const now = Date.now();
    return now - cache.lastUpdate > CACHE_DURATION;
  },

  shouldRefresh: (currentAlbumUrl: string): boolean => {
    const cache = photosCache.get();
    if (!cache) return true;
    
    // Refresh if album URL changed or cache is expired
    return cache.albumUrl !== currentAlbumUrl || photosCache.isExpired();
  },

  // Updated to handle all cached photos, not just 50
  getRandomizedPhotos: (count?: number): string[] => {
    const cache = photosCache.get();
    if (!cache || cache.photos.length === 0) return [];
    
    // Shuffle the photos array
    const shuffled = [...cache.photos].sort(() => Math.random() - 0.5);
    
    // Return all photos if no count specified, otherwise return the requested count
    if (count === undefined) {
      return shuffled.map(photo => photo.url);
    }
    
    return shuffled.slice(0, count).map(photo => photo.url);
  }
};
