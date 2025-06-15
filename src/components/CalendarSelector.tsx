
import React from 'react';
import { Popover } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useAuth } from '@/hooks/useAuth';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

interface CalendarSelectorProps {
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
}

const CalendarSelector = ({ selectedCalendarIds, onCalendarChange }: CalendarSelectorProps) => {
  const { calendarsWithEvents, isLoading, toggleCalendar, selectAllCalendars, selectCalendarsWithEvents, clearAllCalendars } = useCalendarSelection();
  const { user } = useAuth();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    toggleCalendar(calendarId, checked);
    // Also update parent component
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedCalendarIds, calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    onCalendarChange(newSelection);
  };

  const handleSelectAll = () => {
    selectAllCalendars();
    onCalendarChange(calendarsWithEvents.map(cal => cal.id));
  };

  const handleSelectWithEvents = () => {
    selectCalendarsWithEvents();
    const withEventsIds = calendarsWithEvents.filter(cal => cal.hasEvents).map(cal => cal.id);
    onCalendarChange(withEventsIds);
  };

  const handleClearAll = () => {
    clearAllCalendars();
    onCalendarChange([]);
  };

  if (!user) {
    console.log('CalendarSelector: No user authenticated');
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  if (isLoading) {
    console.log('CalendarSelector: Loading calendars...');
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  if (calendarsWithEvents.length === 0) {
    console.log('CalendarSelector: No calendars available');
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  console.log('CalendarSelector: Rendering selector with calendars:', calendarsWithEvents.map(cal => ({ 
    id: cal.id, 
    name: cal.summary, 
    eventCount: cal.eventCount,
    hasEvents: cal.hasEvents 
  })));

  return (
    <Popover>
      <CalendarSelectorButton
        selectedCount={selectedCalendarIds.length}
        totalCount={calendarsWithEvents.length}
      />
      <CalendarSelectorContent
        calendarsWithEvents={calendarsWithEvents}
        selectedCalendarIds={selectedCalendarIds}
        onCalendarToggle={handleCalendarToggle}
        onSelectAll={handleSelectAll}
        onSelectWithEvents={handleSelectWithEvents}
        onClearAll={handleClearAll}
      />
    </Popover>
  );
};

export default CalendarSelector;
