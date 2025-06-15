
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import CalendarSelector from './CalendarSelector';

interface CalendarFiltersProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
  showGoogleCalendars: boolean;
}

const calendarTypes = [
  { name: 'Personal', color: 'bg-purple-500' },
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Family', color: 'bg-green-500' },
  { name: 'Kids', color: 'bg-orange-500' },
  { name: 'Holidays', color: 'bg-red-500' }
] as const;

const CalendarFilters = ({ 
  selectedCategories, 
  onCategoryChange,
  selectedCalendarIds,
  onCalendarChange,
  showGoogleCalendars
}: CalendarFiltersProps) => {
  const handleFilterChange = (categoryName: string, checked: boolean) => {
    if (checked) {
      onCategoryChange([...selectedCategories, categoryName]);
    } else {
      onCategoryChange(selectedCategories.filter(cat => cat !== categoryName));
    }
  };

  const showAll = () => {
    onCategoryChange(['Personal', 'Work', 'Family', 'Kids', 'Holidays']);
  };

  const hideAll = () => {
    onCategoryChange([]);
  };

  const activeCount = selectedCategories.length;

  return (
    <div className="flex items-center gap-4">
      {showGoogleCalendars && (
        <CalendarSelector 
          selectedCalendarIds={selectedCalendarIds}
          onCalendarChange={onCalendarChange}
        />
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100 justify-between min-w-[200px]"
          >
            <span>Categories ({activeCount})</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 bg-white/95 backdrop-blur-sm border-white/20 z-50" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Toggle Categories</h3>
            
            <div className="space-y-3">
              {calendarTypes.map((type) => (
                <div key={type.name} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  <Checkbox
                    id={type.name}
                    checked={selectedCategories.includes(type.name)}
                    onCheckedChange={(checked) => handleFilterChange(type.name, !!checked)}
                  />
                  <label
                    htmlFor={type.name}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {type.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={showAll}
                className="text-xs flex-1"
              >
                Show All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={hideAll}
                className="text-xs flex-1"
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CalendarFilters;
