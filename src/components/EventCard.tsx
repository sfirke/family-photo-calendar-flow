
import React, { useState } from 'react';
import { Event } from '@/types/calendar';
import { isAllDayEvent } from './event/eventUtils';
import CompactAllDayEvent from './event/CompactAllDayEvent';
import RegularEvent from './event/RegularEvent';

interface EventCardProps {
  event: Event;
  className?: string;
  showBoldHeader?: boolean;
  viewMode?: 'week' | 'timeline' | 'month';
  isMultiDayDisplay?: boolean;
  onNotionEventClick?: (event: Event) => void;
}

const EventCard = ({ 
  event, 
  className = '', 
  showBoldHeader = false, 
  viewMode = 'month',
  isMultiDayDisplay = false,
  onNotionEventClick
}: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAllDay = isAllDayEvent(event.time);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // For all-day events (both single and multi-day), show compact format
  if (isAllDay && (viewMode === 'timeline' || viewMode === 'week')) {
    return (
      <CompactAllDayEvent 
        event={event}
        viewMode={viewMode}
        className={className}
        onNotionEventClick={onNotionEventClick}
      />
    );
  }

  return (
    <RegularEvent
      event={event}
      viewMode={viewMode}
      className={className}
      showBoldHeader={showBoldHeader}
      isExpanded={isExpanded}
      onToggleExpanded={handleToggleExpanded}
      onNotionEventClick={onNotionEventClick}
    />
  );
};

export default EventCard;
