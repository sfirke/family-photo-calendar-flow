
// URL extraction and validation utilities for Google Photos albums

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

export const validateGooglePhotosUrl = (url: string): boolean => {
  const googlePhotosPattern = /^https:\/\/photos\.google\.com\/share\/.+/;
  const googlePhotosAppPattern = /^https:\/\/photos\.app\.goo\.gl\/.+/;
  
  return googlePhotosPattern.test(url) || googlePhotosAppPattern.test(url);
};
