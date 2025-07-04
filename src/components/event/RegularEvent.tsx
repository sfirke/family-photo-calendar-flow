
import React from 'react';
import { Clock, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Event } from '@/types/calendar';
import EventIcon from './EventIcon';
import { getEventStyles, hasAdditionalData } from './eventUtils';

interface RegularEventProps {
  event: Event;
  viewMode: string;
  className?: string;
  showBoldHeader?: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onNotionEventClick?: (event: Event) => void;
}

const RegularEvent = ({ 
  event, 
  viewMode, 
  className = '', 
  showBoldHeader = false,
  isExpanded,
  onToggleExpanded,
  onNotionEventClick
}: RegularEventProps) => {
  const styles = getEventStyles(event, viewMode);
  const isInteractive = (viewMode === 'timeline' || viewMode === 'week') && hasAdditionalData(event) && !styles.isAllDay;
  
  // Check if this is a Notion event with a source URL
  const hasNotionUrl = event.source === 'notion' && 'notionUrl' in event && event.notionUrl;
  
  // Check if this is a Notion API event (has properties indicating it came from Notion API)
  const isNotionApiEvent = event.source === 'notion' && 'properties' in event;

  const handleClick = () => {
    if (isNotionApiEvent && onNotionEventClick) {
      onNotionEventClick(event);
    } else if (isInteractive) {
      onToggleExpanded();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isNotionApiEvent && onNotionEventClick) {
        onNotionEventClick(event);
      } else if (isInteractive) {
        onToggleExpanded();
      }
    }
  };

  const handleNotionLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNotionUrl && 'notionUrl' in event) {
      window.open(event.notionUrl as string, '_blank', 'noopener,noreferrer');
    }
  };

  const titleClasses = showBoldHeader 
    ? `font-bold ${styles.textColors.title.replace('font-medium', '')}` 
    : styles.textColors.title;

  const isClickable = isInteractive || isNotionApiEvent;

  return (
    <article 
      className={`${styles.paddingClass} rounded-lg ${styles.backgroundOpacity} backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 ${
        isClickable ? `cursor-pointer ${styles.hoverBackgroundOpacity} transition-colors` : ''
      } ${styles.timelineStyles} ${className} self-start`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : 'article'}
      aria-expanded={isInteractive ? isExpanded : undefined}
      aria-label={
        isNotionApiEvent 
          ? `Open Notion event details for ${event.title}`
          : isInteractive 
            ? `${isExpanded ? 'Collapse' : 'Expand'} event details for ${event.title}` 
            : `Event: ${event.title}`
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <EventIcon event={event} isAllDay={false} />
                <h3 className={`${titleClasses} ${styles.fontSizes.title} leading-tight truncate`}>
                  {event.title}
                </h3>
                {hasNotionUrl && (
                  <button
                    onClick={handleNotionLinkClick}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    title="Open in Notion"
                    aria-label="Open in Notion"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <div className={`flex items-center gap-2 ${styles.fontSizes.time} ${styles.textColors.time} mb-2`}>
                <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <time dateTime={styles.isAllDay ? event.date.toISOString().split('T')[0] : undefined}>
                  {event.time}
                </time>
              </div>
              
              {event.location && ((viewMode !== 'timeline' && viewMode !== 'week') || isExpanded) && (
                <div className={`flex items-center gap-2 ${styles.fontSizes.location} ${styles.textColors.location} mb-2`}>
                  <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <address className="truncate not-italic">{event.location}</address>
                </div>
              )}

              {(viewMode === 'timeline' || viewMode === 'week') && isExpanded && event.description && (
                <div className={`${styles.fontSizes.description} ${styles.textColors.description} mb-2 line-clamp-3`}>
                  {event.description}
                </div>
              )}

              {viewMode === 'month' && (
                <div className={`${styles.fontSizes.category} ${styles.textColors.category}`}>
                  {event.category}
                </div>
              )}
            </div>

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

export default RegularEvent;
