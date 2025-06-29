
import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sun, Cloud, CloudRain, Calendar, Clock } from 'lucide-react';

interface DayViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const DayViewModal = ({ open, onOpenChange, date, events, getWeatherForDate }: DayViewModalProps) => {
  const weather = getWeatherForDate(date);
  const isToday = date.toDateString() === new Date().toDateString();

  const sortEventsByTimeAndType = (events: Event[]) => {
    return events.sort((a, b) => {
      const aIsAllDay = a.time.toLowerCase().includes('all day');
      const bIsAllDay = b.time.toLowerCase().includes('all day');
      const aIsMultiDay = a.time.includes('days');
      const bIsMultiDay = b.time.includes('days');
      
      // Multi-day events first
      if (aIsMultiDay && !bIsMultiDay) return -1;
      if (!aIsMultiDay && bIsMultiDay) return 1;
      
      // All-day events next
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      
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

  const sortedEvents = sortEventsByTimeAndType(events);
  const allDayEvents = sortedEvents.filter(event => event.time.toLowerCase().includes('all day'));
  const timedEvents = sortedEvents.filter(event => !event.time.toLowerCase().includes('all day'));

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-5 w-5 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-5 w-5 text-gray-300" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="h-5 w-5 text-blue-400" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] max-w-3xl h-[85vh] max-h-none bg-white/95 backdrop-blur-sm border-white/20 p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200/50">
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-gray-600" />
              <span className={isToday ? 'text-yellow-600' : 'text-gray-900'}>
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {isToday && <span className="ml-2 text-sm text-yellow-600">(Today)</span>}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                {getWeatherIcon(weather.condition)}
                <span className="text-base font-medium">{weather.temp}°</span>
              </div>
              <div className="text-sm text-gray-500">
                {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {sortedEvents.length > 0 ? (
            <div className="space-y-6">
              {/* All-day events section */}
              {allDayEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 border-b border-gray-200 pb-2">
                    <Clock className="h-4 w-4" />
                    All Day Events
                  </div>
                  <div className="space-y-3">
                    {allDayEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        className="bg-white/80 border border-gray-200 shadow-sm w-full"
                        viewMode="timeline"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timed events section */}
              {timedEvents.length > 0 && (
                <div className="space-y-3">
                  {allDayEvents.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 border-b border-gray-200 pb-2">
                      <Clock className="h-4 w-4" />
                      Scheduled Events
                    </div>
                  )}
                  <div className="space-y-3">
                    {timedEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        className="bg-white/80 border border-gray-200 shadow-sm w-full"
                        viewMode="timeline"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No events scheduled</p>
              <p className="text-sm">This day is free for new activities</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayViewModal;
