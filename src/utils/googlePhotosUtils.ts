
// Main Google Photos utilities - refactored into smaller modules

export { extractAlbumIdFromUrl, validateGooglePhotosUrl } from './googlePhotos/urlExtractor';
export { extractImagesFromHtml } from './googlePhotos/imageExtractor';
export { fetchAlbumImages } from './googlePhotos/fetcher';
export { getDefaultBackgroundImages } from './googlePhotos/defaultImages';

// Main function to get images from album (backwards compatibility)
export const getImagesFromAlbum = async (albumUrl: string): Promise<string[]> => {
  const { fetchAlbumImages } = await import('./googlePhotos/fetcher');
  return fetchAlbumImages(albumUrl);
};
