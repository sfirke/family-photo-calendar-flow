
// Utility functions for handling Google Photos albums

export const extractAlbumIdFromUrl = (url: string): string | null => {
  try {
    // Handle different Google Photos URL formats
    const patterns = [
      /photos\.google\.com\/share\/([^\/\?]+)/,
      /photos\.app\.goo\.gl\/([^\/\?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting album ID:', error);
    return null;
  }
};

// Note: In a real implementation, you would need to use Google Photos API
// or a proxy service to fetch images from public albums
// For now, we'll return placeholder images when album URL is provided
export const getImagesFromAlbum = async (albumUrl: string): Promise<string[]> => {
  const albumId = extractAlbumIdFromUrl(albumUrl);
  
  if (!albumId) {
    throw new Error('Invalid Google Photos album URL');
  }
  
  // For demonstration, return some high-quality nature images
  // In a real app, you would fetch from the actual Google Photos album
  return [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1418065460487-3d7dd550c25a?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&q=80'
  ];
};

export const getDefaultBackgroundImages = (): string[] => {
  return [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1418065460487-3d7dd550c25a?w=1920&h=1080&fit=crop&q=80'
  ];
};
