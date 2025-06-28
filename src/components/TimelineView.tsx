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

  // Helper function to check if an event spans multiple days
  const isMultiDayEvent = (event: Event) => {
    if (!isAllDayEvent(event)) return false;
    
    // For ICS calendar events, respect the isMultiDay property if it exists
    if ('isMultiDay' in event) {
      return event.isMultiDay === true;
    }
    
    // For sample events, check if the event title or description indicates multiple days
    const titleLower = event.title.toLowerCase();
    const descLower = (event.description || '').toLowerCase();
    
    return titleLower.includes('days') || titleLower.includes('week') || 
           descLower.includes('days') || descLower.includes('week') ||
           event.time.includes('days');
  };

  // Get events for each day - only show events on their specific date unless they're truly multi-day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      // Regular events on this specific day
      if (isSameDay(event.date, day)) {
        return true;
      }
      
      // Only show multi-day events on other days if they're actually multi-day
      if (isMultiDayEvent(event)) {
        // For multi-day events, show them on each day in our range
        // This is a simplified approach - in a real app you'd parse the actual duration
        return next3Days.some(rangeDay => isSameDay(rangeDay, day));
      }
      
      return false;
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
    <div className="space-y-6">
      {groupedEventsByDay.map(({ day, allDayEvents, timedEvents, totalEvents }) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const weather = getWeatherForDate(day);
        
        return (
          <div key={dateStr} className="space-y-4">
            {/* Date header with horizontal rule and weather */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {getDateLabel(day)}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{totalEvents} events</span>
                </div>
              </div>
              
              {/* Horizontal rule line */}
              <div className="flex-1 mx-4">
                <hr className="border-border" />
              </div>
              
              {/* Weather on the right with low temp below high temp */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <WeatherDisplay 
                      weather={weather}
                      className="text-sm"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    Low: {weather.temp - 10}°
                  </div>
                </div>
              </div>
            </div>
            
            {/* All-day events at the top - 45% width with flex wrap */}
            {allDayEvents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" style={{ width: '45%' }}>
                {allDayEvents.map(event => (
                  <div key={`${event.id}-${dateStr}`} className="flex-shrink-0">
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
            <div className="space-y-3">
              {timedEvents.map(event => (
                <div key={event.id}>
                  <EventCard event={event} viewMode="timeline" />
                </div>
              ))}
              
              {totalEvents === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No events scheduled</p>
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
