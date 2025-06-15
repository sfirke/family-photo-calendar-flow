
import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekDays, getWeekDateRange } from '@/utils/dateUtils';

interface WeekViewProps {
  events: Event[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const WeekView = ({ events, weekOffset, onPreviousWeek, onNextWeek }: WeekViewProps) => {
  const weekDays = getWeekDays(weekOffset);
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousWeek}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <h3 className="text-lg font-medium text-white">
          {getWeekDateRange(weekOffset)}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextWeek}
          className="text-white hover:bg-white/20"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={index} className="space-y-3">
              <div className="text-center">
                <h3 className={`text-sm font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </h3>
                <p className={`text-lg ${isToday ? 'text-yellow-300' : 'text-white/80'}`}>
                  {date.getDate()}
                </p>
                {isToday && <div className="w-2 h-2 bg-yellow-300 rounded-full mx-auto mt-1"></div>}
              </div>
              
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    className="animate-fade-in text-xs"
                  />
                ))}
                {dayEvents.length === 0 && (
                  <div className="text-white/30 text-xs text-center py-4">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
