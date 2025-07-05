
// Album fetching utilities with CORS proxy support

import { extractAlbumIdFromUrl } from './urlExtractor';
import { extractImagesFromHtml } from './imageExtractor';
import { CORS_PROXIES, buildProxyUrl, getProxyHeaders, extractResponseContent } from './corsProxies';

export const fetchAlbumImages = async (albumUrl: string): Promise<string[]> => {
  const albumId = extractAlbumIdFromUrl(albumUrl);
  
  if (!albumId) {
    throw new Error('Invalid Google Photos album URL format');
  }
  
  // Enhanced Google Photos logging
  console.log('🖼️ Google Photos Fetcher - Starting album fetch');
  console.log('🖼️ Album URL:', albumUrl);
  console.log('🖼️ Album ID:', albumId);
  
  // Add performance timing
  const startTime = Date.now();
  
  // First try direct access (might work in some cases)
  const directImages = await tryDirectAccess(albumUrl);
  if (directImages.length > 0) {
    console.log(`🖼️ Direct access successful in ${Date.now() - startTime}ms`);
    return directImages;
  }
  
  // Try each proxy service
  console.log('🖼️ Direct access failed, trying proxy services...');
  return await tryProxyServices(albumUrl);
};

const tryDirectAccess = async (albumUrl: string): Promise<string[]> => {
  try {
    const directResponse = await fetch(albumUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GooglePhotosClient/1.0)'
      }
    });
    
    if (directResponse.ok) {
      const html = await directResponse.text();
      const images = extractImagesFromHtml(html);
      if (images.length > 0) {
        console.log(`Found ${images.length} images via direct access`);
        return images;
      }
    }
  } catch (error) {
    console.log('Direct access failed, trying proxy services...');
  }
  
  return [];
};

const tryProxyServices = async (albumUrl: string): Promise<string[]> => {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyConfig = CORS_PROXIES[i];
    console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxyConfig.url}`);
    
    try {
      const fetchUrl = buildProxyUrl(proxyConfig, albumUrl);
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: getProxyHeaders(proxyConfig)
      };
      
      const response = await fetch(fetchUrl, fetchOptions);
      
      if (!response.ok) {
        console.log(`Proxy ${i + 1} failed with status ${response.status}`);
        continue;
      }
      
      const html = await extractResponseContent(response, proxyConfig);
      
      console.log(`Fetched album HTML via proxy ${i + 1}, length:`, html.length);
      
      if (html.length < 1000) {
        console.log(`Proxy ${i + 1} returned insufficient content`);
        continue;
      }
      
      const images = extractImagesFromHtml(html);
      
      if (images.length > 0) {
        console.log(`Found ${images.length} images via proxy ${i + 1}`);
        return images;
      }
      
      console.log(`Proxy ${i + 1} returned no images, trying next...`);
      
    } catch (error) {
      console.log(`Proxy ${i + 1} failed:`, error);
      continue;
    }
  }
  
  // If all proxies failed, throw a comprehensive error
  throw new Error('Unable to access the Google Photos album. This could be due to:\n• The album is private or sharing is disabled\n• CORS restrictions from all proxy services\n• Network connectivity issues\n\nPlease ensure the album is publicly accessible and try again later.');
};
