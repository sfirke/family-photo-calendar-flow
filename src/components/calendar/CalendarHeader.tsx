
import React from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import CalendarSelector from '../CalendarSelector';
import ViewSwitcher from './ViewSwitcher';
import { ViewMode } from '@/types/calendar';

interface CalendarHeaderProps {
  hasGoogleEvents: boolean;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const CalendarHeader = ({ hasGoogleEvents, view, onViewChange }: CalendarHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-white/20 dark:border-gray-600/20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calendar</h2>
        </div>
        
        {hasGoogleEvents && (
          <CalendarSelector />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <ViewSwitcher view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
};

export default CalendarHeader;
