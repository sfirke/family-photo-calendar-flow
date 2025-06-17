import React, { useState } from 'react';
import { Event } from '@/types/calendar';
import { Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface EventCardProps {
  event: Event;
  className?: string;
  showBoldHeader?: boolean;
  viewMode?: 'week' | 'timeline' | 'month';
  isMultiDayDisplay?: boolean;
}

const EventCard = ({ 
  event, 
  className = '', 
  showBoldHeader = false, 
  viewMode = 'month',
  isMultiDayDisplay = false 
}: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if event has additional data that would make it expandable
  const hasAdditionalData = () => {
    return !!(event.location || event.description);
  };

  // Check if event is all-day (assuming all-day events have time as "All day" or similar)
  const isAllDay = event.time.toLowerCase().includes('all day') || event.time === '00:00 - 23:59';

  // Check if event has passed (for timeline and week views)
  const hasEventPassed = () => {
    if (viewMode === 'month') return false; // Don't apply transparency in month view
    
    // Exclude all-day events from transparency changes
    if (isAllDay) {
      return false;
    }
    
    const now = new Date();
    const eventDate = new Date(event.date);
    
    // If event is on a different day than today, check if it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return true; // Past day
    } else if (eventDate > today) {
      return false; // Future day
    }
    
    // Event is today, check the time
    // Parse time string to get start and end times
    const timeString = event.time.toLowerCase();
    
    // Handle multi-day events
    if (timeString.includes('days')) {
      return false; // Multi-day events don't get transparency
    }
    
    // Parse time range (e.g., "2:00 PM - 4:00 PM" or "14:00 - 16:00")
    const timeMatch = timeString.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{0,2})\s*(am|pm)?/);
    
    if (timeMatch) {
      // Extract end time
      let endHour = parseInt(timeMatch[4]);
      const endMinute = parseInt(timeMatch[5]) || 0;
      const endPeriod = timeMatch[6];
      
      // Convert to 24-hour format
      if (endPeriod === 'pm' && endHour !== 12) {
        endHour += 12;
      } else if (endPeriod === 'am' && endHour === 12) {
        endHour = 0;
      }
      
      const endTime = new Date(event.date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      return now > endTime;
    } else {
      // Try to parse single time (e.g., "2:00 PM" or "14:00")
      const singleTimeMatch = timeString.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/);
      
      if (singleTimeMatch) {
        let startHour = parseInt(singleTimeMatch[1]);
        const startMinute = parseInt(singleTimeMatch[2]) || 0;
        const startPeriod = singleTimeMatch[3];
        
        // Convert to 24-hour format
        if (startPeriod === 'pm' && startHour !== 12) {
          startHour += 12;
        } else if (startPeriod === 'am' && startHour === 12) {
          startHour = 0;
        }
        
        // Add 20 minutes to start time as the default end time
        const endTime = new Date(event.date);
        endTime.setHours(startHour, startMinute + 20, 0, 0);
        
        return now > endTime;
      }
    }
    
    return false; // Default to not passed if we can't parse the time
  };

  const handleClick = () => {
    if ((viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() && !isMultiDayDisplay) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && (viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() && !isMultiDayDisplay) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const getCalendarDotColor = () => {
    if (event.calendarName) {
      // Different colors for different calendars
      const colors = [
        'bg-blue-500',
        'bg-green-500', 
        'bg-purple-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-pink-500',
        'bg-indigo-500'
      ];
      const hash = event.calendarName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colors[Math.abs(hash) % colors.length];
    }
    return event.color;
  };

  // Timeline view styling
  const getTimelineStyles = () => {
    if (viewMode !== 'timeline') return '';
    
    if (isMultiDayDisplay) {
      return 'w-full'; // Full width for multi-day events
    }
    
    if (isAllDay) {
      return 'w-full'; // Full width for all-day events
    }
    return 'w-[35%]'; // 35% width for regular events
  };

  // Get background opacity based on event status - improved for light mode
  const getBackgroundOpacity = () => {
    const isPast = hasEventPassed();
    if (isPast && (viewMode === 'timeline' || viewMode === 'week')) {
      return 'bg-white/40 dark:bg-gray-800/30';
    }
    return 'bg-white/90 dark:bg-gray-800/75';
  };

  // Get hover background opacity - improved for light mode
  const getHoverBackgroundOpacity = () => {
    const isPast = hasEventPassed();
    if (isPast && (viewMode === 'timeline' || viewMode === 'week')) {
      return 'hover:bg-white/50 dark:hover:bg-gray-800/40';
    }
    return 'hover:bg-white/95 dark:hover:bg-gray-800/85';
  };

  // Get text color classes based on event status - improved contrast for light mode
  const getTextColorClasses = () => {
    const isPast = hasEventPassed();
    if (isPast && (viewMode === 'timeline' || viewMode === 'week')) {
      return {
        title: showBoldHeader ? 'font-bold text-gray-500 dark:text-gray-400' : 'font-medium text-gray-500 dark:text-gray-400',
        time: 'text-gray-400 dark:text-gray-500',
        location: 'text-gray-400 dark:text-gray-500',
        description: 'text-gray-400 dark:text-gray-500',
        category: 'text-gray-400 dark:text-gray-500 font-medium'
      };
    }
    return {
      title: showBoldHeader ? 'font-bold text-gray-800 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-100',
      time: 'text-gray-600 dark:text-gray-300',
      location: 'text-gray-600 dark:text-gray-300',
      description: 'text-gray-600 dark:text-gray-300',
      category: 'text-gray-600 dark:text-gray-300 font-medium'
    };
  };

  // Get font size classes based on view mode - significantly larger fonts for timeline view
  const getFontSizeClasses = () => {
    if (viewMode === 'timeline') {
      return {
        title: 'text-lg', // Increased from text-base
        time: 'text-base', // Increased from text-sm
        location: 'text-base', // Increased from text-sm
        description: 'text-base', // Increased from text-sm
        category: 'text-base' // Increased from text-sm
      };
    }
    return {
      title: 'text-sm', // Default size for other views
      time: 'text-xs',
      location: 'text-xs',
      description: 'text-xs',
      category: 'text-xs'
    };
  };

  // Get padding class based on event type
  const getPaddingClass = () => {
    return isAllDay ? 'pl-3' : 'p-3';
  };

  const isInteractive = (viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() && !isMultiDayDisplay;
  const textColors = getTextColorClasses();
  const fontSizes = getFontSizeClasses();

  // For multi-day events, show compact format with inline time
  if (isMultiDayDisplay) {
    return (
      <article 
        className={`${getPaddingClass()} pr-2 pt-2 pb-2 rounded-lg ${getBackgroundOpacity()} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 ${getTimelineStyles()} ${className}`}
        role="article"
        aria-label={`Multi-day event: ${event.title}`}
      >
        <div className="flex items-center gap-3">
          {/* Badge Column - Colored Dot */}
          <div className="flex-shrink-0" role="presentation">
            <div 
              className={`w-3 h-3 rounded-full ${getCalendarDotColor()}`}
              aria-label={`Calendar: ${event.calendarName || event.category}`}
              role="img"
            />
          </div>

          {/* Event Details Column - Inline format */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h3 className={`${textColors.title} ${fontSizes.title} truncate`}>
              {event.title}
            </h3>
            <span className={`${fontSizes.time} ${textColors.time} flex items-center gap-1 flex-shrink-0`}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              All Day
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article 
      className={`${getPaddingClass()} ${isAllDay ? 'pr-3 pt-3 pb-3' : ''} rounded-lg ${getBackgroundOpacity()} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 ${
        isInteractive ? `cursor-pointer ${getHoverBackgroundOpacity()} transition-colors` : ''
      } ${getTimelineStyles()} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : 'article'}
      aria-expanded={isInteractive ? isExpanded : undefined}
      aria-label={isInteractive ? `${isExpanded ? 'Collapse' : 'Expand'} event details for ${event.title}` : `Event: ${event.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Badge Column - Colored Dot */}
        <div className="flex-shrink-0 pt-1" role="presentation">
          <div 
            className={`w-3 h-3 rounded-full ${getCalendarDotColor()}`}
            aria-label={`Calendar: ${event.calendarName || event.category}`}
            role="img"
          />
        </div>

        {/* Event Details Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className={`${textColors.title} ${fontSizes.title} mb-1 leading-tight truncate`}>
                {event.title}
              </h3>
              
              {/* Time display - show "All day" for all-day events in timeline view */}
              <div className={`flex items-center gap-2 ${fontSizes.time} ${textColors.time} mb-2`}>
                <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <time dateTime={isAllDay ? event.date.toISOString().split('T')[0] : undefined}>
                  {isAllDay && viewMode === 'timeline' ? 'All Day' : event.time}
                </time>
              </div>
              
              {/* Show location only if provided and in expanded state for timeline/week, or always for other views */}
              {event.location && ((viewMode !== 'timeline' && viewMode !== 'week') || isExpanded) && (
                <div className={`flex items-center gap-2 ${fontSizes.location} ${textColors.location} mb-2`}>
                  <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <address className="truncate not-italic">{event.location}</address>
                </div>
              )}

              {/* Show description only in expanded timeline/week view */}
              {(viewMode === 'timeline' || viewMode === 'week') && isExpanded && event.description && (
                <div className={`${fontSizes.description} ${textColors.description} mb-2 line-clamp-3`}>
                  {event.description}
                </div>
              )}

              {/* Category text for month view */}
              {viewMode === 'month' && (
                <div className={`${fontSizes.category} ${textColors.category}`}>
                  {event.category}
                </div>
              )}
            </div>

            {/* Expand/collapse icon for timeline and week view - only show if has additional data */}
            {isInteractive && (
              <div className="ml-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
