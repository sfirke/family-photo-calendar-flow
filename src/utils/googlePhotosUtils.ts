

// Utility functions for handling Google Photos albums

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

// List of CORS proxy services to try
const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/get?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

// Fetch images from Google Photos public album
export const getImagesFromAlbum = async (albumUrl: string): Promise<string[]> => {
  const albumId = extractAlbumIdFromUrl(albumUrl);
  
  if (!albumId) {
    throw new Error('Invalid Google Photos album URL format');
  }
  
  console.log('Attempting to fetch Google Photos album:', albumId);
  
  // First try direct access (might work in some cases)
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
  
  // Try each proxy service
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i];
    console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxyUrl}`);
    
    try {
      let fetchUrl: string;
      let fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, */*',
        }
      };
      
      // Configure based on proxy type
      if (proxyUrl.includes('allorigins.win')) {
        fetchUrl = proxyUrl + encodeURIComponent(albumUrl);
        fetchOptions.headers = { 'Accept': 'application/json' };
      } else if (proxyUrl.includes('codetabs.com')) {
        fetchUrl = proxyUrl + encodeURIComponent(albumUrl);
      } else {
        fetchUrl = proxyUrl + albumUrl;
      }
      
      const response = await fetch(fetchUrl, fetchOptions);
      
      if (!response.ok) {
        console.log(`Proxy ${i + 1} failed with status ${response.status}`);
        continue;
      }
      
      let html: string;
      
      if (proxyUrl.includes('allorigins.win')) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }
      
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

// Extract images from HTML content
const extractImagesFromHtml = (html: string): string[] => {
  // Extract image URLs from the HTML
  // Google Photos uses specific patterns for image URLs
  const imageUrlPatterns = [
    /https:\/\/lh\d+\.googleusercontent\.com\/[^"'\s\]]+/g,
    /"(https:\/\/lh\d+\.googleusercontent\.com\/[^"]+)"/g,
    /'(https:\/\/lh\d+\.googleusercontent\.com\/[^']+)'/g
  ];
  
  const foundUrls = new Set<string>();
  
  for (const pattern of imageUrlPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the URL (remove quotes if present)
        const cleanUrl = match.replace(/['"]/g, '');
        
        // Filter out profile photos and small images
        if (cleanUrl.includes('googleusercontent.com') && 
            !cleanUrl.includes('=s40') && 
            !cleanUrl.includes('=s32') &&
            !cleanUrl.includes('=s64') &&
            !cleanUrl.includes('=s96') &&
            !cleanUrl.includes('=s128') &&
            !cleanUrl.includes('/avatar/') &&
            !cleanUrl.includes('-rp-') && // Profile photo identifier
            !cleanUrl.includes('_rp.') && // Another profile photo pattern
            !cleanUrl.includes('profile') &&
            !cleanUrl.includes('face') &&
            !cleanUrl.includes('contact') &&
            cleanUrl.length > 60) { // Longer URLs are typically actual photos
          
          // Get the base URL without size parameters
          let baseUrl = cleanUrl.split('=')[0];
          
          // Ensure we get the original, full-size image
          // Remove any existing size parameters and add parameters for original size
          if (!baseUrl.includes('=')) {
            // For original size without any resizing: use =s0 or no size parameter
            // =s0 requests original size, but we can also use =w0-h0 for better compatibility
            baseUrl += '=s0';
          }
          
          foundUrls.add(baseUrl);
        }
      });
    }
  }
  
  // Try alternative extraction methods if no images found
  if (foundUrls.size === 0) {
    console.log('No images found with primary patterns, trying alternative extraction...');
    
    const altPatterns = [
      /"(https:\/\/lh\d+\.googleusercontent\.com[^"]*?)"/g,
      /https:\/\/lh\d+\.googleusercontent\.com\/[^\s"'<>\]]+/g,
      /\bhttps:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]+/g
    ];
    
    for (const altPattern of altPatterns) {
      const altMatches = html.match(altPattern);
      if (altMatches) {
        altMatches.forEach(match => {
          const cleanUrl = match.replace(/['"]/g, '');
          
          // Apply same filtering for alternative patterns
          if (cleanUrl.includes('googleusercontent.com') && 
              cleanUrl.length > 60 &&
              !cleanUrl.includes('/avatar/') &&
              !cleanUrl.includes('-rp-') &&
              !cleanUrl.includes('_rp.') &&
              !cleanUrl.includes('profile') &&
              !cleanUrl.includes('face') &&
              !cleanUrl.includes('contact')) {
            
            const baseUrl = cleanUrl.split('=')[0] + '=s0';
            foundUrls.add(baseUrl);
          }
        });
      }
    }
  }
  
  const finalImageUrls = Array.from(foundUrls);
  console.log(`Extracted ${finalImageUrls.length} high-quality images (excluding profile photos)`);
  
  return finalImageUrls.slice(0, 50); // Limit to first 50 images for performance
};

export const getDefaultBackgroundImages = (): string[] => {
  return [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1418065460487-3d7dd550c25a?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=1920&h=1080&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&q=80'
  ];
};

