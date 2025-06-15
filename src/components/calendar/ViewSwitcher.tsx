
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, List } from 'lucide-react';

interface ViewSwitcherProps {
  view: 'timeline' | 'week' | 'month';
  onViewChange: (view: 'timeline' | 'week' | 'month') => void;
}

const ViewSwitcher = ({ view, onViewChange }: ViewSwitcherProps) => {
  return (
    <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1">
      <Button
        variant={view === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('timeline')}
        className={view === 'timeline' ? '' : 'text-white hover:bg-white/20'}
      >
        <List className="h-4 w-4 mr-1" />
        Timeline
      </Button>
      <Button
        variant={view === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('week')}
        className={view === 'week' ? '' : 'text-white hover:bg-white/20'}
      >
        <Clock className="h-4 w-4 mr-1" />
        Week
      </Button>
      <Button
        variant={view === 'month' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('month')}
        className={view === 'month' ? '' : 'text-white hover:bg-white/20'}
      >
        <CalendarIcon className="h-4 w-4 mr-1" />
        Month
      </Button>
    </div>
  );
};

export default ViewSwitcher;
