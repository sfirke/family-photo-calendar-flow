import React from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay, differenceInDays, isSameDay } from 'date-fns';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import WeatherDisplay from './WeatherDisplay';

interface TimelineViewProps {
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const TimelineView = ({ events, getWeatherForDate }: TimelineViewProps) => {
  // Get today and the next 2 days (total of 3 days starting from today)
  const today = new Date();
  const next3Days = Array.from({ length: 3 }, (_, i) => addDays(today, i));
  
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

  // Group events by date and categorize them
  const groupedEventsByDay = next3Days.map(day => {
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

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {groupedEventsByDay.map(({ day, allDayEvents, timedEvents, totalEvents }) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const weather = getWeatherForDate(day);
        
        return (
          <div key={dateStr} className="space-y-3 sm:space-y-4">
            {/* Responsive Date header with horizontal rule and weather */}
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {getDateLabel(day)}
                </h3>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70">
                  <span>{totalEvents} events</span>
                </div>
              </div>
              
              {/* Horizontal rule line - hidden on mobile when stacked */}
              <div className="hidden sm:flex flex-1 mx-4">
                <hr className="border-border w-full" />
              </div>
              
              {/* Responsive Weather display */}
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/70 self-start sm:self-center">
                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-2">
                    <WeatherDisplay 
                      weather={weather}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="text-xs text-white/50">
                    Low: {weather.temp - 10}°
                  </div>
                </div>
              </div>
            </div>
            
            {/* Responsive All-day events - full width on mobile, 45% on larger screens */}
            {allDayEvents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 w-full sm:w-[45%]">
                {allDayEvents.map(event => (
                  <div key={`${event.id}-${dateStr}`} className="flex-shrink-0 w-full sm:w-auto">
                    <EventCard 
                      event={event} 
                      viewMode="timeline" 
                      isMultiDayDisplay={isMultiDayEvent(event)}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Timed events */}
            <div className="space-y-2 sm:space-y-3">
              {timedEvents.map(event => (
                <div key={event.id}>
                  <EventCard event={event} viewMode="timeline" />
                </div>
              ))}
              
              {totalEvents === 0 && (
                <div className="text-center py-3 sm:py-4 text-muted-foreground">
                  <p className="text-sm sm:text-base">No events scheduled</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;
