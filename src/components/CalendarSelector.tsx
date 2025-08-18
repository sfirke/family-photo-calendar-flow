
import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useCalendarSelection } from '@/hooks/useCalendarSelection';
import CalendarSelectorButton from './calendar/CalendarSelectorButton';
import CalendarSelectorContent from './calendar/CalendarSelectorContent';

const CalendarSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    calendarsFromEvents, 
    selectedCalendarIds,
    isLoading, 
    toggleCalendar, 
    selectAllCalendars, 
    selectCalendarsWithEvents, 
    clearAllCalendars
  } = useCalendarSelection();

  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    toggleCalendar(calendarId, checked);
  };

  const handleSelectAll = () => {
    selectAllCalendars();
  };

  const handleSelectWithEvents = () => {
    selectCalendarsWithEvents();
  };

  const handleClearAll = () => {
    clearAllCalendars();
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  // Add debugging logs
  // debug logs removed

  if (isLoading) {
    return (
      <CalendarSelectorButton
        selectedCount={0}
        totalCount={0}
        disabled={true}
        onClick={handleButtonClick}
      />
    );
  }

  // debug logs removed

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <CalendarSelectorButton
          selectedCount={selectedCalendarIds.length}
          totalCount={calendarsFromEvents.length}
          disabled={false}
          onClick={handleButtonClick}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg" 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          // no-op (removed debug)
        }}
      >
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
