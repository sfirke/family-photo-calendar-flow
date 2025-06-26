
import React from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay } from 'date-fns';
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
  
  // Filter events to only include next 3 days
  const filteredEvents = events.filter(event => {
    return next3Days.some(day => 
      format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
  });

  // Group events by date and sort all-day events first
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = format(event.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort events within each day: all-day events first, then by time
  Object.keys(groupedEvents).forEach(dateKey => {
    groupedEvents[dateKey].sort((a, b) => {
      // All-day events first
      const aIsAllDay = a.time === 'All day';
      const bIsAllDay = b.time === 'All day';
      
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      if (aIsAllDay && bIsAllDay) return a.title.localeCompare(b.title);
      
      // For timed events, sort by time
      return a.time.localeCompare(b.time);
    });
  });

  // Get sorted dates for the next 3 days
  const sortedDates = next3Days.map(day => format(day, 'yyyy-MM-dd'));

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(dateStr => {
        const date = new Date(dateStr);
        const dayEvents = groupedEvents[dateStr] || [];
        const weather = getWeatherForDate(date);
        
        return (
          <div key={dateStr} className="space-y-4">
            {/* Date header with horizontal rule and weather */}
            <div className="relative flex items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {getDateLabel(dateStr)}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{dayEvents.length} events</span>
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
            
            {/* Events without border line */}
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id}>
                  <EventCard event={event} viewMode="timeline" />
                </div>
              ))}
              
              {dayEvents.length === 0 && (
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
