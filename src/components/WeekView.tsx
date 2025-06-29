
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import EventCard from './EventCard';
import WeatherDisplay from './WeatherDisplay';

interface WeekViewProps {
  events: Event[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const WeekView = ({ events, weekOffset, onPreviousWeek, onNextWeek, getWeatherForDate }: WeekViewProps) => {
  const today = new Date();
  const weekStart = addDays(startOfWeek(today, { weekStartsOn: 0 }), weekOffset * 7);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Helper function to check if an event is all-day
  const isAllDayEvent = (event: Event) => {
    return event.time === 'All day' || event.time.toLowerCase().includes('all day');
  };

  // Helper function to check if an event spans multiple days - VERY CONSERVATIVE
  const isMultiDayEvent = (event: Event) => {
    // Only return true if the event explicitly has isMultiDay property set to true
    return 'isMultiDay' in event && event.isMultiDay === true;
  };

  // Get events for each day - STRICT date matching with proper multi-day range checking
  const getEventsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    
    return events.filter(event => {
      const eventDate = startOfDay(new Date(event.date));
      
      // For explicitly multi-day events, we need to check if this day falls within their range
      if (isMultiDayEvent(event)) {
        // For now, we'll be conservative and only show on the exact event date
        // TODO: Implement proper date range checking when we have end dates
        return eventDate.getTime() === dayStart.getTime();
      }
      
      // For single-day events, ONLY show on the exact date
      return eventDate.getTime() === dayStart.getTime();
    });
  };

  // Group events by day and categorize them
  const eventsByDay = weekDays.map(day => {
    const dayEvents = getEventsForDay(day);
    
    // Separate all-day events from timed events
    const allDayEvents = dayEvents.filter(isAllDayEvent);
    const timedEvents = dayEvents.filter(event => !isAllDayEvent(event));
    
    // Sort all-day events alphabetically
    allDayEvents.sort((a, b) => a.title.localeCompare(b.title));
    
    // Sort timed events by time
    timedEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    return { 
      day, 
      allDayEvents,
      timedEvents,
      totalEvents: dayEvents.length
    };
  });

  return (
    <div className="space-y-4">
      {/* Responsive Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white text-center px-2">
          {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Next</span>
        </Button>
      </div>

      {/* Responsive Week Grid - Stack on mobile, grid on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {eventsByDay.map(({ day, allDayEvents, timedEvents }, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4 min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-center sm:text-left">
                <div className="text-xs sm:text-sm font-medium text-white">
                  {format(day, 'EEE')}
                </div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {format(day, 'd')}
                </div>
              </div>
              <WeatherDisplay 
                weather={getWeatherForDate(day)}
                className="text-xs hidden sm:block"
                forceWhite={true}
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2 overflow-hidden">
              {/* All-day events at the top */}
              {allDayEvents.map(event => (
                <div key={`${event.id}-${format(day, 'yyyy-MM-dd')}`} className="truncate">
                  <EventCard 
                    event={event} 
                    viewMode="week" 
                    isMultiDayDisplay={isMultiDayEvent(event)}
                  />
                </div>
              ))}
              
              {/* Timed events below */}
              {timedEvents.map(event => (
                <div key={event.id} className="truncate">
                  <EventCard event={event} viewMode="week" />
                </div>
              ))}
              
              {allDayEvents.length === 0 && timedEvents.length === 0 && (
                <p className="text-xs text-white/70 italic">No events</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
