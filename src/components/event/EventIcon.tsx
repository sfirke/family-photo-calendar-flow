
import React from 'react';
import { GitFork } from 'lucide-react';
import { Event } from '@/types/calendar';

interface EventIconProps {
  event: Event;
  isAllDay: boolean;
}

const EventIcon = ({ event, isAllDay }: EventIconProps) => {
  const iconSize = isAllDay ? "h-2 w-2" : "h-3 w-3";
  const iconColor = event.color || '#3b82f6';
  
  if (event.source === 'notion') {
    return (
      <GitFork 
        className={`${iconSize} flex-shrink-0`}
        style={{ 
          color: iconColor,
          transform: 'rotate(35deg)'
        }}
        aria-label={`Notion calendar: ${event.calendarName || event.category}`}
      />
    );
  }
  
  // Default colored dot for iCal and local events
  return (
    <div 
      className={`${iconSize} rounded-full flex-shrink-0`}
      style={{ backgroundColor: iconColor }}
      aria-label={`Calendar: ${event.calendarName || event.category}`}
      role="img"
    />
  );
};

export default EventIcon;
