
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

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
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-white/20 dark:border-gray-600/20 text-gray-900 dark:text-gray-100 min-w-[200px]"
        disabled
      >
        {totalCount === 0 ? 'No calendars available' : 'Loading calendars...'}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-white/20 dark:border-gray-600/20 text-gray-900 dark:text-gray-100 hover:bg-white/100 dark:hover:bg-gray-800/100 justify-between min-w-[200px]"
    >
      <span>Calendars ({selectedCount}/{totalCount})</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  );
};

export default CalendarSelectorButton;
