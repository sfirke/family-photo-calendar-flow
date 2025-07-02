
/**
 * Notion Scraped Events Storage Service
 * 
 * Handles IndexedDB storage for events scraped from public Notion pages
 */

import { NotionScrapedEvent, NotionPageMetadata } from './NotionPageScraper';

export interface NotionScrapedCalendar {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
  type: 'notion-scraped';
  metadata?: NotionPageMetadata;
}

class NotionScrapedEventsStorage {
  private dbName = 'FamilyCalendarDB';
  private dbVersion = 2; // Increment version to add new stores
  private eventsStoreName = 'notion_scraped_events';
  private calendarsStoreName = 'notion_scraped_calendars';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create events store if it doesn't exist
        if (!db.objectStoreNames.contains(this.eventsStoreName)) {
          const eventsStore = db.createObjectStore(this.eventsStoreName, { keyPath: 'id' });
          eventsStore.createIndex('calendarId', 'calendarId', { unique: false });
          eventsStore.createIndex('date', 'date', { unique: false });
          eventsStore.createIndex('scrapedAt', 'scrapedAt', { unique: false });
        }

        // Create calendars store if it doesn't exist
        if (!db.objectStoreNames.contains(this.calendarsStoreName)) {
          const calendarsStore = db.createObjectStore(this.calendarsStoreName, { keyPath: 'id' });
          calendarsStore.createIndex('url', 'url', { unique: false });
          calendarsStore.createIndex('enabled', 'enabled', { unique: false });
        }
      };
    });
  }

  // Calendar management methods
  async addCalendar(calendar: NotionScrapedCalendar): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.calendarsStoreName], 'readwrite');
      const store = transaction.objectStore(this.calendarsStoreName);
      const request = store.add(calendar);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateCalendar(id: string, updates: Partial<NotionScrapedCalendar>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.calendarsStoreName], 'readwrite');
      const store = transaction.objectStore(this.calendarsStoreName);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const calendar = getRequest.result;
        if (calendar) {
          const updatedCalendar = { ...calendar, ...updates };
          const putRequest = store.put(updatedCalendar);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Calendar not found'));
        }
      };
    });
  }

  async deleteCalendar(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.calendarsStoreName, this.eventsStoreName], 'readwrite');
      
      // Delete calendar
      const calendarsStore = transaction.objectStore(this.calendarsStoreName);
      const deleteCalendarRequest = calendarsStore.delete(id);

      // Delete associated events
      const eventsStore = transaction.objectStore(this.eventsStoreName);
      const eventsIndex = eventsStore.index('calendarId');
      const deleteEventsRequest = eventsIndex.openCursor(IDBKeyRange.only(id));

      let hasError = false;

      deleteCalendarRequest.onerror = () => {
        hasError = true;
        reject(deleteCalendarRequest.error);
      };

      deleteEventsRequest.onerror = () => {
        hasError = true;
        reject(deleteEventsRequest.error);
      };

      deleteEventsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        if (!hasError) resolve();
      };
    });
  }

  async getAllCalendars(): Promise<NotionScrapedCalendar[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.calendarsStoreName], 'readonly');
      const store = transaction.objectStore(this.calendarsStoreName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getCalendar(id: string): Promise<NotionScrapedCalendar | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.calendarsStoreName], 'readonly');
      const store = transaction.objectStore(this.calendarsStoreName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Event management methods
  async saveEvents(calendarId: string, events: NotionScrapedEvent[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.eventsStoreName], 'readwrite');
      const store = transaction.objectStore(this.eventsStoreName);

      // First, delete existing events for this calendar
      const index = store.index('calendarId');
      const deleteRequest = index.openCursor(IDBKeyRange.only(calendarId));

      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // After deletion, add new events
          events.forEach(eventData => {
            const eventWithCalendarId = { ...eventData, calendarId };
            store.add(eventWithCalendarId);
          });
        }
      };

      deleteRequest.onerror = () => reject(deleteRequest.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getEventsByCalendar(calendarId: string): Promise<NotionScrapedEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.eventsStoreName], 'readonly');
      const store = transaction.objectStore(this.eventsStoreName);
      const index = store.index('calendarId');
      const request = index.getAll(calendarId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const events = request.result.map(event => ({
          ...event,
          date: new Date(event.date),
          scrapedAt: new Date(event.scrapedAt)
        }));
        resolve(events);
      };
    });
  }

  async getAllEvents(): Promise<NotionScrapedEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.eventsStoreName], 'readonly');
      const store = transaction.objectStore(this.eventsStoreName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const events = request.result.map(event => ({
          ...event,
          date: new Date(event.date),
          scrapedAt: new Date(event.scrapedAt)
        }));
        resolve(events);
      };
    });
  }

  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<NotionScrapedEvent[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.eventsStoreName], 'readonly');
      const store = transaction.objectStore(this.eventsStoreName);
      const index = store.index('date');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const events = request.result.map(event => ({
          ...event,
          date: new Date(event.date),
          scrapedAt: new Date(event.scrapedAt)
        }));
        resolve(events);
      };
    });
  }
}

export const notionScrapedEventsStorage = new NotionScrapedEventsStorage();
// Remove the duplicate export type line that's causing the conflict
