
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { PopoverTrigger } from '@/components/ui/popover';

interface CalendarSelectorButtonProps {
  selectedCount: number;
  totalCount: number;
  disabled?: boolean;
}

const CalendarSelectorButton = ({ selectedCount, totalCount, disabled = false }: CalendarSelectorButtonProps) => {
  if (disabled) {
    return (
      <Button
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 min-w-[200px]"
        disabled
      >
        {totalCount === 0 ? 'No calendars available' : 'Loading calendars...'}
      </Button>
    );
  }

  return (
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100 justify-between min-w-[200px]"
      >
        <span>Calendars ({selectedCount}/{totalCount})</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
  );
};

export default CalendarSelectorButton;
