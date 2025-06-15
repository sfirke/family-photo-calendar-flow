
import React from 'react';
import { Event } from '@/types/calendar';
import EventCard from './EventCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sun, Cloud, CloudRain } from 'lucide-react';

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
      <DialogContent className="w-[75vw] h-[75vh] max-w-none bg-white/95 backdrop-blur-sm border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className={isToday ? 'text-yellow-600' : 'text-gray-900'}>
              {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.condition)}
              <span className="text-sm text-gray-600">{weather.temp}°</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 overflow-y-auto flex-1">
          {events.length > 0 ? (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
                className="bg-white/80 border border-gray-200"
                viewMode="timeline"
              />
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No events for this day
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayViewModal;
