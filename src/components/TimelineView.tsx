
import React from 'react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay } from 'date-fns';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import WeatherWidget from './WeatherWidget';

interface TimelineViewProps {
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const TimelineView = ({ events, getWeatherForDate }: TimelineViewProps) => {
  // Group events by date and sort all-day events first
  const groupedEvents = events.reduce((acc, event) => {
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

  // Get sorted dates
  const sortedDates = Object.keys(groupedEvents).sort();

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
        const dayEvents = groupedEvents[dateStr];
        
        return (
          <div key={dateStr} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getDateLabel(dateStr)}
              </h3>
              <WeatherWidget 
                weather={getWeatherForDate(date)}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                  />
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {sortedDates.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No events found for the selected calendars.</p>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
