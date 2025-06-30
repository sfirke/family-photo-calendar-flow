
/**
 * Extracts the start time from a time range string
 * Examples: "1:00 PM - 5:00 PM" → "1:00 PM", "9:00 AM" → "9:00 AM"
 */
export const extractStartTime = (timeString: string): string => {
  try {
    if (!timeString || typeof timeString !== 'string' || timeString.trim() === '') return '';
    
    // Handle "All day" and similar cases
    if (timeString.toLowerCase().includes('all day')) return '';
    
    // Split by common separators and take the first part
    const separators = [' - ', ' – ', ' to ', ' until '];
    for (const separator of separators) {
      if (timeString.includes(separator)) {
        return timeString.split(separator)[0].trim();
      }
    }
    
    // If no separator found, assume it's already just a start time
    return timeString.trim();
  } catch (error) {
    console.warn('Error extracting start time:', error);
    return '';
  }
};

/**
 * Converts a time string to minutes since midnight for comparison
 * Examples: "9:00 AM" → 540, "1:00 PM" → 780, "11:30 PM" → 1410
 */
export const timeToMinutes = (timeString: string): number => {
  try {
    const startTime = extractStartTime(timeString);
    if (!startTime) return 0;
    
    // Handle 24-hour format (e.g., "14:30")
    const time24Match = startTime.match(/^(\d{1,2}):(\d{2})$/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      
      // Validate ranges
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return 9999; // Invalid time
      }
      
      return hours * 60 + minutes;
    }
    
    // Handle 12-hour format with AM/PM
    const time12Match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (time12Match) {
      let hours = parseInt(time12Match[1], 10);
      const minutes = parseInt(time12Match[2], 10);
      const period = time12Match[3].toUpperCase();
      
      // Validate ranges
      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        return 9999; // Invalid time
      }
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60 + minutes;
    }
    
    // Handle format without minutes (e.g., "9 AM", "1 PM")
    const hourOnlyMatch = startTime.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (hourOnlyMatch) {
      let hours = parseInt(hourOnlyMatch[1], 10);
      const period = hourOnlyMatch[2].toUpperCase();
      
      // Validate range
      if (hours < 1 || hours > 12) {
        return 9999; // Invalid time
      }
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return hours * 60;
    }
    
    // Fallback: return a large number so invalid times sort last
    return 9999;
  } catch (error) {
    console.warn('Error converting time to minutes:', error);
    return 9999;
  }
};

/**
 * Compares two time strings chronologically
 * Returns: negative if a < b, positive if a > b, 0 if equal
 */
export const compareTimeStrings = (timeA: string, timeB: string): number => {
  try {
    // Handle null/undefined values
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1; // Move invalid times to end
    if (!timeB) return -1; // Move invalid times to end
    
    const minutesA = timeToMinutes(timeA);
    const minutesB = timeToMinutes(timeB);
    return minutesA - minutesB;
  } catch (error) {
    console.warn('Error comparing time strings:', error);
    return 0; // Default to equal if comparison fails
  }
};
