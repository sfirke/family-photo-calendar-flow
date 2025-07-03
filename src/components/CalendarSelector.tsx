
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
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

  if (isLoading) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  if (calendarsFromEvents.length === 0) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <CalendarSelectorButton
          selectedCount={selectedCalendarIds.length}
          totalCount={calendarsFromEvents.length}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <CalendarSelectorContent
          calendarsFromEvents={calendarsFromEvents}
          selectedCalendarIds={selectedCalendarIds}
          onCalendarToggle={handleCalendarToggle}
          onSelectAll={handleSelectAll}
          onSelectWithEvents={handleSelectWithEvents}
          onClearAll={handleClearAll}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelector;
