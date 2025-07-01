
import { Event } from '@/types/calendar';

export class EventAggregationService {
  static combineEvents(
    localEvents: Event[],
    icalEvents: Event[],
    notionEvents: Event[]
  ): Event[] {
    const allEvents = [...localEvents, ...icalEvents, ...notionEvents];
    
    // Remove duplicates based on title, date, and time
    const uniqueEvents = allEvents.filter((event, index, array) => {
      return array.findIndex(e => 
        e.title === event.title &&
        e.date.getTime() === event.date.getTime() &&
        e.time === event.time
      ) === index;
    });

    // Sort by date and time
    return uniqueEvents.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // Sort all-day events first
      if (a.time === 'All day' && b.time !== 'All day') return -1;
      if (a.time !== 'All day' && b.time === 'All day') return 1;
      
      return a.time.localeCompare(b.time);
    });
  }

  static getEventsByDate(events: Event[], targetDate: Date): Event[] {
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    return events.filter(event => {
      const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
      return eventDate.getTime() === target.getTime();
    });
  }

  static getEventsBySource(events: Event[]) {
    return {
      local: events.filter(event => event.source === 'local' || event.calendarId === 'local_calendar'),
      ical: events.filter(event => event.source === 'ical'),
      notion: events.filter(event => event.source === 'notion'),
      total: events.length
    };
  }

  static getEventsByCategory(events: Event[]) {
    const categories = {
      Personal: events.filter(event => event.category === 'Personal'),
      Work: events.filter(event => event.category === 'Work'),
      Family: events.filter(event => event.category === 'Family'),
      Kids: events.filter(event => event.category === 'Kids'),
      Holidays: events.filter(event => event.category === 'Holidays')
    };

    return categories;
  }
}
