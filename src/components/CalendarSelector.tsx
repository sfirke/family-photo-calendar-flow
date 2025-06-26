
import React from 'react';
import { Popover } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

interface CalendarSelectorProps {
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
}

const CalendarSelector = ({ selectedCalendarIds, onCalendarChange }: CalendarSelectorProps) => {
  const { 
    calendarsFromEvents, 
    isLoading, 
    toggleCalendar, 
    selectAllCalendars, 
    selectCalendarsWithEvents, 
    clearAllCalendars,
    updateSelectedCalendars
  } = useCalendarSelection();
  const { user } = useLocalAuth();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    toggleCalendar(calendarId, checked);
    // Sync with parent component
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedCalendarIds.filter(id => id !== calendarId), calendarId];
    } else {
      newSelection = selectedCalendarIds.filter(id => id !== calendarId);
    }
    onCalendarChange(newSelection);
  };

  const handleSelectAll = () => {
    selectAllCalendars();
    const allIds = calendarsFromEvents.map(cal => cal.id);
    onCalendarChange(allIds);
  };

  const handleSelectWithEvents = () => {
    selectCalendarsWithEvents();
    const withEventsIds = calendarsFromEvents.filter(cal => cal.hasEvents).map(cal => cal.id);
    onCalendarChange(withEventsIds);
  };

  const handleClearAll = () => {
    clearAllCalendars();
    onCalendarChange([]);
  };

  // Sync selected calendars with the hook's state
  React.useEffect(() => {
    const hookSelectedIds = calendarsFromEvents
      .filter(cal => selectedCalendarIds.includes(cal.id))
      .map(cal => cal.id);
    
    if (JSON.stringify(hookSelectedIds.sort()) !== JSON.stringify(selectedCalendarIds.sort())) {
      updateSelectedCalendars(hookSelectedIds);
    }
  }, [calendarsFromEvents, selectedCalendarIds, updateSelectedCalendars]);

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

  if (calendarsFromEvents.length === 0) {
    console.log('CalendarSelector: No calendars available');
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  console.log('CalendarSelector: Rendering selector with calendars:', calendarsFromEvents.map(cal => ({ 
    id: cal.id, 
    name: cal.summary, 
    eventCount: cal.eventCount,
    hasEvents: cal.hasEvents 
  })));

  return (
    <Popover>
      <CalendarSelectorButton
        selectedCount={selectedCalendarIds.length}
        totalCount={calendarsFromEvents.length}
      />
      <CalendarSelectorContent
        calendarsFromEvents={calendarsFromEvents}
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
