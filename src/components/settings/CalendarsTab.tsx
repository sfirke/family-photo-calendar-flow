
import React from 'react';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import EventSummary from './EventSummary';
import CalendarList from './CalendarList';
import LocalDataManager from '@/components/LocalDataManager';
import ICalSettings from './ICalSettings';

const CalendarsTab = () => {
  const { selectedCalendarIds, calendarsFromEvents } = useCalendarSelection();

  const totalEvents = calendarsFromEvents.reduce((sum, cal) => sum + cal.eventCount, 0);
  const calendarsWithEventsCount = calendarsFromEvents.filter(cal => cal.hasEvents).length;

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full p-1 -m-1 rounded-lg">
      <LocalDataManager />
      
      <ICalSettings />
      
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
