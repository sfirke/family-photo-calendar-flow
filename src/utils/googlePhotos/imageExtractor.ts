
// Image extraction utilities for Google Photos HTML content

export const extractImagesFromHtml = (html: string): string[] => {
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
        if (isValidImageUrl(cleanUrl)) {
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
  
  const finalImageUrls = Array.from(foundUrls);
  console.log(`Extracted ${finalImageUrls.length} high-quality images (excluding profile photos)`);
  
  return finalImageUrls.slice(0, 50); // Limit to first 50 images for performance
};

const isValidImageUrl = (url: string): boolean => {
  return url.includes('googleusercontent.com') && 
         !url.includes('=s40') && 
         !url.includes('=s32') &&
         !url.includes('=s64') &&
         !url.includes('=s96') &&
         !url.includes('=s128') &&
         !url.includes('/avatar/') &&
         !url.includes('-rp-') && // Profile photo identifier
         !url.includes('_rp.') && // Another profile photo pattern
         !url.includes('profile') &&
         !url.includes('face') &&
         !url.includes('contact') &&
         url.length > 60; // Longer URLs are typically actual photos
};

const tryAlternativeExtraction = (html: string, foundUrls: Set<string>): void => {
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
};
