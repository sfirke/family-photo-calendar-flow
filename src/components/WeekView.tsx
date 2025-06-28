
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
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousWeek}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextWeek}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {eventsByDay.map(({ day, allDayEvents, timedEvents }, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {format(day, 'd')}
                </div>
              </div>
              <WeatherDisplay 
                weather={getWeatherForDate(day)}
                className="text-xs"
              />
            </div>
            
            <div className="space-y-2 overflow-hidden">
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
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">No events</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
