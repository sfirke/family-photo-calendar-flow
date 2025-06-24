
import React from 'react';
import CalendarSelector from '../CalendarSelector';
import ViewSwitcher from './ViewSwitcher';

interface CalendarHeaderProps {
  hasGoogleEvents: boolean;
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
  view: 'timeline' | 'week' | 'month';
  onViewChange: (view: 'timeline' | 'week' | 'month') => void;
}

const CalendarHeader = ({
  hasGoogleEvents,
  selectedCalendarIds,
  onCalendarChange,
  view,
  onViewChange
}: CalendarHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* New row for calendar controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-4">
          {hasGoogleEvents && <CalendarSelector selectedCalendarIds={selectedCalendarIds} onCalendarChange={onCalendarChange} />}
          
          <ViewSwitcher view={view} onViewChange={onViewChange} />
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
