
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';

interface FilterState {
  Personal: boolean;
  Work: boolean;
  Family: boolean;
  Kids: boolean;
  Holidays: boolean;
}

interface CalendarFiltersProps {
  activeFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const calendarTypes = [
  { name: 'Personal', color: 'bg-purple-500' },
  { name: 'Work', color: 'bg-blue-500' },
  { name: 'Family', color: 'bg-green-500' },
  { name: 'Kids', color: 'bg-orange-500' },
  { name: 'Holidays', color: 'bg-red-500' }
] as const;

const CalendarFilters = ({ activeFilters, onFiltersChange }: CalendarFiltersProps) => {
  const handleFilterChange = (filterName: keyof FilterState, checked: boolean) => {
    onFiltersChange({
      ...activeFilters,
      [filterName]: checked
    });
  };

  const showAll = () => {
    onFiltersChange({
      Personal: true,
      Work: true,
      Family: true,
      Kids: true,
      Holidays: true
    });
  };

  const hideAll = () => {
    onFiltersChange({
      Personal: false,
      Work: false,
      Family: false,
      Kids: false,
      Holidays: false
    });
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100 justify-between min-w-[200px]"
        >
          <span>Calendars ({activeCount})</span>
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
          <h3 className="font-medium text-gray-900">Toggle Calendars</h3>
          
          <div className="space-y-3">
            {calendarTypes.map((type) => (
              <div key={type.name} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <Checkbox
                  id={type.name}
                  checked={activeFilters[type.name]}
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
            >
              Hide All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarFilters;
