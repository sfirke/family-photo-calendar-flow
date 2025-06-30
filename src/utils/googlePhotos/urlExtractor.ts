
export const extractAlbumIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle various Google Photos album URL formats
  const patterns = [
    /\/albums\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/,  // Fixed escapes
    /albumid=([a-zA-Z0-9_-]+)(?:&|\?|$)/,     // Fixed escapes
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
