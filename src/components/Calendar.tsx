
import React, { useState, useEffect } from 'react';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarContent from './calendar/CalendarContent';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
import { useLocalEvents } from '@/hooks/useLocalEvents';
import { useIntegratedEvents } from '@/hooks/useIntegratedEvents';

const Calendar = () => {
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents } = useLocalEvents(); // Now contains iCal events
  
  const { filteredEvents, eventStats } = useIntegratedEvents(googleEvents);

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

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
    <div className="space-y-6">
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
      />
    </div>
  );
};

export default Calendar;
