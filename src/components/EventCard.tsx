
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

  // Get background opacity - now uniform 85% for all events
  const getBackgroundOpacity = () => {
    return 'bg-white/85';
  };

  // Get hover background opacity - slightly higher for hover state
  const getHoverBackgroundOpacity = () => {
    return 'hover:bg-white/90';
  };

  const isInteractive = (viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() && !isMultiDayDisplay;

  // For multi-day events, show compact format with inline time
  if (isMultiDayDisplay) {
    return (
      <article 
        className={`p-2 rounded-lg ${getBackgroundOpacity()} backdrop-blur-sm border border-white/30 ${getTimelineStyles()} ${className}`}
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
            <h3 className="font-medium text-gray-900 truncate">
              {event.title}
            </h3>
            <span className="text-xs text-gray-600 flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3" aria-hidden="true" />
              All Day
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article 
      className={`p-3 rounded-lg ${getBackgroundOpacity()} backdrop-blur-sm border border-white/30 ${
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
              <h3 className={`${showBoldHeader ? 'font-bold' : 'font-medium'} text-gray-900 mb-1 leading-tight truncate`}>
                {event.title}
              </h3>
              
              {/* Time display - show "All day" for all-day events in timeline view */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <time dateTime={isAllDay ? event.date.toISOString().split('T')[0] : undefined}>
                  {isAllDay && viewMode === 'timeline' ? 'All Day' : event.time}
                </time>
              </div>
              
              {/* Show location only if provided and in expanded state for timeline/week, or always for other views */}
              {event.location && ((viewMode !== 'timeline' && viewMode !== 'week') || isExpanded) && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  <address className="truncate not-italic">{event.location}</address>
                </div>
              )}

              {/* Show description only in expanded timeline/week view */}
              {(viewMode === 'timeline' || viewMode === 'week') && isExpanded && event.description && (
                <div className="text-xs text-gray-600 mb-2 line-clamp-3">
                  {event.description}
                </div>
              )}

              {/* Category text for month view */}
              {viewMode === 'month' && (
                <div className="text-xs text-gray-600 font-medium">
                  {event.category}
                </div>
              )}
            </div>

            {/* Expand/collapse icon for timeline and week view - only show if has additional data */}
            {isInteractive && (
              <div className="ml-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
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
