
import React, { useState } from 'react';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import GoogleCalendarSync from './GoogleCalendarSync';
import EventSummary from './EventSummary';
import CalendarList from './CalendarList';

const CalendarsTab = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { selectedCalendarIds, calendarsFromEvents } = useCalendarSelection();

  const totalEvents = calendarsFromEvents.reduce((sum, cal) => sum + cal.eventCount, 0);
  const calendarsWithEventsCount = calendarsFromEvents.filter(cal => cal.hasEvents).length;

  console.log('CalendarsTab: Rendering with calendars:', calendarsFromEvents.length);
  console.log('CalendarsTab: Selected calendars:', selectedCalendarIds.length);
  console.log('CalendarsTab: Total events across all calendars:', totalEvents);

  return (
    <div className="space-y-6">
      <GoogleCalendarSync 
        lastSync={lastSync}
        onLastSyncUpdate={setLastSync}
      />
      
      <EventSummary 
        totalEvents={totalEvents}
        calendarsWithEventsCount={calendarsWithEventsCount}
        selectedCalendarsCount={selectedCalendarIds.length}
      />
      
      <CalendarList />
    </div>
  );
};

export default CalendarsTab;
