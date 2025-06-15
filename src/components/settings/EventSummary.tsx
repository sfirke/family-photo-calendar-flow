
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface EventSummaryProps {
  totalEvents: number;
  calendarsWithEventsCount: number;
  selectedCalendarsCount: number;
}

const EventSummary = ({ totalEvents, calendarsWithEventsCount, selectedCalendarsCount }: EventSummaryProps) => {
  if (totalEvents === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-900">Event Summary</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-medium text-blue-900">{totalEvents}</div>
          <div className="text-blue-700">Total Events</div>
        </div>
        <div>
          <div className="font-medium text-blue-900">{calendarsWithEventsCount}</div>
          <div className="text-blue-700">Active Calendars</div>
        </div>
        <div>
          <div className="font-medium text-blue-900">{selectedCalendarsCount}</div>
          <div className="text-blue-700">Selected</div>
        </div>
      </div>
    </div>
  );
};

export default EventSummary;
