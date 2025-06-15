
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoogleCalendars } from '@/hooks/useGoogleCalendars';
import { useAuth } from '@/hooks/useAuth';

interface CalendarSelectorProps {
  selectedCalendarId?: string;
  onCalendarChange: (calendarId: string) => void;
}

const CalendarSelector = ({ selectedCalendarId, onCalendarChange }: CalendarSelectorProps) => {
  const { calendars, isLoading } = useGoogleCalendars();
  const { user } = useAuth();

  if (!user) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px] bg-white/95 backdrop-blur-sm border-white/20 text-gray-900">
          <SelectValue placeholder="Sign in to view calendars" />
        </SelectTrigger>
      </Select>
    );
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px] bg-white/95 backdrop-blur-sm border-white/20 text-gray-900">
          <SelectValue placeholder="Loading calendars..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (calendars.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px] bg-white/95 backdrop-blur-sm border-white/20 text-gray-900">
          <SelectValue placeholder="Empty" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedCalendarId} onValueChange={onCalendarChange}>
      <SelectTrigger className="w-[200px] bg-white/95 backdrop-blur-sm border-white/20 text-gray-900 hover:bg-white/100">
        <SelectValue placeholder="Select calendar" />
      </SelectTrigger>
      <SelectContent className="bg-white/95 backdrop-blur-sm border-white/20 z-50">
        {calendars.map((calendar) => (
          <SelectItem key={calendar.id} value={calendar.id}>
            {calendar.summary} {calendar.primary && '(Primary)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CalendarSelector;
