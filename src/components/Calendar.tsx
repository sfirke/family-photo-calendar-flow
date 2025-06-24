
import React, { useState, useEffect } from 'react';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarContent from './calendar/CalendarContent';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useEventFiltering } from '@/hooks/useEventFiltering';

const Calendar = () => {
  const [view, setView] = useState<'timeline' | 'week' | 'month'>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents } = useGoogleCalendarEvents();
  const { selectedCalendarIds, updateSelectedCalendars } = useCalendarSelection();
  
  const { filteredEvents, hasGoogleEvents } = useEventFiltering({
    googleEvents,
    selectedCalendarIds
  });

  useEffect(() => {
    setView(defaultView);
  }, [defaultView]);

  return (
    <div className="space-y-6">
      <CalendarHeader
        hasGoogleEvents={hasGoogleEvents}
        selectedCalendarIds={selectedCalendarIds}
        onCalendarChange={updateSelectedCalendars}
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
