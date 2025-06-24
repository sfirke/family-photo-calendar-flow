
import React from 'react';

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
  // This component is now empty as the header controls have been moved to the main header
  return null;
};

export default CalendarHeader;
