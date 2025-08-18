import { createContext } from 'react';
import type { ICalCalendar } from './useICalCalendars';
import type { NotionScrapedCalendar, NotionScrapedEvent } from '@/types/notion';

// Union type representing all calendar kinds the selection system can handle.
export type CombinedCalendar = ICalCalendar | NotionScrapedCalendar;

export interface CalendarFromEvents {
  id: string;
  summary: string;
  color: string;
  primary: boolean;
  hasEvents: boolean;
  eventCount: number;
  lastSync?: string;
  source?: 'ical' | 'notion' | 'notion-scraped' | 'local';
}

export interface CalendarSelectionValue {
  allCalendars: CombinedCalendar[];
  enabledCalendars: CombinedCalendar[];
  selectedCalendarIds: string[];
  notionEvents: NotionScrapedEvent[]; // Reserved for future Notion API events
  scrapedEvents: NotionScrapedEvent[];
  calendarsFromEvents: CalendarFromEvents[];
  isLoading: boolean;
  toggleCalendar: (calendarId: string, checked?: boolean) => void;
  selectAllCalendars: () => void;
  deselectAllCalendars: () => void;
  setSelectedCalendarIds: React.Dispatch<React.SetStateAction<string[]>>;
  clearAllCalendars: () => void;
  selectCalendarsWithEvents: () => void;
  updateSelectedCalendars: (ids: string[]) => void;
  cleanupDeletedCalendar: (id: string) => void;
  forceRefresh: () => void;
}

export const CalendarSelectionContext = createContext<CalendarSelectionValue | null>(null);
