
export const extractAlbumIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  console.log('🖼️ extractAlbumIdFromUrl - input URL:', url);
  
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
      console.log('🖼️ extractAlbumIdFromUrl - found albumId:', match[1]);
      return match[1];
    }
  }
  
  console.log('🖼️ extractAlbumIdFromUrl - no albumId found');
  return null;
};

export const constructGooglePhotosApiUrl = (albumId: string): string => {
  return `https://photos.google.com/share/${albumId}`;
};

export const validateGooglePhotosUrl = (url: string): boolean => {
  console.log('🖼️ validateGooglePhotosUrl - input URL:', url);
  console.log('🖼️ validateGooglePhotosUrl - URL type:', typeof url);
  
  if (!url || typeof url !== 'string') {
    console.log('🖼️ validateGooglePhotosUrl - URL is null/undefined or not string');
    return false;
  }
  
  const trimmedUrl = url.trim();
  console.log('🖼️ validateGooglePhotosUrl - trimmed URL:', trimmedUrl);
  
  if (trimmedUrl === '') {
    console.log('🖼️ validateGooglePhotosUrl - URL is empty after trim');
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
    console.log('🖼️ validateGooglePhotosUrl - pattern', pattern, 'matches:', matches);
    return matches;
  });
  
  console.log('🖼️ validateGooglePhotosUrl - final result:', isValid);
  return isValid;
};
