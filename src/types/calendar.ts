
export interface Event {
  id: number;
  title: string;
  time: string;
  location?: string;
  attendees: number;
  category: 'Personal' | 'Work' | 'Family' | 'Kids' | 'Holidays';
  color: string;
  description: string;
  organizer: string;
  date: Date;
  calendarId?: string;
  calendarName?: string;
}

export type ViewMode = 'month' | 'timeline' | 'week';

export interface FilterState {
  Personal: boolean;
  Work: boolean;
  Family: boolean;
  Kids: boolean;
  Holidays: boolean;
}
