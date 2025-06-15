
// Image extraction utilities for Google Photos HTML content

export const extractImagesFromHtml = (html: string): string[] => {
  console.log('Starting image extraction from HTML, length:', html.length);
  
  // Extract image URLs from the HTML
  // Google Photos uses specific patterns for image URLs
  const imageUrlPatterns = [
    // Standard googleusercontent patterns
    /https:\/\/lh\d+\.googleusercontent\.com\/[^"'\s\]]+/g,
    /"(https:\/\/lh\d+\.googleusercontent\.com\/[^"]+)"/g,
    /'(https:\/\/lh\d+\.googleusercontent\.com\/[^']+)'/g,
    // Base64 encoded patterns that might contain URLs
    /https:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_=]+/g,
    // JSON-like patterns where URLs might be embedded
    /\\u003dhttps:\/\/lh\d+\.googleusercontent\.com\/[^"'\\]+/g,
    // Alternative encoding patterns
    /lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_=]+/g
  ];
  
  const foundUrls = new Set<string>();
  
  for (const pattern of imageUrlPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`Found ${matches.length} matches with pattern:`, pattern.toString());
      matches.forEach(match => {
        // Clean up the URL (remove quotes, decode if necessary)
        let cleanUrl = match.replace(/['"]/g, '').replace(/\\u003d/g, '=');
        
        // Ensure proper protocol
        if (!cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        
        // Filter out profile photos and small images
        if (isValidAlbumPhoto(cleanUrl, html)) {
          // Get the base URL without size parameters
          let baseUrl = cleanUrl.split('=')[0];
          
          // Ensure we get the original, full-size image
          // Remove any existing size parameters and add parameters for original size
          if (!baseUrl.includes('=')) {
            // For original size without any resizing: use =s0
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
    tryAlternativeExtraction(html, foundUrls);
  }
  
  // If still no images, try more aggressive extraction
  if (foundUrls.size === 0) {
    console.log('Still no images found, trying aggressive extraction...');
    tryAggressiveExtraction(html, foundUrls);
  }
  
  const finalImageUrls = Array.from(foundUrls);
  console.log(`Extracted ${finalImageUrls.length} album photos (excluding profile photos and UI elements)`);
  
  // Log a sample of URLs for debugging
  if (finalImageUrls.length > 0) {
    console.log('Sample extracted URLs:', finalImageUrls.slice(0, 3));
  }
  
  return finalImageUrls.slice(0, 50); // Limit to first 50 images for performance
};

const isValidAlbumPhoto = (url: string, html: string): boolean => {
  // Basic URL validation
  if (!url.includes('googleusercontent.com') || url.length < 40) {
    return false;
  }
  
  // Check for profile photo indicators in the URL
  const profileIndicators = [
    '=s40', '=s32', '=s64', '=s96', '=s128', '=s48', '=s72', '=s120', '=s144', '=s192', '=s240',
    '/avatar/', '-rp-', '_rp.', 'profile', 'face', 'contact', 'user', 'account'
  ];
  
  for (const indicator of profileIndicators) {
    if (url.includes(indicator)) {
      return false;
    }
  }
  
  // Check for common profile photo patterns in the surrounding HTML context
  const urlIndex = html.indexOf(url);
  if (urlIndex !== -1) {
    // Get surrounding context (500 chars before and after)
    const contextStart = Math.max(0, urlIndex - 500);
    const contextEnd = Math.min(html.length, urlIndex + url.length + 500);
    const context = html.substring(contextStart, contextEnd).toLowerCase();
    
    // Profile photo context indicators
    const profileContexts = [
      'profile', 'avatar', 'user-photo', 'account', 'owner', 'author',
      'data-userid', 'data-user-id', 'user_photo', 'profile_photo',
      'albumowner', 'album-owner', 'shared-by', 'created-by',
      'header', 'nav', 'toolbar', 'sidebar', 'menu'
    ];
    
    for (const contextIndicator of profileContexts) {
      if (context.includes(contextIndicator)) {
        console.log(`Filtered out potential profile photo based on context: ${contextIndicator}`);
        return false;
      }
    }
  }
  
  // Additional size-based filtering - profile photos are typically smaller
  // Extract size parameters if present
  const sizeMatch = url.match(/=s(\d+)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    if (size <= 240) { // Profile photos are usually 240px or smaller
      return false;
    }
  }
  
  // Check for thumbnail size indicators
  const thumbnailIndicators = [
    'thumb', 'thumbnail', 'preview', 'mini', 'tiny'
  ];
  
  for (const indicator of thumbnailIndicators) {
    if (url.toLowerCase().includes(indicator)) {
      return false;
    }
  }
  
  return true;
};

const tryAlternativeExtraction = (html: string, foundUrls: Set<string>): void => {
  console.log('Trying alternative extraction patterns...');
  
  const altPatterns = [
    /"(https:\/\/lh\d+\.googleusercontent\.com[^"]*?)"/g,
    /https:\/\/lh\d+\.googleusercontent\.com\/[^\s"'<>\]]+/g,
    /\bhttps:\/\/lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]+/g,
    // Look for data attributes that might contain image URLs
    /data-[^=]*="[^"]*lh\d+\.googleusercontent\.com[^"]*"/g,
    // Look for src attributes
    /src="[^"]*lh\d+\.googleusercontent\.com[^"]*"/g
  ];
  
  for (const altPattern of altPatterns) {
    const altMatches = html.match(altPattern);
    if (altMatches) {
      console.log(`Alternative pattern found ${altMatches.length} matches:`, altPattern.toString());
      altMatches.forEach(match => {
        let cleanUrl = match.replace(/['"]/g, '').replace(/^[^h]*https/, 'https');
        
        // Apply same filtering for alternative patterns
        if (isValidAlbumPhoto(cleanUrl, html)) {
          const baseUrl = cleanUrl.split('=')[0] + '=s0';
          foundUrls.add(baseUrl);
        }
      });
    }
  }
};

const tryAggressiveExtraction = (html: string, foundUrls: Set<string>): void => {
  console.log('Trying aggressive extraction patterns...');
  
  // Look for any mention of lh*.googleusercontent.com domains
  const aggressivePatterns = [
    /lh\d+\.googleusercontent\.com\/[A-Za-z0-9\-_]{20,}/g,
    /googleusercontent\.com\/[A-Za-z0-9\-_\/]{30,}/g
  ];
  
  for (const pattern of aggressivePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`Aggressive pattern found ${matches.length} matches:`, pattern.toString());
      matches.forEach(match => {
        let cleanUrl = match.startsWith('http') ? match : 'https://' + match;
        
        if (isValidAlbumPhoto(cleanUrl, html)) {
          const baseUrl = cleanUrl.split('=')[0] + '=s0';
          foundUrls.add(baseUrl);
        }
      });
    }
  }
  
  // Last resort: look for any string that might be an image ID and construct URLs
  const idPattern = /[A-Za-z0-9\-_]{30,}/g;
  const potentialIds = html.match(idPattern);
  
  if (potentialIds && potentialIds.length > 0) {
    console.log(`Found ${potentialIds.length} potential image IDs, testing first 10...`);
    
    // Test only the first 10 to avoid too many invalid URLs
    potentialIds.slice(0, 10).forEach(id => {
      if (id.length > 30 && id.length < 100) {
        const constructedUrl = `https://lh3.googleusercontent.com/${id}=s0`;
        foundUrls.add(constructedUrl);
      }
    });
  }
};
