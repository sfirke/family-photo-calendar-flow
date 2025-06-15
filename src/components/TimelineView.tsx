
import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { getNext3Days, formatDate } from '@/utils/dateUtils';

interface TimelineViewProps {
  events: Event[];
}

const TimelineView = ({ events }: TimelineViewProps) => {
  const next3Days = getNext3Days();
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="space-y-6">
      {next3Days.map((date, index) => {
        const dayEvents = getEventsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        
        return (
          <div key={index} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                {formatDate(date, 'long')}
                {isToday && <span className="ml-2 text-sm text-yellow-300">(Today)</span>}
              </h3>
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-sm text-white/60">
                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {dayEvents.length > 0 ? (
              <div className="space-y-3 ml-4">
                {dayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    className="animate-fade-in"
                  />
                ))}
              </div>
            ) : (
              <div className="ml-4 text-white/50 text-sm italic">
                No events scheduled
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;
