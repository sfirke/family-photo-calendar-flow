
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  totalCalendars: number;
  calendarsWithEventsCount: number;
  onSelectAll: () => void;
  onSelectWithEvents: () => void;
  onClearAll: () => void;
}

const QuickActions = ({ 
  totalCalendars, 
  calendarsWithEventsCount, 
  onSelectAll, 
  onSelectWithEvents, 
  onClearAll 
}: QuickActionsProps) => {
  return (
    <div className="flex gap-2 pt-2 border-t border-gray-200">
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        className="text-xs flex-1"
      >
        All ({totalCalendars})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectWithEvents}
        className="text-xs flex-1"
        disabled={calendarsWithEventsCount === 0}
      >
        With Events ({calendarsWithEventsCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearAll}
        className="text-xs flex-1"
      >
        None
      </Button>
    </div>
  );
};

export default QuickActions;
