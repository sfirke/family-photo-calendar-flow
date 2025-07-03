
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CalendarSelectorButtonProps {
  selectedCount: number;
  totalCount: number;
  disabled?: boolean;
}

const CalendarSelectorButton = React.forwardRef<HTMLButtonElement, CalendarSelectorButtonProps>(
  ({ selectedCount, totalCount, disabled = false }, ref) => {
    if (disabled) {
      return (
        <Button
          ref={ref}
          variant="outline"
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-white/20 dark:border-gray-600/20 text-gray-900 dark:text-gray-100 min-w-[200px]"
          disabled
        >
          {totalCount === 0 ? 'No calendars available' : 'Loading calendars...'}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant="outline"
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-white/20 dark:border-gray-600/20 text-gray-900 dark:text-gray-100 hover:bg-white/100 dark:hover:bg-gray-800/100 justify-between min-w-[200px]"
      >
        <span>Calendars ({selectedCount}/{totalCount})</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }
);

CalendarSelectorButton.displayName = 'CalendarSelectorButton';

export default CalendarSelectorButton;
