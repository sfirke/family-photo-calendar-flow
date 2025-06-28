
import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
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

  // Helper function to check if an event spans multiple days - FIXED VERSION
  const isMultiDayEvent = (event: Event) => {
    if (!isAllDayEvent(event)) return false;
    
    // For ICS calendar events, ONLY trust the isMultiDay property if it exists and is explicitly true
    if ('isMultiDay' in event) {
      return event.isMultiDay === true;
    }
    
    // For all other events (sample events, events without isMultiDay property), 
    // be extremely conservative - only consider multi-day if explicitly stated
    return false; // Default to single-day unless proven otherwise
  };

  // Get events for each day - FIXED to prevent duplication
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      // Always show events on their specific date
      if (isSameDay(event.date, day)) {
        return true;
      }
      
      // ONLY show on additional days if it's explicitly a multi-day event
      // AND we're dealing with an ICS event that has isMultiDay: true
      if ('isMultiDay' in event && event.isMultiDay === true && isAllDayEvent(event)) {
        // This is a truly multi-day event from ICS calendar
        return true;
      }
      
      // All other cases: don't show the event
      return false;
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
