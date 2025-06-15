
// Image extraction utilities for Google Photos HTML content

export const extractImagesFromHtml = (html: string): string[] => {
  console.log('Starting image extraction from HTML, length:', html.length);
  
  // More precise patterns for actual Google Photos images
  const imageUrlPatterns = [
    // Standard googleusercontent patterns with proper image IDs (longer base64-like strings)
    /https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{40,}(?:=s\d+)?/g,
    // Quoted URLs with proper image IDs
    /"(https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{40,}(?:=s\d+)?)"/g,
    // Image URLs in data attributes
    /data-[^=]*="[^"]*https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{40,}[^"]*"/g,
    // Src attributes with image URLs
    /src="[^"]*https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{40,}[^"]*"/g
  ];
  
  const foundUrls = new Set<string>();
  
  for (const pattern of imageUrlPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`Found ${matches.length} matches with pattern:`, pattern.toString());
      matches.forEach(match => {
        // Extract clean URL from match
        let cleanUrl = match;
        
        // Remove quotes and attribute prefixes
        cleanUrl = cleanUrl.replace(/^[^h]*https/, 'https');
        cleanUrl = cleanUrl.replace(/['"]/g, '');
        cleanUrl = cleanUrl.replace(/\\u003d/g, '=');
        
        // Ensure proper protocol
        if (!cleanUrl.startsWith('https://')) {
          return; // Skip invalid URLs
        }
        
        // Validate that this is a proper image URL
        if (isValidImageUrl(cleanUrl, html)) {
          // Get the base URL without size parameters and add full-size parameter
          let baseUrl = cleanUrl.split('=s')[0].split('=w')[0].split('=h')[0];
          
          // Add parameter for original/large size
          if (!baseUrl.includes('=')) {
            baseUrl += '=s0'; // Original size
          }
          
          foundUrls.add(baseUrl);
        }
      });
    }
  }
  
  // If no images found with strict patterns, try more lenient extraction
  if (foundUrls.size === 0) {
    console.log('No images found with strict patterns, trying lenient extraction...');
    tryLenientExtraction(html, foundUrls);
  }
  
  const finalImageUrls = Array.from(foundUrls);
  console.log(`Extracted ${finalImageUrls.length} valid image URLs`);
  
  // Log sample URLs for debugging
  if (finalImageUrls.length > 0) {
    console.log('Sample extracted URLs:', finalImageUrls.slice(0, 3));
  }
  
  return finalImageUrls.slice(0, 50); // Limit to first 50 images for performance
};

const isValidImageUrl = (url: string, html: string): boolean => {
  // Must be a googleusercontent.com URL
  if (!url.includes('googleusercontent.com')) {
    return false;
  }
  
  // Must have a reasonable length image ID (at least 40 characters)
  const idMatch = url.match(/googleusercontent\.com\/([A-Za-z0-9\-_]+)/);
  if (!idMatch || idMatch[1].length < 40) {
    console.log('Filtered out URL with short ID:', url);
    return false;
  }
  
  // Filter out obvious non-image patterns
  const invalidPatterns = [
    'apple-mobile-web-app',
    'status-bar-style',
    'viewport',
    'manifest',
    'icon',
    'favicon',
    'logo',
    'avatar',
    'profile',
    'user-photo',
    'thumbnail',
    'preview-thumb'
  ];
  
  for (const pattern of invalidPatterns) {
    if (url.toLowerCase().includes(pattern)) {
      console.log('Filtered out URL with invalid pattern:', pattern, url);
      return false;
    }
  }
  
  // Check for profile photo size indicators
  const profileSizes = ['=s32', '=s40', '=s48', '=s64', '=s72', '=s96', '=s120', '=s128', '=s144', '=s192', '=s240'];
  for (const size of profileSizes) {
    if (url.includes(size)) {
      console.log('Filtered out profile photo size:', size, url);
      return false;
    }
  }
  
  // Check context in HTML
  const urlIndex = html.indexOf(url);
  if (urlIndex !== -1) {
    const contextStart = Math.max(0, urlIndex - 300);
    const contextEnd = Math.min(html.length, urlIndex + url.length + 300);
    const context = html.substring(contextStart, contextEnd).toLowerCase();
    
    const profileContexts = [
      'profile', 'avatar', 'user-photo', 'account', 'owner', 'author',
      'header', 'nav', 'toolbar', 'sidebar', 'menu', 'albumowner',
      'shared-by', 'created-by'
    ];
    
    for (const contextIndicator of profileContexts) {
      if (context.includes(contextIndicator)) {
        console.log(`Filtered out based on context: ${contextIndicator}`);
        return false;
      }
    }
  }
  
  return true;
};

const tryLenientExtraction = (html: string, foundUrls: Set<string>): void => {
  console.log('Trying lenient extraction patterns...');
  
  // Look for any googleusercontent URLs with reasonable image IDs
  const lenientPattern = /https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{30,}/g;
  const matches = html.match(lenientPattern);
  
  if (matches) {
    console.log(`Lenient pattern found ${matches.length} potential matches`);
    matches.forEach(match => {
      if (isValidImageUrl(match, html)) {
        const baseUrl = match.split('=')[0] + '=s0';
        foundUrls.add(baseUrl);
      }
    });
  }
  
  // If still nothing, try to find image containers and extract URLs from them
  if (foundUrls.size === 0) {
    console.log('Trying to find image containers...');
    
    // Look for common Google Photos image container patterns
    const containerPatterns = [
      /<img[^>]+src="[^"]*lh\d+\.googleusercontent\.com[^"]*"[^>]*>/g,
      /<div[^>]+data-[^>]*lh\d+\.googleusercontent\.com[^>]*>/g
    ];
    
    for (const pattern of containerPatterns) {
      const containerMatches = html.match(pattern);
      if (containerMatches) {
        console.log(`Found ${containerMatches.length} image containers`);
        containerMatches.forEach(container => {
          const urlMatch = container.match(/https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{30,}/);
          if (urlMatch && isValidImageUrl(urlMatch[0], html)) {
            const baseUrl = urlMatch[0].split('=')[0] + '=s0';
            foundUrls.add(baseUrl);
          }
        });
      }
    }
  }
};
