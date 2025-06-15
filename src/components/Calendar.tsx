
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
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';

const Calendar = () => {
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Personal', 'Work', 'Family', 'Kids', 'Holidays']);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents, isLoading: googleEventsLoading } = useGoogleCalendarEvents();
  const { calendars, isLoading: calendarsLoading } = useGoogleCalendars();

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  // Auto-select all available calendars when they are first loaded
  useEffect(() => {
    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      const allCalendarIds = calendars.map(cal => cal.id);
      setSelectedCalendarIds(allCalendarIds);
      console.log('Auto-selecting all calendars:', allCalendarIds);
    }
  }, [calendars, selectedCalendarIds.length]);

  // Use Google Calendar events if available, otherwise use sample events
  const hasGoogleEvents = googleEvents.length > 0;
  const baseEvents = hasGoogleEvents ? googleEvents : sampleEvents;

  // Filter events by selected categories and calendar IDs
  const filteredEvents = baseEvents.filter(event => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(event.category);
    
    // For Google Calendar events, also filter by selected calendar IDs
    if (hasGoogleEvents && selectedCalendarIds.length > 0) {
      const eventCalendarId = event.calendarId || 'primary';
      const calendarMatch = selectedCalendarIds.includes(eventCalendarId);
      console.log(`Event "${event.title}" - Calendar ID: ${eventCalendarId}, Selected: ${calendarMatch}`);
      return categoryMatch && calendarMatch;
    }
    
    return categoryMatch;
  });

  console.log(`Filtered events: ${filteredEvents.length} out of ${baseEvents.length} total events`);
  console.log('Selected calendar IDs:', selectedCalendarIds);
  console.log('Has Google events:', hasGoogleEvents);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        
        <div className="flex items-center gap-4">
          <CalendarFilters 
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            selectedCalendarIds={selectedCalendarIds}
            onCalendarChange={setSelectedCalendarIds}
            showGoogleCalendars={hasGoogleEvents}
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
