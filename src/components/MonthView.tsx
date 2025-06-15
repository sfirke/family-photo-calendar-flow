
import React, { useState } from 'react';
import { Event } from '@/types/calendar';
import DayViewModal from './DayViewModal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sun, Cloud, CloudRain } from 'lucide-react';

interface MonthViewProps {
  events: Event[];
  getWeatherForDate: (date: Date) => { temp: number; condition: string };
}

const MonthView = ({ events, getWeatherForDate }: MonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const getMonthDays = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const daysInMonth = [];
    let day = startDate;

    // Add padding days from the previous month
    const firstDayOfWeek = startDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const paddingDate = new Date(startDate);
      paddingDate.setDate(startDate.getDate() - (firstDayOfWeek - i));
      daysInMonth.push(paddingDate);
    }

    while (day <= endDate) {
      daysInMonth.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }

    // Add padding days from the next month
    const lastDayOfWeek = endDate.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const paddingDate = new Date(endDate);
      paddingDate.setDate(endDate.getDate() + i);
      daysInMonth.push(paddingDate);
    }

    return daysInMonth;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleDayClick = (date: Date, dayEvents: Event[]) => {
    if (dayEvents.length > 0) {
      setSelectedDate(date);
      setShowDayModal(true);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-3 w-3 text-yellow-400" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-3 w-3 text-gray-300" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="h-3 w-3 text-blue-400" />;
      default:
        return <Sun className="h-3 w-3 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <h3 className="text-lg font-bold text-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="text-white hover:bg-white/20"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-white/70 font-medium py-2 text-sm">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {getMonthDays().map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const weather = getWeatherForDate(date);
          const hasEvents = dayEvents.length > 0;
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 ${
                isCurrentMonth ? '' : 'opacity-50'
              } ${hasEvents ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''}`}
              onClick={() => handleDayClick(date, dayEvents)}
            >
              {/* Date and Weather with forecast data */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isToday ? 'text-yellow-300' : 'text-white'}`}>
                  {date.getDate()}
                </span>
                <div className="flex items-center gap-1">
                  {getWeatherIcon(weather.condition)}
                  <span className="text-xs text-white/70">{weather.temp}°</span>
                </div>
              </div>
              
              {isToday && <div className="w-full h-0.5 bg-yellow-300 mb-2"></div>}
              
              {/* Event Dots Only */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center items-center min-h-[60px]">
                  {dayEvents.slice(0, 12).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`w-3 h-3 rounded-full ${event.color} opacity-80 hover:opacity-100 transition-opacity`}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 12 && (
                    <div className="text-xs text-white/70 font-medium bg-white/20 px-2 py-1 rounded-full">
                      +{dayEvents.length - 12}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day View Modal */}
      {selectedDate && (
        <DayViewModal
          open={showDayModal}
          onOpenChange={setShowDayModal}
          date={selectedDate}
          events={getEventsForDate(selectedDate)}
          getWeatherForDate={getWeatherForDate}
        />
      )}
    </div>
  );
};

export default MonthView;
