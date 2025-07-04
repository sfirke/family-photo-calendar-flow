
import { Event } from '@/types/calendar';
import { NotionEvent } from '@/types/notion';
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
  notionEvents?: NotionEvent[];
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  getWeatherForDate: (date: Date) => WeatherInfo;
  onNotionEventClick?: (event: Event) => void;
}

const CalendarContent = ({ 
  view, 
  events, 
  notionEvents = [],
  weekOffset, 
  onPreviousWeek, 
  onNextWeek, 
  getWeatherForDate,
  onNotionEventClick
}: CalendarContentProps) => {
  // Convert NotionEvents to Events and merge with regular events
  const convertedNotionEvents: Event[] = notionEvents.map(notionEvent => ({
    id: notionEvent.id,
    title: notionEvent.title,
    time: notionEvent.time,
    location: notionEvent.location || '',
    attendees: 0,
    category: 'Personal',
    color: notionEvent.color,
    description: notionEvent.description || '',
    organizer: 'Notion',
    date: notionEvent.date,
    calendarId: notionEvent.calendarId,
    calendarName: notionEvent.calendarName,
    source: 'notion'
  }));

  // Merge all events
  const allEvents = [...events, ...convertedNotionEvents];

  if (view === 'timeline') {
    return <TimelineView events={allEvents} getWeatherForDate={getWeatherForDate} onNotionEventClick={onNotionEventClick} />;
  }

  if (view === 'week') {
    return (
      <WeekView 
        events={allEvents}
        weekOffset={weekOffset}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        getWeatherForDate={getWeatherForDate}
        onNotionEventClick={onNotionEventClick}
      />
    );
  }

  if (view === 'month') {
    return (
      <MonthView 
        events={allEvents}
        getWeatherForDate={getWeatherForDate}
        onNotionEventClick={onNotionEventClick}
      />
    );
  }

  return null;
};

export default CalendarContent;
