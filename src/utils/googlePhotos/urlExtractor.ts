
export const extractAlbumIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle various Google Photos album URL formats
  const patterns = [
    /\/albums\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
    /albumid=([a-zA-Z0-9_-]+)(?:&|\?|$)/,
    /album\/([a-zA-Z0-9_-]+)/,
    /shared\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

export const constructGooglePhotosApiUrl = (albumId: string): string => {
  return `https://photos.google.com/share/${albumId}`;
};

export const validateGooglePhotosUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid Google Photos URL
  const googlePhotosPatterns = [
    /^https:\/\/photos\.google\.com\/share\//,
    /^https:\/\/photos\.app\.goo\.gl\//,
    /^https:\/\/photos\.google\.com\/u\/\d+\/albums\//,
    /^https:\/\/photos\.google\.com\/albums\//
  ];
  
  return googlePhotosPatterns.some(pattern => pattern.test(url));
};
