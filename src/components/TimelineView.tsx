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
