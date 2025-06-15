
import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { getNext3Days, formatDate } from '@/utils/dateUtils';
import { Sun, Cloud, CloudRain } from 'lucide-react';

interface TimelineViewProps {
  events: Event[];
  getWeatherForDate?: (date: Date) => { temp: number; condition: string };
}

const TimelineView = ({ events, getWeatherForDate }: TimelineViewProps) => {
  const next3Days = getNext3Days();
  
  const getEventsForDate = (date: Date) => {
    const dayEvents = events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
    
    // Separate all-day and regular events
    const allDayEvents = dayEvents.filter(event => 
      event.time.toLowerCase().includes('all day') || event.time === '00:00 - 23:59'
    );
    const regularEvents = dayEvents.filter(event => 
      !event.time.toLowerCase().includes('all day') && event.time !== '00:00 - 23:59'
    );
    
    // Return all-day events first, then regular events
    return [...allDayEvents, ...regularEvents];
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
    <div className="space-y-6">
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
                {dayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    className="animate-fade-in"
                    viewMode="timeline"
                  />
                ))}
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
  );
};

export default TimelineView;
