
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

  // Group events by day and sort all-day events first
  const eventsByDay = weekDays.map(day => {
    const dayEvents = events.filter(event => isSameDay(event.date, day));
    
    // Sort events: all-day events first, then by time
    dayEvents.sort((a, b) => {
      const aIsAllDay = a.time === 'All day';
      const bIsAllDay = b.time === 'All day';
      
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      if (aIsAllDay && bIsAllDay) return a.title.localeCompare(b.title);
      
      return a.time.localeCompare(b.time);
    });
    
    return { day, events: dayEvents };
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
        {eventsByDay.map(({ day, events: dayEvents }, index) => (
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
              {dayEvents.map(event => (
                <div key={event.id} className="truncate">
                  <EventCard event={event} viewMode="week" />
                </div>
              ))}
              
              {dayEvents.length === 0 && (
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
