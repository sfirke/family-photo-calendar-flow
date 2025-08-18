
export const extractAlbumIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // debug removed: input url
  
  // Handle various Google Photos album URL formats
  const patterns = [
    /\/albums\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
    /albumid=([a-zA-Z0-9_-]+)(?:&|\?|$)/,
    /album\/([a-zA-Z0-9_-]+)/,
    /shared\/([a-zA-Z0-9_-]+)/,
    // Add pattern for shortened URLs like photos.app.goo.gl
    /photos\.app\.goo\.gl\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
  // debug removed: album id found
      return match[1];
    }
  }
  
  // debug removed: no album id found
  return null;
};

export const constructGooglePhotosApiUrl = (albumId: string): string => {
  return `https://photos.google.com/share/${albumId}`;
};

export const validateGooglePhotosUrl = (url: string): boolean => {
  // debug removed: validate url diagnostics
  
  if (!url || typeof url !== 'string') {
  // debug removed: url invalid
    return false;
  }
  
  const trimmedUrl = url.trim();
  // debug removed: trimmed url
  
  if (trimmedUrl === '') {
  // debug removed: empty after trim
    return false;
  }
  
  // Check if it's a valid Google Photos URL
  const googlePhotosPatterns = [
    /^https:\/\/photos\.google\.com\/share\//,
    /^https:\/\/photos\.app\.goo\.gl\//,
    /^https:\/\/photos\.google\.com\/u\/\d+\/albums\//,
    /^https:\/\/photos\.google\.com\/albums\//
  ];
  
  const isValid = googlePhotosPatterns.some(pattern => {
    const matches = pattern.test(trimmedUrl);
  // debug removed: pattern test result
    return matches;
  });
  
  // debug removed: final validation result
  return isValid;
};
