
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CalendarSelectorButtonProps {
  selectedCount: number;
  totalCount: number;
  disabled?: boolean;
  onClick?: () => void;
}

const CalendarSelectorButton = React.forwardRef<HTMLButtonElement, CalendarSelectorButtonProps>(
  ({ selectedCount, totalCount, disabled = false, onClick }, ref) => {
    
    const handleClick = (e?: unknown) => {
      try {
        // We intentionally ignore the event object; just call the consumer callback
        onClick?.();
      } catch (err) {
        // Soft-fail instead of throwing to avoid UI breakage
        console.warn('CalendarSelectorButton onClick handler error:', err);
      }
    };
    
    if (disabled) {
      return (
        <Button
          ref={ref}
          variant="outline"
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-w-[200px] cursor-not-allowed opacity-50"
          disabled
          onClick={handleClick}
        >
          {totalCount === 0 ? 'No calendars available' : 'Loading calendars...'}
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant="outline"
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 justify-between min-w-[200px] cursor-pointer"
        onClick={handleClick}
        type="button"
      >
        <span>Calendars ({selectedCount}/{totalCount})</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }
);

CalendarSelectorButton.displayName = 'CalendarSelectorButton';

export default CalendarSelectorButton;
