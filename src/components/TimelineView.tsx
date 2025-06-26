
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
  // Get only the next 3 days starting from today
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
            {/* Date header with weather and event count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {getDateLabel(dateStr)}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{dayEvents.length} events</span>
                  <span>Low: {weather.temp - 10}°</span>
                </div>
              </div>
              <WeatherDisplay 
                weather={weather}
                className="text-sm"
              />
            </div>
            
            {/* Border line connecting date to events */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-3 pl-8">
                {dayEvents.map(event => (
                  <div key={event.id} className="relative">
                    {/* Connection dot */}
                    <div className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900"></div>
                    <EventCard event={event} viewMode="timeline" />
                  </div>
                ))}
                
                {dayEvents.length === 0 && (
                  <div className="relative">
                    <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-900"></div>
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p>No events scheduled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineView;
