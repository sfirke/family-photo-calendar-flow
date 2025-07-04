
import React from 'react';
import LocalDataManager from '@/components/LocalDataManager';
import ICalSettings from './ICalSettings';
import NotionIntegration from './NotionIntegration';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';

const CalendarsTab = () => {
  const { selectedCalendarIds, toggleCalendar } = useCalendarSelection();

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full p-1 -m-1 rounded-lg">
      <LocalDataManager />
      <ICalSettings 
        selectedCalendarIds={selectedCalendarIds}
        onToggleSelection={toggleCalendar}
      />
      <NotionIntegration 
        selectedCalendarIds={selectedCalendarIds}
        onToggleSelection={toggleCalendar}
      />
    </div>
  );
};

export default CalendarsTab;
