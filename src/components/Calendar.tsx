
import React, { useState, useEffect } from 'react';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarContent from './calendar/CalendarContent';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { useIntegratedEvents } from '@/hooks/useIntegratedEvents';
import { useCalendarRefresh } from '@/hooks/useCalendarRefresh';
import { Event } from '@/types/calendar';

interface CalendarProps {
  onNotionEventClick?: (event: Event) => void;
}

const Calendar = ({ onNotionEventClick }: CalendarProps) => {
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents, forceRefresh } = useLocalEvents(); // Now contains iCal events
  const { useRefreshListener } = useCalendarRefresh();
  
  const { filteredEvents, eventStats } = useIntegratedEvents(googleEvents, refreshKey);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  // Listen for calendar refresh events
  useRefreshListener((refreshEvent) => {
    console.log('📱 Calendar received refresh event:', refreshEvent);
    
    // Force refresh of local events when sync completes
    if (forceRefresh) {
      forceRefresh();
    }
    
    // Trigger a re-render by updating refresh key
    setRefreshKey(prev => prev + 1);
    
    // Add a small delay to ensure all data is updated before re-rendering
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  });

  // Log whenever filteredEvents changes to verify UI updates
  console.log('🖥️ Calendar - Render with events:', {
    filteredEventsCount: filteredEvents.length,
    eventStats,
    view,
    timestamp: new Date().toISOString()
  });

  // Always show the calendar header - let CalendarSelector handle its own state
  console.log('🖥️ Calendar - Event stats:', eventStats);

  return (
    <div className="space-y-6" key={`calendar-${refreshKey}`}>
      <CalendarHeader
        hasGoogleEvents={true} // Always pass true to show the header
        view={view}
        onViewChange={setView}
      />

      <CalendarContent
        view={view}
        events={filteredEvents}
        weekOffset={weekOffset}
        onPreviousWeek={() => setWeekOffset(prev => prev - 1)}
        onNextWeek={() => setWeekOffset(prev => prev + 1)}
        getWeatherForDate={getWeatherForDate}
        onNotionEventClick={onNotionEventClick}
      />
    </div>
  );
};

export default Calendar;
