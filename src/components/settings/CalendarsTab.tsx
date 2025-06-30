
import React from 'react';
import LocalDataManager from '@/components/LocalDataManager';
import CalendarFeedsSettings from './CalendarFeedsSettings';

const CalendarsTab = () => {
  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full p-1 -m-1 rounded-lg">
      <LocalDataManager />
      <CalendarFeedsSettings />
    </div>
  );
};

export default CalendarsTab;
