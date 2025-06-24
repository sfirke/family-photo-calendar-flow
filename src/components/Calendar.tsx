
import React, { useState, useEffect } from 'react';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarContent from './calendar/CalendarContent';
import { useSettings } from '@/contexts/SettingsContext';
import { useWeather } from '@/contexts/WeatherContext';
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useEventFiltering } from '@/hooks/useEventFiltering';

interface CalendarProps {
  view: 'timeline' | 'week' | 'month';
  selectedCalendarIds: string[];
  onHasGoogleEventsChange: (hasEvents: boolean) => void;
}

const Calendar = ({ view, selectedCalendarIds, onHasGoogleEventsChange }: CalendarProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { defaultView } = useSettings();
  const { getWeatherForDate } = useWeather();
  const { googleEvents } = useGoogleCalendarEvents();
  const { updateSelectedCalendars } = useCalendarSelection();
  
  const { filteredEvents, hasGoogleEvents } = useEventFiltering({
    googleEvents,
    selectedCalendarIds
  });

  // Notify parent component when hasGoogleEvents changes
  useEffect(() => {
    onHasGoogleEventsChange(hasGoogleEvents);
  }, [hasGoogleEvents, onHasGoogleEventsChange]);

  return (
    <div className="space-y-6">
      <CalendarHeader
        hasGoogleEvents={hasGoogleEvents}
        selectedCalendarIds={selectedCalendarIds}
        onCalendarChange={updateSelectedCalendars}
        view={view}
        onViewChange={() => {}} // No-op since view is controlled by parent
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
