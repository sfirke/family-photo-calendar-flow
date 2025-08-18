
import React, { useState, useEffect, useRef } from 'react';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarContent from './calendar/CalendarContent';
import { useSettings } from '@/contexts/settings/SettingsContext';
import { useWeather } from '@/contexts/weather/WeatherContext';
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
  const [refreshKey, setRefreshKey] = useState(0); // triggers data recompute
  const [viewInstance, setViewInstance] = useState(0); // forces view remount for timeline/week/month
  const [isRefreshing, setIsRefreshing] = useState(false); // subtle loading indicator
  const initialMountRef = useRef(true);
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
    // Ignore very first mount event (if any) to avoid showing spinner immediately
    if (!initialMountRef.current) {
      setIsRefreshing(true);
    }
    // Attempt local events refresh (includes iCal) when a sync completes
    forceRefresh?.();
    // Increment both keys: refreshKey for data hooks, viewInstance to remount view components
    setRefreshKey(prev => prev + 1);
    setViewInstance(v => v + 1);
  });

  // Clear refreshing state after data settles or after a short timeout fallback
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (isRefreshing) {
      const timeout = setTimeout(() => setIsRefreshing(false), 800); // auto-hide after <1s
      return () => clearTimeout(timeout);
    }
  }, [filteredEvents, isRefreshing]);

  // (debug removed) previously logged filteredEvents and eventStats

  return (
    <div className="space-y-6 relative" key={`calendar-${refreshKey}`}> 
      {isRefreshing && (
        <div className="absolute inset-x-0 top-0 px-2 pt-1 pb-2 pointer-events-none animate-fade-in" aria-label="Updating calendars">
          {/* Common thin progress bar */}
          <div className="h-1.5 mb-2 skeleton-base skeleton-shimmer" />
          {view === 'timeline' && (
            <div className="space-y-2">
              <div className="h-3 w-2/5 skeleton-base skeleton-shimmer" />
              <div className="h-4 w-3/4 skeleton-base skeleton-shimmer" />
              <div className="h-3 w-1/2 skeleton-base skeleton-shimmer" />
              <div className="h-3 w-2/3 skeleton-base skeleton-shimmer" />
            </div>
          )}
          {view === 'week' && (
            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-6 skeleton-base skeleton-shimmer" />
              ))}
              <div className="col-span-7 mt-2 h-3 w-1/3 skeleton-base skeleton-shimmer" />
            </div>
          )}
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-1 mt-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="aspect-square skeleton-base skeleton-shimmer" />
              ))}
              <div className="col-span-7 mt-2 h-3 w-24 skeleton-base skeleton-shimmer" />
            </div>
          )}
        </div>
      )}
      <CalendarHeader
        hasGoogleEvents={true} // Always pass true to show the header
        view={view}
        onViewChange={setView}
      />

      <CalendarContent
    key={`view-${view}-${viewInstance}`}
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
