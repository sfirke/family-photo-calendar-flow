
export const icalValidationUtils = {
  validateICalUrl: async (url: string): Promise<boolean> => {
    try {
      // Basic URL format validation
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        return false;
      }

      // Try to fetch the URL to check if it's reachable
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Handle CORS issues
      });
      
      return response.ok || response.type === 'opaque';
    } catch (error) {
      console.error('URL validation error:', error);
      return false;
    }
  },

  validateICalData: (data: string): boolean => {
    try {
      // Basic iCal format validation
      const hasBeginVCalendar = data.includes('BEGIN:VCALENDAR');
      const hasEndVCalendar = data.includes('END:VCALENDAR');
      const hasVersion = data.includes('VERSION:');
      
      return hasBeginVCalendar && hasEndVCalendar && hasVersion;
    } catch (error) {
      console.error('iCal data validation error:', error);
      return false;
    }
  },

  extractCalendarName: (data: string): string => {
    try {
      const nameMatch = data.match(/X-WR-CALNAME:(.+)/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
      
      const summaryMatch = data.match(/SUMMARY:(.+)/);
      if (summaryMatch) {
        return summaryMatch[1].trim();
      }
      
      return 'Untitled Calendar';
    } catch (error) {
      console.error('Error extracting calendar name:', error);
      return 'Untitled Calendar';
    }
  },

  sanitizeUrl: (url: string): string => {
    try {
      // Remove any trailing whitespace
      url = url.trim();
      
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      return url;
    } catch (error) {
      console.error('Error sanitizing URL:', error);
      return url;
    }
  }
};
