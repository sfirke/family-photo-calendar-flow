
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
    throw new Error('Invalid Google Photos album URL format');
  }
  
  try {
    console.log('Attempting to fetch Google Photos album:', albumId);
    
    // Use CORS proxy to bypass CORS restrictions
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const encodedUrl = encodeURIComponent(albumUrl);
    const proxiedUrl = proxyUrl + encodedUrl;
    
    // Try to fetch the album page through the proxy
    const response = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to access album (${response.status}). Please ensure the album is publicly accessible.`);
    }
    
    const data = await response.json();
    const html = data.contents;
    
    console.log('Fetched album HTML through proxy, length:', html.length);
    
    if (html.length < 1000) {
      throw new Error('Album appears to be empty or inaccessible. Please check sharing settings.');
    }
    
    // Extract image URLs from the HTML
    // Google Photos uses specific patterns for image URLs
    const imageUrlPatterns = [
      /https:\/\/lh\d+\.googleusercontent\.com\/[^"'\s\]]+/g,
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
          if (cleanUrl.includes('googleusercontent.com') && 
              !cleanUrl.includes('=s40') && 
              !cleanUrl.includes('=s32') &&
              !cleanUrl.includes('/avatar/')) {
            // Modify URL for high quality (1920x1080)
            let highQualityUrl = cleanUrl.split('=')[0];
            if (!highQualityUrl.includes('=')) {
              highQualityUrl += '=w1920-h1080-c';
            }
            foundUrls.add(highQualityUrl);
          }
        });
      }
    }
    
    const imageUrls = Array.from(foundUrls);
    console.log(`Found ${imageUrls.length} images from Google Photos album`);
    
    if (imageUrls.length === 0) {
      // Try alternative extraction method for different Google Photos formats
      const altPatterns = [
        /"(https:\/\/lh\d+\.googleusercontent\.com[^"]*?)"/g,
        /https:\/\/lh\d+\.googleusercontent\.com\/[^\s"'<>]+/g
      ];
      
      for (const altPattern of altPatterns) {
        const altMatches = html.match(altPattern);
        if (altMatches) {
          altMatches.forEach(match => {
            const cleanUrl = match.replace(/"/g, '');
            if (cleanUrl.includes('googleusercontent.com') && cleanUrl.length > 50) {
              const baseUrl = cleanUrl.split('=')[0];
              foundUrls.add(baseUrl + '=w1920-h1080-c');
            }
          });
        }
      }
    }
    
    const finalImageUrls = Array.from(foundUrls);
    
    if (finalImageUrls.length === 0) {
      throw new Error('No photos found in the album. The album might be empty, private, or the URL format is not supported.');
    }
    
    return finalImageUrls.slice(0, 50); // Limit to first 50 images for performance
  } catch (error: any) {
    console.error('Error fetching Google Photos album:', error);
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to access the album. Please check your internet connection and ensure the album URL is correct.');
    }
    
    throw error;
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
