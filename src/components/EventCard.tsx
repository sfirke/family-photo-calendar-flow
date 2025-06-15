
import React, { useState } from 'react';
import { Event } from '@/types/calendar';
import { Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: Event;
  className?: string;
  showBoldHeader?: boolean;
  viewMode?: 'week' | 'timeline' | 'month';
}

const EventCard = ({ event, className = '', showBoldHeader = false, viewMode = 'month' }: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if event has additional data that would make it expandable
  const hasAdditionalData = () => {
    return !!(event.location || event.description || (event.attendees > 0));
  };

  // Check if event is all-day (assuming all-day events have time as "All day" or similar)
  const isAllDay = event.time.toLowerCase().includes('all day') || event.time === '00:00 - 23:59';

  const handleClick = () => {
    if ((viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData()) {
      setIsExpanded(!isExpanded);
    }
  };

  const getCalendarPillColor = () => {
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
    
    if (isAllDay) {
      return 'w-full'; // Full width for all-day events
    }
    return 'w-[35%]'; // 35% width for regular events
  };

  return (
    <div 
      className={`p-3 rounded-lg bg-white/95 backdrop-blur-sm border border-white/30 ${
        (viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() ? 'cursor-pointer hover:bg-white/100 transition-colors' : ''
      } ${getTimelineStyles()} ${className}`}
      onClick={handleClick}
    >
      <div className={`flex items-start justify-between ${isAllDay && viewMode === 'timeline' ? 'flex-row' : ''}`}>
        <div className={`flex-1 min-w-0 ${isAllDay && viewMode === 'timeline' ? 'flex items-center gap-4' : ''}`}>
          <h4 className={`${showBoldHeader ? 'font-bold' : 'font-medium'} text-gray-900 mb-1 leading-tight truncate ${isAllDay && viewMode === 'timeline' ? 'mb-0' : ''}`}>
            {event.title}
          </h4>
          
          {/* Time display - show "All day" for all-day events in timeline view */}
          <div className={`flex items-center gap-2 text-xs text-gray-600 ${isAllDay && viewMode === 'timeline' ? 'mb-0' : 'mb-2'}`}>
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{isAllDay && viewMode === 'timeline' ? 'All Day' : event.time}</span>
          </div>

          {/* Calendar pill for Week and Timeline views */}
          {(viewMode === 'week' || viewMode === 'timeline') && (
            <div className={`${isAllDay && viewMode === 'timeline' ? 'mb-0' : 'mb-2'}`}>
              <Badge className={`${getCalendarPillColor()} text-white text-xs px-2 py-0.5`}>
                {event.calendarName || event.category}
              </Badge>
            </div>
          )}
          
          {/* Show location only if provided and in expanded state for timeline/week, or always for other views */}
          {event.location && ((viewMode !== 'timeline' && viewMode !== 'week') || isExpanded) && (
            <div className={`flex items-center gap-2 text-xs text-gray-600 ${isAllDay && viewMode === 'timeline' ? 'mb-0' : 'mb-2'}`}>
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Show description only in expanded timeline/week view */}
          {(viewMode === 'timeline' || viewMode === 'week') && isExpanded && event.description && (
            <div className="text-xs text-gray-600 mb-2 line-clamp-3">
              {event.description}
            </div>
          )}

          {/* Show attendees only in expanded timeline/week view */}
          {(viewMode === 'timeline' || viewMode === 'week') && isExpanded && event.attendees > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Attendees:</span> {event.attendees}
            </div>
          )}

          {/* Category pill for month view */}
          {viewMode === 'month' && (
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${event.color} text-white`}>
              {event.category}
            </div>
          )}
        </div>

        {/* Expand/collapse icon for timeline and week view - only show if has additional data */}
        {(viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData() && (
          <div className="ml-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
