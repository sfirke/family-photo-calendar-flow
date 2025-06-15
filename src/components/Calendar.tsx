
import React, { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import TimelineView from './TimelineView';
import CalendarSelector from './CalendarSelector';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, List } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';

const SELECTED_CALENDARS_KEY = 'selectedCalendarIds';

const Calendar = () => {
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents, isLoading: googleEventsLoading } = useGoogleCalendarEvents();
  const { calendars, isLoading: calendarsLoading } = useGoogleCalendars();

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  // Load selected calendar IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SELECTED_CALENDARS_KEY);
    if (stored) {
      try {
        const parsedIds = JSON.parse(stored);
        setSelectedCalendarIds(parsedIds);
        console.log('Calendar: Loaded selected calendar IDs from localStorage:', parsedIds);
      } catch (error) {
        console.error('Calendar: Error parsing stored calendar IDs:', error);
      }
    }
  }, []);

  // Auto-select all available calendars when they are first loaded and no selection exists
  useEffect(() => {
    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      const allCalendarIds = calendars.map(cal => cal.id);
      setSelectedCalendarIds(allCalendarIds);
      localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(allCalendarIds));
      console.log('Calendar: Auto-selecting all calendars on first load:', allCalendarIds);
    }
  }, [calendars, selectedCalendarIds.length]);

  // Listen for changes to localStorage from other components (like CalendarsTab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SELECTED_CALENDARS_KEY && e.newValue) {
        try {
          const newSelectedIds = JSON.parse(e.newValue);
          setSelectedCalendarIds(newSelectedIds);
          console.log('Calendar: Updated selected calendar IDs from storage event:', newSelectedIds);
        } catch (error) {
          console.error('Calendar: Error parsing storage event data:', error);
        }
      }
    };

    // Listen for storage events from other tabs/components
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events within the same tab
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === SELECTED_CALENDARS_KEY) {
        try {
          const newSelectedIds = JSON.parse(e.detail.newValue);
          setSelectedCalendarIds(newSelectedIds);
          console.log('Calendar: Updated selected calendar IDs from custom event:', newSelectedIds);
        } catch (error) {
          console.error('Calendar: Error parsing custom event data:', error);
        }
      }
    };

    window.addEventListener('localStorageChange' as any, handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange' as any, handleCustomStorageChange);
    };
  }, []);

  // Update selected calendars and persist to localStorage
  const handleCalendarChange = (newSelectedIds: string[]) => {
    setSelectedCalendarIds(newSelectedIds);
    localStorage.setItem(SELECTED_CALENDARS_KEY, JSON.stringify(newSelectedIds));
    console.log('Calendar: Updated selected calendar IDs:', newSelectedIds);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: SELECTED_CALENDARS_KEY, newValue: JSON.stringify(newSelectedIds) }
    }));
  };

  // Use Google Calendar events if available, otherwise use sample events
  const hasGoogleEvents = googleEvents.length > 0;
  const baseEvents = hasGoogleEvents ? googleEvents : sampleEvents;

  // Filter events by selected calendar IDs
  const filteredEvents = baseEvents.filter(event => {
    // For Google Calendar events, filter by selected calendar IDs
    if (hasGoogleEvents) {
      if (selectedCalendarIds.length === 0) {
        // If no calendars selected, show no events
        console.log(`Event "${event.title}" - No calendars selected, hiding event`);
        return false;
      }
      const eventCalendarId = event.calendarId || 'primary';
      const calendarMatch = selectedCalendarIds.includes(eventCalendarId);
      console.log(`Event "${event.title}" - Calendar ID: ${eventCalendarId}, Selected: ${calendarMatch}`);
      return calendarMatch;
    }
    
    // For sample events, show all events when no Google events are available
    // This ensures sample events are always visible when not using Google Calendar
    console.log(`Sample event "${event.title}" - Showing (no Google events available)`);
    return true;
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
          {hasGoogleEvents && (
            <CalendarSelector 
              selectedCalendarIds={selectedCalendarIds}
              onCalendarChange={handleCalendarChange}
            />
          )}
          
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
