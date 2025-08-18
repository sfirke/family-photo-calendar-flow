import { describe, it, expect } from 'vitest';
import * as ICAL from 'ical.js';
import { generateOccurrenceId, hasOccurrenceChanged } from '@/utils/icalEventUtils';
import type { ICalCalendar, ICalEventOccurrence } from '@/hooks/useICalCalendars';
import { expandRecurringEvent, generateMultiDayOccurrences } from '@/utils/icalExpansionTestable';

const makeCalendar = () => ({ id: 'cal1', name: 'Cal', url: '', color: '#123456', enabled: true } as const);

function buildEvent(ical: string) {
  const jcal = ICAL.parse(ical);
  const comp = new ICAL.Component(jcal);
  return new ICAL.Event(comp.getFirstSubcomponent('vevent'));
}

describe('iCal occurrence utilities', () => {
  it('generates stable IDs for identical inputs', () => {
    const cal = makeCalendar();
    const ev1 = buildEvent(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:abc123\nDTSTART;VALUE=DATE:20250110\nDTEND;VALUE=DATE:20250111\nSUMMARY:Test\nEND:VEVENT\nEND:VCALENDAR`);
    const ev2 = buildEvent(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:abc123\nDTSTART;VALUE=DATE:20250110\nDTEND;VALUE=DATE:20250111\nSUMMARY:Test\nEND:VEVENT\nEND:VCALENDAR`);
  const id1 = generateOccurrenceId(ev1, cal, new Date('2025-01-10'), false);
  const id2 = generateOccurrenceId(ev2, cal, new Date('2025-01-10'), false);
    expect(id1).toBe(id2);
  });

  it('expands multi-day all-day event across days', () => {
    const cal = makeCalendar();
    const ev = buildEvent(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:multi1\nDTSTART;VALUE=DATE:20250201\nDTEND;VALUE=DATE:20250204\nSUMMARY:Trip\nEND:VEVENT\nEND:VCALENDAR`);
    const occ = generateMultiDayOccurrences(ev, cal, 2025);
    expect(occ.length).toBe(3); // 1st,2nd,3rd (DTEND is exclusive)
    expect(new Set(occ.map(o => o.id)).size).toBe(3);
  });

  it('expands simple yearly recurring event within year bounds', () => {
    const cal = makeCalendar();
    const ev = buildEvent(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:rec1\nDTSTART;VALUE=DATE:20250105\nRRULE:FREQ=MONTHLY;BYMONTHDAY=5\nSUMMARY:Monthly\nEND:VEVENT\nEND:VCALENDAR`);
    const occ = expandRecurringEvent(ev, cal, 2025);
    // Should not exceed 12 or max limiter 366
    expect(occ.length).toBeGreaterThan(5);
    expect(occ.length).toBeLessThanOrEqual(12);
  });

  it('detects occurrence changes via hasOccurrenceChanged', () => {
    const sample: ICalEventOccurrence = {
      id: 'x',
      title: 'T',
      time: 'All day',
      location: 'Loc',
      attendees: 0,
      category: 'Personal',
      color: '#000',
      description: 'Desc',
      organizer: 'Org',
      date: new Date('2025-01-01'),
      calendarId: 'cal1',
      calendarName: 'Cal',
      source: 'ical',
      isMultiDay: false
    };
    const changed: ICalEventOccurrence = { ...sample, description: 'New Desc' };
    expect(hasOccurrenceChanged(sample, changed)).toBe(true);
    expect(hasOccurrenceChanged(sample, { ...sample })).toBe(false);
  });
});
