// Utility helpers for iCal event occurrence handling
// Extracted from useICalCalendars to enable unit testing and reuse

import type * as ICAL from 'ical.js';
import type { ICalCalendar, ICalEventOccurrence } from '@/hooks/useICalCalendars';

// Deterministic hash-based ID generator (mirrors hook logic)
export function generateOccurrenceId(
  event: Pick<ICAL.Event, 'uid' | 'summary'>,
  calendar: Pick<ICalCalendar, 'id'>,
  eventDate: Date,
  isMultiDay: boolean
): string {
  const base = `${calendar.id}|${event.uid || event.summary || 'event'}|${eventDate.toISOString().split('T')[0]}|${isMultiDay ? 'MD' : 'SD'}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return `ical_${Math.abs(hash).toString(36)}`;
}

// Comparison helper to decide if event data changed materially
export function hasOccurrenceChanged(oldEvt: ICalEventOccurrence, newEvt: ICalEventOccurrence): boolean {
  return (
    oldEvt.description !== newEvt.description ||
    oldEvt.location !== newEvt.location ||
    oldEvt.time !== newEvt.time ||
    oldEvt.organizer !== newEvt.organizer
  );
}
