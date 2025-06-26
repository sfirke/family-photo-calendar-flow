import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { getNext3Days, formatDate } from '@/utils/dateUtils';
import { Sun, Cloud, CloudRain, CloudSnow, Zap } from 'lucide-react';

interface TimelineViewProps {
  events: Event[];
  getWeatherForDate?: (date: Date) => { temp: number; condition: string };
}

const TimelineView = ({ events, getWeatherForDate }: TimelineViewProps) => {
  const next3Days = getNext3Days();
  
  const sortEventsByTimeAndType = (events: Event[]) => {
    return events.sort((a, b) => {
      const aIsAllDay = a.time.toLowerCase().includes('all day');
      const bIsAllDay = b.time.toLowerCase().includes('all day');
      const aIsMultiDay = a.time.includes('days');
      const bIsMultiDay = b.time.includes('days');
      
      // All-day events first (including multi-day all-day events)
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      
      // Within all-day events, multi-day events first
      if (aIsAllDay && bIsAllDay) {
        if (aIsMultiDay && !bIsMultiDay) return -1;
        if (!aIsMultiDay && bIsMultiDay) return 1;
      }
      
      // For timed events, sort by time
      if (!aIsAllDay && !bIsAllDay) {
        const getTimeValue = (timeStr: string) => {
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3]?.toUpperCase();
            
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes;
          }
          return 0;
        };
        
        return getTimeValue(a.time) - getTimeValue(b.time);
      }
      
      return 0;
    });
  };
  
  const getEventsForDate = (date: Date) => {
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);
    
    const allEvents = events.filter(event => {
      const eventStart = new Date(event.date);
      eventStart.setHours(0, 0, 0, 0);
      
      // For all-day events, check if they should appear on this date
      if (event.time.toLowerCase().includes('all day')) {
        // If it's a multi-day all-day event, it should appear on each day
        if (event.time.includes('days')) {
          const daysMatch = event.time.match(/\((\d+) days\)/);
          if (daysMatch) {
            const numDays = parseInt(daysMatch[1]);
            const eventEnd = new Date(eventStart);
            eventEnd.setDate(eventStart.getDate() + numDays - 1);
            return currentDate >= eventStart && currentDate <= eventEnd;
          }
        }
        // Single day all-day event
        return eventStart.getTime() === currentDate.getTime();
      }
      
      // For regular events with time, check if they fall on this date
      if (event.time.includes('days')) {
        const daysMatch = event.time.match(/\((\d+) days\)/);
        if (daysMatch) {
          const numDays = parseInt(daysMatch[1]);
          const eventEnd = new Date(eventStart);
          eventEnd.setDate(eventStart.getDate() + numDays - 1);
          return currentDate >= eventStart && currentDate <= eventEnd;
        }
      }
      
      // Single day regular event
      return eventStart.getTime() === currentDate.getTime();
    });
    
    return sortEventsByTimeAndType(allEvents);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-5 w-5 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-5 w-5 text-gray-300" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="h-5 w-5 text-blue-400" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className="h-5 w-5 text-white" />;
      case 'thunderstorm':
        return <Zap className="h-5 w-5 text-yellow-300" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getDetailedWeather = (date: Date) => {
    if (!getWeatherForDate) return null;
    
    const weather = getWeatherForDate(date);
    // Generate some mock detailed data for demonstration
    const high = weather.temp;
    const low = Math.max(high - 15, 30); // 15 degrees lower, minimum 30°F
    
    return {
      high,
      low,
      condition: weather.condition
    };
  };

  return (
    <div className="space-y-6">
      {next3Days.map((date, index) => {
        const dayEvents = getEventsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        const detailedWeather = getDetailedWeather(date);
        
        return (
          <div key={index} className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 flex items-center gap-3">
                <h3 className={`text-lg font-medium ${isToday ? 'text-amber-400' : 'text-white'}`}>
                  {formatDate(date, 'long')}
                  {isToday && <span className="ml-2 text-sm text-amber-400">(Today)</span>}
                </h3>
                <div className="flex-1 h-px bg-white/30"></div>
                <div className="flex items-center gap-4 text-white">
                  <span className="text-base">
                    {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {detailedWeather && (
                <div className="flex flex-col items-end gap-1 text-white min-w-[100px] mt-0">
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(detailedWeather.condition)}
                    <span className="text-lg font-medium">{detailedWeather.high}°</span>
                  </div>
                  <div className="text-base text-gray-300">
                    Low: {detailedWeather.low}°
                  </div>
                </div>
              )}
            </div>
            
            {dayEvents.length > 0 ? (
              <div className="space-y-3">
                {dayEvents.map((event) => {
                  const isMultiDay = event.time.includes('days');
                  const isAllDay = event.time.toLowerCase().includes('all day');
                  return (
                    <div 
                      key={`${event.id}-${date.toDateString()}`}
                      className={isAllDay ? 'w-[65%]' : ''}
                    >
                      <EventCard 
                        event={event}
                        className="animate-fade-in"
                        viewMode="timeline"
                        isMultiDayDisplay={isMultiDay}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm italic">
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
