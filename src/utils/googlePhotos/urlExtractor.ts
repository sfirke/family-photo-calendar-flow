
export const extractAlbumIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  console.log('Extracting album ID from URL:', url);
  
  // Handle various Google Photos album URL formats
  const patterns = [
    // Standard share URLs
    /\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
    // Album URLs with user paths
    /\/u\/\d+\/albums\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
    // Direct album URLs
    /\/albums\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,
    // Legacy formats
    /albumid=([a-zA-Z0-9_-]+)(?:&|\?|$)/,
    // Mobile app generated URLs
    /album\/([a-zA-Z0-9_-]+)/,
    // Additional share formats
    /shared\/([a-zA-Z0-9_-]+)/,
    // photos.app.goo.gl short URLs (extract from redirect)
    /photos\.app\.goo\.gl\/([a-zA-Z0-9_-]+)/
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log(`Album ID found using pattern ${i + 1}:`, match[1]);
      return match[1];
    }
  }
  
  console.warn('No album ID found in URL');
  return null;
};

export const constructGooglePhotosApiUrl = (albumId: string): string => {
  return `https://photos.google.com/share/${albumId}`;
};

export const validateGooglePhotosUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    console.warn('URL validation failed: empty or invalid URL');
    return false;
  }
  
  console.log('Validating Google Photos URL:', url);
  
  // Check if it's a valid Google Photos URL
  const googlePhotosPatterns = [
    // Standard formats
    /^https:\/\/photos\.google\.com\/share\//,
    /^https:\/\/photos\.app\.goo\.gl\//,
    // User-specific album URLs
    /^https:\/\/photos\.google\.com\/u\/\d+\/albums\//,
    // Direct album URLs
    /^https:\/\/photos\.google\.com\/albums\//,
    // Legacy formats
    /^https:\/\/photos\.google\.com\/.*albumid=/,
    // Mobile formats
    /^https:\/\/photos\.google\.com\/.*\/album\//,
    // Additional share formats
    /^https:\/\/photos\.google\.com\/.*\/shared\//
  ];
  
  const isValid = googlePhotosPatterns.some(pattern => pattern.test(url));
  
  if (!isValid) {
    console.warn('URL validation failed: URL does not match any known Google Photos patterns');
  } else {
    console.log('URL validation passed');
  }
  
  return isValid;
};

/**
 * Get user-friendly error message for invalid URLs
 */
export const getUrlValidationError = (url: string): string => {
  if (!url || url.trim() === '') {
    return 'Please enter a Google Photos album URL';
  }
  
  if (!url.startsWith('https://photos.google.com') && !url.startsWith('https://photos.app.goo.gl')) {
    return 'URL must be from photos.google.com or photos.app.goo.gl';
  }
  
  if (!extractAlbumIdFromUrl(url)) {
    return 'Could not find album ID in the URL. Please ensure the URL contains a valid album identifier.';
  }
  
  return 'Invalid Google Photos album URL format';
};

/**
 * Suggest the correct URL format
 */
export const getSuggestedUrlFormat = (): string[] => {
  return [
    'https://photos.google.com/share/[album-id]',
    'https://photos.google.com/u/0/albums/[album-id]',
    'https://photos.google.com/albums/[album-id]',
    'https://photos.app.goo.gl/[short-id]'
  ];
};
