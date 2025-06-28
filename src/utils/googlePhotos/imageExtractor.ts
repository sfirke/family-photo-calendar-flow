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
    tryAlternativeExtraction(html, foundUrls);
  }
  
  const finalImageUrls = Array.from(foundUrls);
  
  // Return ALL images instead of limiting to 50
  return finalImageUrls;
};

const isValidAlbumPhoto = (url: string, html: string): boolean => {
  // Basic URL validation
  if (!url.includes('googleusercontent.com') || url.length < 60) {
    return false;
  }
  
  // Filter out common profile photo and UI element patterns
  const profilePhotoPatterns = [
    /=s40/, /=s32/, /=s64/, /=s96/, /=s128/, /=s160/, /=s200/, // Small sizes typically used for profile photos
    /\/avatar\//, /-rp-/, /_rp\./, /profile/, /face/, /contact/,
    /=c-/, // Cropped images (often profile photos)
    /=p-/, // Profile photo indicator
    /\/photo\.jpg/, // Generic photo names often used for profiles
    /user_/, /account_/, /member_/ // User-related identifiers
  ];
  
  for (const pattern of profilePhotoPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check the HTML context where this URL appears
  const urlIndex = html.indexOf(url);
  if (urlIndex !== -1) {
    // Get surrounding HTML context (500 chars before and after)
    const start = Math.max(0, urlIndex - 500);
    const end = Math.min(html.length, urlIndex + url.length + 500);
    const context = html.substring(start, end).toLowerCase();
    
    // Check for profile-related HTML context
    const profileContextPatterns = [
      'data-profile', 'profile-photo', 'user-avatar', 'owner-photo',
      'header-avatar', 'account-photo', 'member-photo', 'contributor',
      'aria-label="profile"', 'class="profile', 'id="profile',
      'data-testid="profile', 'role="img".*profile', 'alt="profile'
    ];
    
    for (const contextPattern of profileContextPatterns) {
      if (context.includes(contextPattern)) {
        return false;
      }
    }
    
    // Additional check: if URL appears in header section or navigation
    const headerSectionPatterns = [
      '<header', '</header>', 'class="header', 'id="header',
      'class="nav', 'id="nav', 'class="toolbar', 'class="topbar'
    ];
    
    for (const headerPattern of headerSectionPatterns) {
      const headerIndex = context.indexOf(headerPattern);
      if (headerIndex !== -1 && Math.abs(headerIndex - 250) < 200) { // Within 200 chars of our URL position in context
        return false;
      }
    }
  }
  
  // Additional size-based filtering - very small images are likely UI elements
  const sizeMatch = url.match(/=s(\d+)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    if (size < 200) { // Images smaller than 200px are likely profile photos or UI elements
      return false;
    }
  }
  
  // Check for metadata or thumbnail indicators in the URL
  const metadataPatterns = [
    /\/metadata\//, /\/thumb\//, /\/thumbnail\//, /\/preview\//,
    /=w\d+-h\d+-/, // Specific width-height combinations often used for thumbnails
    /=pp-/, // Thumbnail indicator
    /=mv-/, // Movie/video thumbnail
    /=no-/, // No-crop indicator (sometimes used for profile photos)
  ];
  
  for (const pattern of metadataPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  return true;
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
        
        // Apply same validation for alternative patterns
        if (isValidAlbumPhoto(cleanUrl, html)) {
          const baseUrl = cleanUrl.split('=')[0] + '=s0';
          foundUrls.add(baseUrl);
        }
      });
    }
  }
};
