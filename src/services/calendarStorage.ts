
interface CalendarFeed {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSync?: string;
  eventCount?: number;
}

class CalendarStorageService {
  private dbName = 'FamilyCalendarDB';
  private dbVersion = 1;
  private storeName = 'calendar_feeds';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Close existing connection if any
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        this.initPromise = null;
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB connection established successfully');
        
        // Handle unexpected close
        this.db.onclose = () => {
          console.warn('IndexedDB connection closed unexpectedly');
          this.db = null;
          this.initPromise = null;
        };
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Upgrading IndexedDB schema');
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('url', 'url', { unique: false });
          console.log('Created calendar_feeds object store');
        }
      };
    });

    return this.initPromise;
  }

  async addCalendar(calendar: CalendarFeed): Promise<void> {
    try {
      if (!this.db) {
        await this.init();
      }
      
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          
          transaction.oncomplete = () => {
            console.log('Calendar added successfully to IndexedDB');
            resolve();
          };
          
          transaction.onerror = () => {
            console.error('Transaction error while adding calendar:', transaction.error);
            reject(transaction.error);
          };
          
          transaction.onabort = () => {
            console.error('Transaction aborted while adding calendar');
            reject(new Error('Transaction was aborted'));
          };
          
          const store = transaction.objectStore(this.storeName);
          const request = store.add(calendar);

          request.onerror = () => {
            console.error('Request error while adding calendar:', request.error);
            reject(request.error);
          };
        } catch (error) {
          console.error('Error creating transaction for adding calendar:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in addCalendar:', error);
      throw error;
    }
  }

  async updateCalendar(id: string, updates: Partial<CalendarFeed>): Promise<void> {
    try {
      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          
          transaction.oncomplete = () => {
            console.log('Calendar updated successfully in IndexedDB');
            resolve();
          };
          
          transaction.onerror = () => {
            console.error('Transaction error while updating calendar:', transaction.error);
            reject(transaction.error);
          };
          
          transaction.onabort = () => {
            console.error('Transaction aborted while updating calendar');
            reject(new Error('Transaction was aborted'));
          };

          const store = transaction.objectStore(this.storeName);
          const getRequest = store.get(id);

          getRequest.onerror = () => {
            console.error('Request error while getting calendar for update:', getRequest.error);
            reject(getRequest.error);
          };
          
          getRequest.onsuccess = () => {
            const calendar = getRequest.result;
            if (calendar) {
              const updatedCalendar = { ...calendar, ...updates };
              const putRequest = store.put(updatedCalendar);
              putRequest.onerror = () => {
                console.error('Request error while updating calendar:', putRequest.error);
                reject(putRequest.error);
              };
            } else {
              reject(new Error('Calendar not found'));
            }
          };
        } catch (error) {
          console.error('Error creating transaction for updating calendar:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in updateCalendar:', error);
      throw error;
    }
  }

  async deleteCalendar(id: string): Promise<void> {
    try {
      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readwrite');
          
          transaction.oncomplete = () => {
            console.log('Calendar deleted successfully from IndexedDB');
            resolve();
          };
          
          transaction.onerror = () => {
            console.error('Transaction error while deleting calendar:', transaction.error);
            reject(transaction.error);
          };
          
          transaction.onabort = () => {
            console.error('Transaction aborted while deleting calendar');
            reject(new Error('Transaction was aborted'));
          };
          
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(id);

          request.onerror = () => {
            console.error('Request error while deleting calendar:', request.error);
            reject(request.error);
          };
        } catch (error) {
          console.error('Error creating transaction for deleting calendar:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in deleteCalendar:', error);
      throw error;
    }
  }

  async getAllCalendars(): Promise<CalendarFeed[]> {
    try {
      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          
          transaction.onerror = () => {
            console.error('Transaction error while getting all calendars:', transaction.error);
            reject(transaction.error);
          };
          
          transaction.onabort = () => {
            console.error('Transaction aborted while getting all calendars');
            reject(new Error('Transaction was aborted'));
          };
          
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();

          request.onerror = () => {
            console.error('Request error while getting all calendars:', request.error);
            reject(request.error);
          };
          
          request.onsuccess = () => {
            console.log('Successfully retrieved all calendars from IndexedDB:', request.result.length);
            resolve(request.result);
          };
        } catch (error) {
          console.error('Error creating transaction for getting all calendars:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in getAllCalendars:', error);
      throw error;
    }
  }

  async getCalendar(id: string): Promise<CalendarFeed | null> {
    try {
      if (!this.db) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          
          transaction.onerror = () => {
            console.error('Transaction error while getting calendar:', transaction.error);
            reject(transaction.error);
          };
          
          transaction.onabort = () => {
            console.error('Transaction aborted while getting calendar');
            reject(new Error('Transaction was aborted'));
          };
          
          const store = transaction.objectStore(this.storeName);
          const request = store.get(id);

          request.onerror = () => {
            console.error('Request error while getting calendar:', request.error);
            reject(request.error);
          };
          
          request.onsuccess = () => {
            console.log('Successfully retrieved calendar from IndexedDB:', request.result ? 'found' : 'not found');
            resolve(request.result || null);
          };
        } catch (error) {
          console.error('Error creating transaction for getting calendar:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error in getCalendar:', error);
      throw error;
    }
  }
}

export const calendarStorageService = new CalendarStorageService();
export type { CalendarFeed };
