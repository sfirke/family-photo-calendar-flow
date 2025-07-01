
// Album fetching utilities with CORS proxy support

import { extractAlbumIdFromUrl } from './urlExtractor';
import { extractImagesFromHtml } from './imageExtractor';
import { CORS_PROXIES, buildProxyUrl, getProxyHeaders, extractResponseContent } from './corsProxies';

export const fetchAlbumImages = async (albumUrl: string): Promise<string[]> => {
  console.log('Starting fetchAlbumImages for URL:', albumUrl);
  
  const albumId = extractAlbumIdFromUrl(albumUrl);
  
  if (!albumId) {
    const error = 'Invalid Google Photos album URL format - could not extract album ID';
    console.error(error);
    throw new Error(error);
  }
  
  console.log('Successfully extracted album ID:', albumId);
  
  // First try direct access (might work in some cases)
  const directImages = await tryDirectAccess(albumUrl);
  if (directImages.length > 0) {
    console.log(`Found ${directImages.length} images via direct access`);
    return directImages;
  }
  
  // Try each proxy service
  console.log('Direct access failed, trying proxy services...');
  return await tryProxyServices(albumUrl);
};

const tryDirectAccess = async (albumUrl: string): Promise<string[]> => {
  try {
    console.log('Attempting direct access to:', albumUrl);
    
    const directResponse = await fetch(albumUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GooglePhotosClient/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    console.log('Direct access response status:', directResponse.status);
    
    if (directResponse.ok) {
      const html = await directResponse.text();
      console.log('Direct access HTML length:', html.length);
      
      if (html.length > 1000) {
        const images = extractImagesFromHtml(html);
        if (images.length > 0) {
          console.log(`Found ${images.length} images via direct access`);
          return images;
        }
      }
    }
  } catch (error) {
    console.log('Direct access failed:', error);
  }
  
  return [];
};

const tryProxyServices = async (albumUrl: string): Promise<string[]> => {
  const errors: string[] = [];
  
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyConfig = CORS_PROXIES[i];
    console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxyConfig.url}`);
    
    try {
      const fetchUrl = buildProxyUrl(proxyConfig, albumUrl);
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: getProxyHeaders(proxyConfig)
      };
      
      console.log(`Fetching from proxy URL: ${fetchUrl}`);
      
      const response = await fetch(fetchUrl, fetchOptions);
      
      console.log(`Proxy ${i + 1} response status: ${response.status}`);
      
      if (!response.ok) {
        const errorMsg = `Proxy ${i + 1} failed with status ${response.status}`;
        console.log(errorMsg);
        errors.push(errorMsg);
        continue;
      }
      
      const html = await extractResponseContent(response, proxyConfig);
      
      console.log(`Fetched album HTML via proxy ${i + 1}, length:`, html.length);
      
      if (html.length < 1000) {
        const errorMsg = `Proxy ${i + 1} returned insufficient content (${html.length} chars)`;
        console.log(errorMsg);
        errors.push(errorMsg);
        continue;
      }
      
      const images = extractImagesFromHtml(html);
      
      if (images.length > 0) {
        console.log(`Successfully found ${images.length} images via proxy ${i + 1}`);
        return images;
      }
      
      const errorMsg = `Proxy ${i + 1} returned no images despite valid HTML`;
      console.log(errorMsg);
      errors.push(errorMsg);
      
    } catch (error) {
      const errorMsg = `Proxy ${i + 1} failed: ${error.message}`;
      console.log(errorMsg);
      errors.push(errorMsg);
      continue;
    }
  }
  
  // If all proxies failed, throw a comprehensive error
  const detailedError = `Unable to access the Google Photos album. Detailed errors:\n${errors.join('\n')}\n\nThis could be due to:\n• The album is private or sharing is disabled\n• CORS restrictions from all proxy services\n• Network connectivity issues\n\nPlease ensure the album is publicly accessible and try again later.`;
  
  console.error('All proxy services failed:', detailedError);
  throw new Error(detailedError);
};
