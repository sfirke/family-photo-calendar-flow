
import ICAL from 'ical.js';
import { ICalCalendar } from '@/types/ical';

const ICAL_EVENTS_KEY = 'family_calendar_ical_events';

export class ICalEventService {
  static isValidICalData(data: string): boolean {
    if (!data || typeof data !== 'string') {
      return false;
    }

    const errorIndicators = [
      'offline', 'error', 'not found', '404', '500', '503',
      'access denied', 'forbidden', 'unauthorized', 'timeout',
      'maintenance', 'unavailable'
    ];
    
    const lowerData = data.toLowerCase().trim();
    
    if (data.length < 50 && errorIndicators.some(indicator => lowerData.includes(indicator))) {
      console.log('Data appears to be an error message:', data.substring(0, 100));
      return false;
    }

    const hasVCalendar = lowerData.includes('begin:vcalendar');
    
    if (!hasVCalendar) {
      console.log('Data does not contain BEGIN:VCALENDAR');
      return false;
    }

    return true;
  }

  static parseICalData(icalData: string, calendar: ICalCalendar): any[] {
    const jcalData = ICAL.parse(icalData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    const allEvents: any[] = [];
    vevents.forEach((vevent) => {
      const event = new ICAL.Event(vevent);
      const eventOccurrences = this.expandRecurringEvent(event, calendar);
      allEvents.push(...eventOccurrences);
    });

    return allEvents;
  }

  static storeEvents(calendarId: string, events: any[]): void {
    try {
      const existingEvents = JSON.parse(localStorage.getItem(ICAL_EVENTS_KEY) || '[]');
      const filteredExisting = existingEvents.filter((event: any) => event.calendarId !== calendarId);
      const combinedEvents = [...filteredExisting, ...events];
      localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(combinedEvents));
    } catch (error) {
      console.error('Error storing iCal events:', error);
    }
  }

  static getEvents(): any[] {
    try {
      const stored = localStorage.getItem(ICAL_EVENTS_KEY);
      if (stored) {
        const events = JSON.parse(stored);
        return events.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading iCal events:', error);
      return [];
    }
  }

  static removeEvents(calendarId: string): void {
    try {
      const storedEvents = localStorage.getItem(ICAL_EVENTS_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        const filteredEvents = events.filter((event: any) => event.calendarId !== calendarId);
        localStorage.setItem(ICAL_EVENTS_KEY, JSON.stringify(filteredEvents));
      }
    } catch (error) {
      console.error('Error removing iCal calendar events:', error);
    }
  }

  private static isEventInCurrentYear(eventDate: Date): boolean {
    const currentYear = new Date().getFullYear();
    return eventDate.getFullYear() === currentYear;
  }

  private static isMultiDayEvent(event: ICAL.Event): boolean {
    try {
      if (!event.startDate || !event.endDate) {
        return false;
      }

      if (event.startDate.isDate && event.endDate.isDate) {
        const startDate = event.startDate.toJSDate();
        const endDate = event.endDate.toJSDate();
        
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 1;
      }

      return false;
    } catch (error) {
      console.warn('Error checking if event is multi-day:', error);
      return false;
    }
  }

  private static expandRecurringEvent(event: ICAL.Event, calendar: ICalCalendar): any[] {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const occurrences: any[] = [];

    try {
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let next;
        let count = 0;
        const maxOccurrences = 366;

        while ((next = iterator.next()) && count < maxOccurrences) {
          const occurrenceDate = next.toJSDate();
          
          if (occurrenceDate >= yearStart && occurrenceDate <= yearEnd) {
            if (this.isMultiDayEvent(event)) {
              const multiDayOccurrences = this.generateMultiDayOccurrences(event, calendar);
              occurrences.push(...multiDayOccurrences);
            } else {
              occurrences.push(this.createEventObject(event, calendar, occurrenceDate, true, false));
            }
          }
          
          if (occurrenceDate > yearEnd) {
            break;
          }
          
          count++;
        }
      } else {
        const multiDayOccurrences = this.generateMultiDayOccurrences(event, calendar);
        occurrences.push(...multiDayOccurrences);
      }
    } catch (error) {
      console.warn('Error expanding recurring event:', error);
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (this.isEventInCurrentYear(eventDate)) {
        occurrences.push(this.createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  }

  private static generateMultiDayOccurrences(event: ICAL.Event, calendar: ICalCalendar): any[] {
    const occurrences: any[] = [];
    
    try {
      if (!this.isMultiDayEvent(event)) {
        const eventDate = event.startDate.toJSDate();
        if (this.isEventInCurrentYear(eventDate)) {
          occurrences.push(this.createEventObject(event, calendar, eventDate, false, false));
        }
        return occurrences;
      }

      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();
      
      const currentDate = new Date(startDate);
      while (currentDate < endDate && this.isEventInCurrentYear(currentDate)) {
        occurrences.push(this.createEventObject(event, calendar, new Date(currentDate), false, true));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.warn('Error generating multi-day occurrences:', error);
      const eventDate = event.startDate ? event.startDate.toJSDate() : new Date();
      if (this.isEventInCurrentYear(eventDate)) {
        occurrences.push(this.createEventObject(event, calendar, eventDate, false, false));
      }
    }

    return occurrences;
  }

  private static createEventObject(event: ICAL.Event, calendar: ICalCalendar, eventDate: Date, isRecurring: boolean, isMultiDay: boolean) {
    let timeString = 'All day';
    
    try {
      if (event.startDate && !event.startDate.isDate) {
        const endDate = event.endDate ? event.endDate.toJSDate() : eventDate;
        timeString = `${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isMultiDay) {
        timeString = 'All day (Multi-day)';
      }
    } catch (dateError) {
      console.warn('Error parsing event date:', dateError);
    }

    if (isRecurring && !timeString.includes('Recurring')) {
      timeString = `${timeString} (Recurring)`;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      title: event.summary || 'Untitled Event',
      time: timeString,
      location: event.location || '',
      attendees: 0,
      category: 'Personal' as const,
      color: calendar.color,
      description: event.description || '',
      organizer: calendar.name,
      date: eventDate,
      calendarId: calendar.id,
      calendarName: calendar.name,
      source: 'ical',
      isMultiDay: isMultiDay
    };
  }
}
