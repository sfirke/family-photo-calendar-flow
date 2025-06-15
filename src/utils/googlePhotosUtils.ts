
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

// Fetch images from Google Photos public album
export const getImagesFromAlbum = async (albumUrl: string): Promise<string[]> => {
  const albumId = extractAlbumIdFromUrl(albumUrl);
  
  if (!albumId) {
    throw new Error('Invalid Google Photos album URL');
  }
  
  try {
    console.log('Attempting to fetch Google Photos album:', albumId);
    
    // Try to fetch the album page and extract image URLs
    const response = await fetch(albumUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch album: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Fetched album HTML, length:', html.length);
    
    // Extract image URLs from the HTML
    // Google Photos uses specific patterns for image URLs
    const imageUrlPatterns = [
      /https:\/\/lh\d+\.googleusercontent\.com\/[^"'\s]+/g,
      /"(https:\/\/lh\d+\.googleusercontent\.com\/[^"]+)"/g
    ];
    
    const foundUrls = new Set<string>();
    
    for (const pattern of imageUrlPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the URL (remove quotes if present)
          const cleanUrl = match.replace(/"/g, '');
          // Only add high-quality image URLs
          if (cleanUrl.includes('googleusercontent.com') && !cleanUrl.includes('=s40')) {
            // Modify URL for high quality (1920x1080)
            const highQualityUrl = cleanUrl.split('=')[0] + '=w1920-h1080-c';
            foundUrls.add(highQualityUrl);
          }
        });
      }
    }
    
    const imageUrls = Array.from(foundUrls);
    console.log(`Found ${imageUrls.length} images from Google Photos album`);
    
    if (imageUrls.length === 0) {
      console.log('No images found in album, falling back to default images');
      return getDefaultBackgroundImages();
    }
    
    return imageUrls.slice(0, 20); // Limit to first 20 images
  } catch (error) {
    console.error('Error fetching Google Photos album:', error);
    console.log('Falling back to default background images');
    return getDefaultBackgroundImages();
  }
};

export const getDefaultBackgroundImages = (): string[] => {
  return [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1418065460487-3d7dd550c25a?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&q=80'
  ];
};
