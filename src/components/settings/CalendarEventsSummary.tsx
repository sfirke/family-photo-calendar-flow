
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface CalendarEventsSummaryProps {
  totalEvents: number;
  calendarsWithEventsCount: number;
  selectedCalendarIds: string[];
}

const CalendarEventsSummary = ({ 
  totalEvents, 
  calendarsWithEventsCount, 
  selectedCalendarIds 
}: CalendarEventsSummaryProps) => {
  if (totalEvents === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-blue-900 dark:text-blue-200">Event Summary</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium text-blue-900 dark:text-blue-200">{totalEvents}</div>
          <div className="text-blue-700 dark:text-blue-300">Total Events</div>
        </div>
        <div>
          <div className="font-medium text-blue-900 dark:text-blue-200">{calendarsWithEventsCount}</div>
          <div className="text-blue-700 dark:text-blue-300">Active Calendars</div>
        </div>
        <div>
          <div className="font-medium text-blue-900 dark:text-blue-200">{selectedCalendarIds.length}</div>
          <div className="text-blue-700 dark:text-blue-300">Selected</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventsSummary;
