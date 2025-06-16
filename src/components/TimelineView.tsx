import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { getNext3Days, formatDate } from '@/utils/dateUtils';
import { Sun, Cloud, CloudRain } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelineViewProps {
  events: Event[];
  getWeatherForDate?: (date: Date) => { temp: number; condition: string };
}

const TimelineView = ({ events, getWeatherForDate }: TimelineViewProps) => {
  const next3Days = getNext3Days();
  
  const getEventsForDate = (date: Date) => {
    const allEvents = events.filter(event => {
      // Check if event falls on this date
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.date);
      
      // For multi-day events, we need to check if this date falls within the event span
      const isMultiDay = event.time.includes('days');
      if (isMultiDay) {
        // Extract the number of days from the time string
        const daysMatch = event.time.match(/\((\d+) days\)/);
        if (daysMatch) {
          const numDays = parseInt(daysMatch[1]);
          eventEnd.setDate(eventStart.getDate() + numDays - 1);
        }
      }
      
      // Check if the current date falls within the event range
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      
      return currentDate >= eventStart && currentDate <= eventEnd;
    });
    
    // Separate multi-day and single-day events
    const multiDayEvents = allEvents.filter(event => 
      event.time.includes('days')
    );
    const singleDayEvents = allEvents.filter(event => 
      !event.time.includes('days')
    );
    
    // Separate all-day and regular single-day events
    const allDayEvents = singleDayEvents.filter(event => 
      event.time.toLowerCase().includes('all day')
    );
    const regularEvents = singleDayEvents.filter(event => 
      !event.time.toLowerCase().includes('all day')
    );
    
    // Return multi-day events first, then all-day events, then regular events
    return [...multiDayEvents, ...allDayEvents, ...regularEvents];
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-4 w-4 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-4 w-4 text-gray-300" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      default:
        return <Sun className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        {next3Days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const weather = getWeatherForDate ? getWeatherForDate(date) : null;
          
          return (
            <div key={index} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className={`text-lg font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                  {formatDate(date, 'long')}
                  {isToday && <span className="ml-2 text-sm text-yellow-300">(Today)</span>}
                </h3>
                <div className="flex-1 h-px bg-white/20"></div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                  </span>
                  {weather && (
                    <div className="flex items-center gap-2">
                      {getWeatherIcon(weather.condition)}
                      <span className="text-white/70">{weather.temp}°F</span>
                    </div>
                  )}
                </div>
              </div>
              
              {dayEvents.length > 0 ? (
                <div className="space-y-3 ml-4">
                  {dayEvents.map((event) => {
                    const isMultiDay = event.time.includes('days');
                    return (
                      <EventCard 
                        key={`${event.id}-${date.toDateString()}`} 
                        event={event}
                        className="animate-fade-in"
                        viewMode="timeline"
                        isMultiDayDisplay={isMultiDay}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="ml-4 text-white/50 text-sm italic">
                  No events scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default TimelineView;
