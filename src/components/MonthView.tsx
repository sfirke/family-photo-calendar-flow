import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, isSameMonth, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Event } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import DayViewModal from './DayViewModal';
import WeatherDisplay from './WeatherDisplay';
import { compareTimeStrings } from '@/utils/timeUtils';

interface MonthViewProps {
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const MonthView = ({ events, getWeatherForDate }: MonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - getDay(monthStart));
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - getDay(monthEnd)));

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayEvents = (day: Date) => {
    const dayEvents = events.filter(event => isSameDay(event.date, day));
    
    // Sort events: all-day events first (alphabetically), then timed events chronologically
    dayEvents.sort((a, b) => {
      const aIsAllDay = a.time === 'All day' || a.time.toLowerCase().includes('all day');
      const bIsAllDay = b.time === 'All day' || b.time.toLowerCase().includes('all day');
      
      if (aIsAllDay && !bIsAllDay) return -1;
      if (!aIsAllDay && bIsAllDay) return 1;
      if (aIsAllDay && bIsAllDay) return a.title.localeCompare(b.title);
      
      // Both are timed events - sort chronologically
      return compareTimeStrings(a.time, b.time);
    });
    
    return dayEvents;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day: Date) => {
    const dayEvents = getDayEvents(day);
    if (dayEvents.length > 0) {
      setSelectedDate(day);
    }
  };

  const handleNavigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const newDate = direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Responsive Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 text-center px-2">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-600/20 h-9 w-9 sm:h-10 sm:w-auto sm:px-4"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Next</span>
        </Button>
      </div>

      {/* Responsive Calendar Grid */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/20 overflow-hidden">
        {/* Day Headers - responsive text sizing */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
              <span className="sm:hidden">{day.charAt(0)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        {/* Responsive Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = getDayEvents(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 border-b border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
                } ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs sm:text-sm font-medium ${isDayToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && (
                    <WeatherDisplay 
                      weather={getWeatherForDate(day)}
                      className="text-xs hidden sm:block"
                    />
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 text-xs p-1 rounded truncate"
                      style={{ backgroundColor: `${event.color || '#3b82f6'}20` }}
                    >
                      <div 
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      <span className="truncate text-xs">{event.title}</span>
                    </div>
                  ))}
                  
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day View Modal */}
      {selectedDate && (
        <DayViewModal
          date={selectedDate}
          events={getDayEvents(selectedDate)}
          open={!!selectedDate}
          onOpenChange={() => setSelectedDate(null)}
          getWeatherForDate={getWeatherForDate}
          onNavigateDay={handleNavigateDay}
        />
      )}
    </div>
  );
};

export default MonthView;
