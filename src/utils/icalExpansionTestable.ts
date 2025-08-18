import * as ICAL from 'ical.js';
import { ICalCalendar, ICalEventOccurrence } from '@/hooks/useICalCalendars';
import { generateOccurrenceId } from './icalEventUtils';

// Determine if event spans multiple all-day days
export function isMultiDayEvent(event: ICAL.Event): boolean {
  try {
    if (!event.startDate || !event.endDate) return false;
    if (event.startDate.isDate && event.endDate.isDate) {
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      return diffDays > 1;
    }
    return false;
  } catch {
    return false;
  }
}

const isEventInYear = (d: Date, year: number) => d.getFullYear() === year;

function createOccurrence(event: ICAL.Event, calendar: ICalCalendar, eventDate: Date, isRecurring: boolean, isMultiDay: boolean): ICalEventOccurrence {
  let timeString = 'All day';
  try {
    if (event.startDate && !event.startDate.isDate) {
      const endDate = event.endDate ? event.endDate.toJSDate() : eventDate;
      timeString = `${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isMultiDay) {
      timeString = 'All day (Multi-day)';
    }
  } catch {/* intentionally ignore formatting errors */}
  if (isRecurring && !timeString.includes('Recurring')) timeString = `${timeString} (Recurring)`;
  return {
    id: generateOccurrenceId(event, calendar, eventDate, isMultiDay),
    title: (event.summary as string) || 'Untitled Event',
    time: timeString,
    location: (event.location as string) || '',
    attendees: 0,
    category: 'Personal',
    color: calendar.color,
    description: (event.description as string) || '',
    organizer: calendar.name,
    date: eventDate,
    calendarId: calendar.id,
    calendarName: calendar.name,
    source: 'ical',
    isMultiDay
  };
}

export function generateMultiDayOccurrences(event: ICAL.Event, calendar: ICalCalendar, year: number): ICalEventOccurrence[] {
  const occurrences: ICalEventOccurrence[] = [];
  try {
    if (!isMultiDayEvent(event)) {
      const d = event.startDate.toJSDate();
      if (isEventInYear(d, year)) occurrences.push(createOccurrence(event, calendar, d, false, false));
      return occurrences;
    }
    const start = event.startDate.toJSDate();
    const end = event.endDate.toJSDate();
    const current = new Date(start);
    while (current < end && isEventInYear(current, year)) {
      occurrences.push(createOccurrence(event, calendar, new Date(current), false, true));
      current.setDate(current.getDate() + 1);
    }
  } catch {
    const fallback = event.startDate ? event.startDate.toJSDate() : new Date();
    if (isEventInYear(fallback, year)) occurrences.push(createOccurrence(event, calendar, fallback, false, false));
  }
  return occurrences;
}

export function expandRecurringEvent(event: ICAL.Event, calendar: ICalCalendar, year: number): ICalEventOccurrence[] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const occurrences: ICalEventOccurrence[] = [];
  try {
    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next; let count = 0; const max = 366;
      while ((next = iterator.next()) && count < max) {
        const od = next.toJSDate();
        if (od >= yearStart && od <= yearEnd) {
          if (isMultiDayEvent(event)) {
            occurrences.push(...generateMultiDayOccurrences(event, calendar, year));
          } else {
            occurrences.push(createOccurrence(event, calendar, od, true, false));
          }
        }
        if (od > yearEnd) break;
        count++;
      }
    } else {
      occurrences.push(...generateMultiDayOccurrences(event, calendar, year));
    }
  } catch {
    const fallback = event.startDate ? event.startDate.toJSDate() : new Date();
    if (isEventInYear(fallback, year)) occurrences.push(createOccurrence(event, calendar, fallback, false, false));
  }
  return occurrences;
}
