
/**
 * Notion Event Mapper
 * 
 * Converts Notion pages to calendar events
 */

import { NotionPage } from '@/types/notion';
import { NotionPropertyExtractor } from './NotionPropertyExtractor';

export class NotionEventMapper {
  static pageToEvent(page: NotionPage, calendar: any, propertyMappings?: any) {
    const props = page.properties;
    
    // Extract event properties using smart detection
    const title = NotionPropertyExtractor.extractBestProperty(props, ['title', 'name']) || 'Untitled Event';
    const eventDate = NotionPropertyExtractor.extractBestDate(props, ['date', 'time']);
    const description = NotionPropertyExtractor.extractBestProperty(props, ['description', 'note', 'detail']);
    const location = NotionPropertyExtractor.extractBestProperty(props, ['location', 'place', 'venue']);

    return {
      id: `notion_${page.id}`,
      title,
      time: 'All day',
      date: eventDate,
      location,
      attendees: 0,
      category: 'Personal' as const,
      color: calendar.color,
      description,
      organizer: calendar.name,
      calendarId: calendar.id,
      calendarName: calendar.name,
      source: 'notion' as const
    };
  }
}
