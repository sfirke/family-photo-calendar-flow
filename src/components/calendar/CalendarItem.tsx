
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface CalendarItemProps {
  id: string;
  summary: string;
  primary?: boolean;
  eventCount: number;
  hasEvents: boolean;
  isSelected: boolean;
  onToggle: (calendarId: string, checked: boolean) => void;
}

const CalendarItem = ({ 
  id, 
  summary, 
  primary, 
  eventCount, 
  hasEvents, 
  isSelected, 
  onToggle 
}: CalendarItemProps) => {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${
      hasEvents ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
    }`}>
      <Checkbox
        id={id}
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(id, checked === true)}
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-900 cursor-pointer block truncate"
        >
          {summary}
          {primary && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Primary
            </span>
          )}
        </label>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${hasEvents ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
          {hasEvents && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarItem;
