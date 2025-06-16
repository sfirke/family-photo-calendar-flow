import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain } from 'lucide-react';
import { getWeekDays, getWeekDateRange } from '@/utils/dateUtils';

interface WeekViewProps {
  events: Event[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const WeekView = ({ events, weekOffset, onPreviousWeek, onNextWeek, getWeatherForDate }: WeekViewProps) => {
  const weekDays = getWeekDays(weekOffset);
  
  const getEventsForDate = (date: Date) => {
    const dayEvents = events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
    
    // Sort events: all-day events first, then regular events
    return dayEvents.sort((a, b) => {
      const aIsAllDay = a.time.toLowerCase().includes('all day') || a.time === '00:00 - 23:59';
      const bIsAllDay = b.time.toLowerCase().includes('all day') || b.time === '00:00 - 23:59';
      
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      return 0;
    });
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
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousWeek}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <h3 className="text-lg font-bold text-white">
          {getWeekDateRange(weekOffset)}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextWeek}
          className="text-white hover:bg-white/20"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const weather = getWeatherForDate(date);
          
          return (
            <div key={index} className="space-y-3">
              <div className="text-center">
                <h3 className={`text-sm font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </h3>
                <p className={`text-lg ${isToday ? 'text-yellow-300' : 'text-white/80'}`}>
                  {date.getDate()}
                </p>
                
                {/* Weather Info with forecast data */}
                <div className="flex items-center justify-center gap-1 mt-2">
                  {getWeatherIcon(weather.condition)}
                  <span className="text-sm text-white/70">{weather.temp}°</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    className="animate-fade-in text-xs"
                    showBoldHeader={true}
                    viewMode="week"
                  />
                ))}
                {dayEvents.length === 0 && (
                  <div className="text-white/30 text-xs text-center py-4">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
