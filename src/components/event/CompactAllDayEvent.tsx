
import React from 'react';
import { Clock } from 'lucide-react';
import { Event } from '@/types/calendar';
import EventIcon from './EventIcon';
import { getEventStyles } from './eventUtils';

interface CompactAllDayEventProps {
  event: Event;
  viewMode: string;
  className?: string;
}

const CompactAllDayEvent = ({ event, viewMode, className = '' }: CompactAllDayEventProps) => {
  const styles = getEventStyles(event, viewMode);

  return (
    <article 
      className={`${styles.paddingClass} rounded-lg ${styles.backgroundOpacity} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 ${styles.timelineStyles} ${className}`}
      role="article"
      aria-label={`All day event: ${event.title}`}
    >
      <div className="flex items-center gap-2">
        <EventIcon event={event} isAllDay={true} />
        <h3 className={`${styles.textColors.title} ${styles.fontSizes.title} truncate flex-1`}>
          {event.title}
        </h3>
        <div className={`${styles.fontSizes.time} ${styles.textColors.time} flex items-center gap-1 flex-shrink-0`}>
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>All Day</span>
        </div>
      </div>
    </article>
  );
};

export default CompactAllDayEvent;
