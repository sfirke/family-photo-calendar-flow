// Album fetching utilities with CORS proxy support

import { extractAlbumIdFromUrl } from './urlExtractor';
import { extractImagesFromHtml } from './imageExtractor';
import { CORS_PROXIES, buildProxyUrl, getProxyHeaders, extractResponseContent } from './corsProxies';

export const fetchAlbumImages = async (albumUrl: string): Promise<string[]> => {
  // debug removed: album fetch start and url diagnostics
  
  // Add performance timing
  const startTime = Date.now();
  
  // Handle shortened URLs by trying to expand them first
  let workingUrl = albumUrl;
  if (albumUrl.includes('photos.app.goo.gl')) {
  // debug removed: detected shortened url
    const expandedUrl = await tryExpandShortenedUrl(albumUrl);
    if (expandedUrl) {
      workingUrl = expandedUrl;
  // debug removed: expanded url
    } else {
  // debug removed: expansion failed, using original
    }
  }
  
  const albumId = extractAlbumIdFromUrl(workingUrl);
  // debug removed: extracted album id
  
  if (!albumId) {
    console.error('🖼️ Failed to extract album ID from URL:', workingUrl);
    throw new Error('Invalid Google Photos album URL format - could not extract album ID');
  }
  
  // First try direct access (might work in some cases)
  const directImages = await tryDirectAccess(workingUrl);
  if (directImages.length > 0) {
  // debug removed: direct access success timing
    return directImages;
  }
  
  // Try each proxy service
  // debug removed: direct access failed, trying proxies
  return await tryProxyServices(workingUrl);
};

const tryExpandShortenedUrl = async (shortenedUrl: string): Promise<string | null> => {
  try {
    // Try to follow the redirect to get the actual URL
    const response = await fetch(shortenedUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });
    
    if (response.url && response.url !== shortenedUrl) {
  // debug removed: url expanded successfully
      return response.url;
    }
  } catch (error) {
  // debug removed: failed to expand shortened url
  }
  
  return null;
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
  // debug removed: images found via direct access
        return images;
      }
    }
  } catch (error) {
  // debug removed: direct access failed, proxies next
  }
  
  return [];
};

const tryProxyServices = async (albumUrl: string): Promise<string[]> => {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyConfig = CORS_PROXIES[i];
  // debug removed: trying proxy attempt
    
    try {
      const fetchUrl = buildProxyUrl(proxyConfig, albumUrl);
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: getProxyHeaders(proxyConfig)
      };
      
      const response = await fetch(fetchUrl, fetchOptions);
      
      if (!response.ok) {
  // debug removed: proxy failed status
        continue;
      }
      
      const html = await extractResponseContent(response, proxyConfig);
      
  // debug removed: fetched album html length
      
      if (html.length < 1000) {
  // debug removed: insufficient content
        continue;
      }
      
      const images = extractImagesFromHtml(html);
      
      if (images.length > 0) {
  // debug removed: images found via proxy
        return images;
      }
      
  // debug removed: proxy returned no images
      
    } catch (error) {
  // debug removed: proxy failure error
      continue;
    }
  }
  
  // If all proxies failed, throw a comprehensive error
  throw new Error('Unable to access the Google Photos album. This could be due to:\n• The album is private or sharing is disabled\n• CORS restrictions from all proxy services\n• Network connectivity issues\n\nPlease ensure the album is publicly accessible and try again later.');
};
