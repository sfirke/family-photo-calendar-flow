
import React, { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain } from 'lucide-react';
import { Event } from '@/types/calendar';

interface MonthViewProps {
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const MonthView = ({ events, getWeatherForDate }: MonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-3 w-3 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-3 w-3 text-gray-400" />;
      case 'rain':
      case 'rainy':
        return <CloudRain className="h-3 w-3 text-blue-400" />;
      default:
        return <Sun className="h-3 w-3 text-yellow-400" />;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-4 dark:bg-gray-800/95 dark:border-gray-700/20 h-full flex flex-col">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {monthName}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2"></div>;
          }
          
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isPastDay = date < today && !isToday;
          const weather = getWeatherForDate(date);
          
          return (
            <div
              key={index}
              className={`
                p-2 min-h-[80px] border border-gray-200 dark:border-gray-600 relative
                ${isToday ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600' : ''}
                ${isPastDay ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="text-sm font-medium">
                  {date.getDate()}
                </div>
                
                {/* Weather Info */}
                <div className="flex items-center gap-1">
                  {getWeatherIcon(weather.condition)}
                  <span className="text-xs text-gray-600 dark:text-gray-400">{weather.temp}°</span>
                </div>
              </div>
              
              {/* Event Dots */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`w-2 h-2 rounded-full ${event.color}`}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" title={`+${dayEvents.length - 3} more events`} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
