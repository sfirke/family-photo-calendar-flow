import React, { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import TimelineView from './TimelineView';
import CalendarFilters from './CalendarFilters';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, List } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';

const Calendar = () => {
  const [events] = useState<Event[]>(sampleEvents);
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  const filteredEvents = events.filter(event => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(event.category);
  });

  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        
        <div className="flex items-center gap-4">
          <CalendarFilters 
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
          
          {/* View Switcher */}
          <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1">
            <Button
              variant={view === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('timeline')}
              className={view === 'timeline' ? '' : 'text-white hover:bg-white/20'}
            >
              <List className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? '' : 'text-white hover:bg-white/20'}
            >
              <Clock className="h-4 w-4 mr-1" />
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? '' : 'text-white hover:bg-white/20'}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'timeline' && (
        <TimelineView events={filteredEvents} />
      )}
      {view === 'week' && (
        <WeekView 
          events={filteredEvents}
          weekOffset={weekOffset}
          onPreviousWeek={() => setWeekOffset(prev => prev - 1)}
          onNextWeek={() => setWeekOffset(prev => prev + 1)}
          getWeatherForDate={getWeatherForDate}
        />
      )}
      {view === 'month' && (
        <MonthView 
          events={filteredEvents}
          getWeatherForDate={getWeatherForDate}
        />
      )}
    </div>
  );
};

export default Calendar;
