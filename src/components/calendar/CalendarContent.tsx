
import { Event } from '@/types/calendar';
import TimelineView from '../TimelineView';
import WeekView from '../WeekView';
import MonthView from '../MonthView';

interface WeatherInfo {
  temp: number;
  condition: string;
}

interface CalendarContentProps {
  view: 'timeline' | 'week' | 'month';
  events: Event[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  getWeatherForDate: (date: Date) => WeatherInfo;
}

const CalendarContent = ({ 
  view, 
  events, 
  weekOffset, 
  onPreviousWeek, 
  onNextWeek, 
  getWeatherForDate 
}: CalendarContentProps) => {
  if (view === 'timeline') {
    return <TimelineView events={events} getWeatherForDate={getWeatherForDate} />;
  }

  if (view === 'week') {
    return (
      <WeekView 
        events={events}
        weekOffset={weekOffset}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        getWeatherForDate={getWeatherForDate}
      />
    );
  }

  if (view === 'month') {
    return (
      <MonthView 
        events={events}
        getWeatherForDate={getWeatherForDate}
      />
    );
  }

  return null;
};

export default CalendarContent;
