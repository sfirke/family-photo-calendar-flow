/**
 * Weather Storage Service
 * 
 * Implements tiered storage for weather data:
 * 1. In-memory cache (fastest)
 * 2. localStorage (fallback)
 * 3. IndexedDB (persistent storage for current and forecast data)
 */

import { WeatherData, WeatherForecastDay } from '@/types/weather';

interface CurrentWeatherData {
  id: string;
  location: string;
  temperature: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
  lastUpdated: string;
  provider: string;
  timestamp: number;
  expiresAt: number;
}

interface ForecastDayData {
  id: string; // Format: YYYY-MM-DD
  date: string;
  temp?: number;
  high?: number;
  low?: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  uvIndex?: number;
  icon?: string;
  timestamp: number;
  expiresAt: number;
}

interface NWSRawData {
  id: string;
  rawData: any;
  timestamp: number;
  expiresAt: number;
}

class WeatherStorageService {
  private cache = new Map<string, any>();
  private dbName = 'WeatherDataDB';
  private dbVersion = 1;
  private currentWeatherStore = 'current_weather';
  private forecastStore = 'forecast_data';
  private rawDataStore = 'raw_nws';
  private db: IDBDatabase | null = null;
  
  private readonly CACHE_EXPIRY_HOURS = 6;
  private readonly CACHE_EXPIRY_MS = this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

  /**
   * Initialize IndexedDB with multiple object stores
   */
  private async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Current weather store
        if (!db.objectStoreNames.contains(this.currentWeatherStore)) {
          const currentStore = db.createObjectStore(this.currentWeatherStore, { keyPath: 'id' });
          currentStore.createIndex('timestamp', 'timestamp', { unique: false });
          currentStore.createIndex('location', 'location', { unique: false });
        }
        
        // Forecast data store
        if (!db.objectStoreNames.contains(this.forecastStore)) {
          const forecastStore = db.createObjectStore(this.forecastStore, { keyPath: 'id' });
          forecastStore.createIndex('date', 'date', { unique: false });
          forecastStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Raw NWS data store
        if (!db.objectStoreNames.contains(this.rawDataStore)) {
          const rawStore = db.createObjectStore(this.rawDataStore, { keyPath: 'id' });
          rawStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save current weather data to tiered storage
   */
  async saveCurrentWeather(weatherData: WeatherData): Promise<void> {
    try {
      const now = Date.now();
      const currentData: CurrentWeatherData = {
        id: 'current',
        location: weatherData.location,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        description: weatherData.description,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        uvIndex: weatherData.uvIndex,
        lastUpdated: weatherData.lastUpdated,
        provider: weatherData.provider,
        timestamp: now,
        expiresAt: now + this.CACHE_EXPIRY_MS
      };

      // 1. Save to memory cache
      this.cache.set('current_weather', currentData);
      console.log('💨 Current weather cached in memory');

      // 2. Save to localStorage
      localStorage.setItem('weather_current', JSON.stringify(currentData));
      console.log('💾 Current weather saved to localStorage');

      // 3. Save to IndexedDB
      await this.saveCurrentWeatherToIndexedDB(currentData);
      console.log('🗃️ Current weather saved to IndexedDB');

    } catch (error) {
      console.error('Error saving current weather:', error);
      throw error;
    }
  }

  /**
   * Save forecast data to tiered storage (each day separately)
   */
  async saveForecastData(forecastDays: WeatherForecastDay[]): Promise<void> {
    try {
      const now = Date.now();
      const forecastData: ForecastDayData[] = forecastDays.map(day => ({
        id: day.date,
        date: day.date,
        temp: day.temp,
        high: day.high,
        low: day.low,
        condition: day.condition,
        description: day.description,
        humidity: day.humidity,
        windSpeed: day.windSpeed,
        uvIndex: day.uvIndex,
        timestamp: now,
        expiresAt: now + this.CACHE_EXPIRY_MS
      }));

      // 1. Save to memory cache
      forecastData.forEach(day => {
        this.cache.set(`forecast_${day.date}`, day);
      });
      console.log(`🌤️ ${forecastData.length} forecast days cached in memory`);

      // 2. Save to localStorage
      localStorage.setItem('weather_forecast', JSON.stringify(forecastData));
      console.log('💾 Forecast data saved to localStorage');

      // 3. Save to IndexedDB
      await this.saveForecastToIndexedDB(forecastData);
      console.log(`🗃️ ${forecastData.length} forecast days saved to IndexedDB`);

    } catch (error) {
      console.error('Error saving forecast data:', error);
      throw error;
    }
  }

  /**
   * Save raw NWS API response data
   */
  async saveRawNWSData(rawData: any): Promise<void> {
    try {
      const now = Date.now();
      const rawRecord: NWSRawData = {
        id: 'nws_raw',
        rawData,
        timestamp: now,
        expiresAt: now + this.CACHE_EXPIRY_MS
      };

      // 1. Save to memory cache
      this.cache.set('nws_raw', rawRecord);
      console.log('📡 Raw NWS data cached in memory');

      // 2. Save to localStorage
      localStorage.setItem('nws_raw_cache', JSON.stringify(rawRecord));
      console.log('💾 Raw NWS data saved to localStorage');

      // 3. Save to IndexedDB
      await this.saveRawDataToIndexedDB(rawRecord);
      console.log('🗃️ Raw NWS data saved to IndexedDB');

    } catch (error) {
      console.error('Error saving raw NWS data:', error);
      throw error;
    }
  }

  /**
   * Get current weather data using tiered storage
   */
  async getCurrentWeather(): Promise<CurrentWeatherData | null> {
    try {
      // 1. Check memory cache first
      const cached = this.cache.get('current_weather');
      if (cached && cached.expiresAt > Date.now()) {
        console.log('⚡ Current weather loaded from memory cache');
        return cached;
      }

      // 2. Check localStorage
      const localData = localStorage.getItem('weather_current');
      if (localData) {
        const parsed: CurrentWeatherData = JSON.parse(localData);
        if (parsed.expiresAt > Date.now()) {
          this.cache.set('current_weather', parsed);
          console.log('💾 Current weather loaded from localStorage');
          return parsed;
        }
      }

      // 3. Check IndexedDB
      const dbData = await this.getCurrentWeatherFromIndexedDB();
      if (dbData && dbData.expiresAt > Date.now()) {
        this.cache.set('current_weather', dbData);
        localStorage.setItem('weather_current', JSON.stringify(dbData));
        console.log('🗃️ Current weather loaded from IndexedDB');
        return dbData;
      }

      return null;
    } catch (error) {
      console.error('Error getting current weather:', error);
      return null;
    }
  }

  /**
   * Get forecast data for a specific date
   */
  async getForecastForDate(date: string): Promise<ForecastDayData | null> {
    try {
      // 1. Check memory cache first
      const cached = this.cache.get(`forecast_${date}`);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`⚡ Forecast for ${date} loaded from memory cache`);
        return cached;
      }

      // 2. Check localStorage
      const localData = localStorage.getItem('weather_forecast');
      if (localData) {
        const forecastArray: ForecastDayData[] = JSON.parse(localData);
        const dayData = forecastArray.find(day => day.date === date);
        if (dayData && dayData.expiresAt > Date.now()) {
          this.cache.set(`forecast_${date}`, dayData);
          console.log(`💾 Forecast for ${date} loaded from localStorage`);
          return dayData;
        }
      }

      // 3. Check IndexedDB
      const dbData = await this.getForecastFromIndexedDB(date);
      if (dbData && dbData.expiresAt > Date.now()) {
        this.cache.set(`forecast_${date}`, dbData);
        console.log(`🗃️ Forecast for ${date} loaded from IndexedDB`);
        return dbData;
      }

      return null;
    } catch (error) {
      console.error(`Error getting forecast for ${date}:`, error);
      return null;
    }
  }

  /**
   * Get raw NWS data for fallback processing
   */
  async getRawNWSData(): Promise<any | null> {
    try {
      // 1. Check memory cache first
      const cached = this.cache.get('nws_raw');
      if (cached && cached.expiresAt > Date.now()) {
        console.log('⚡ Raw NWS data loaded from memory cache');
        return cached.rawData;
      }

      // 2. Check localStorage
      const localData = localStorage.getItem('nws_raw_cache');
      if (localData) {
        const parsed: NWSRawData = JSON.parse(localData);
        if (parsed.expiresAt > Date.now()) {
          this.cache.set('nws_raw', parsed);
          console.log('💾 Raw NWS data loaded from localStorage');
          return parsed.rawData;
        }
      }

      // 3. Check IndexedDB
      const dbData = await this.getRawDataFromIndexedDB();
      if (dbData && dbData.expiresAt > Date.now()) {
        this.cache.set('nws_raw', dbData);
        localStorage.setItem('nws_raw_cache', JSON.stringify(dbData));
        console.log('🗃️ Raw NWS data loaded from IndexedDB');
        return dbData.rawData;
      }

      return null;
    } catch (error) {
      console.error('Error getting raw NWS data:', error);
      return null;
    }
  }

  /**
   * Clear all weather data from storage
   */
  async clearAllWeatherData(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();

      // Clear localStorage
      localStorage.removeItem('weather_current');
      localStorage.removeItem('weather_forecast');
      localStorage.removeItem('nws_raw_cache');

      // Clear IndexedDB stores
      await this.clearIndexedDBStore(this.currentWeatherStore);
      await this.clearIndexedDBStore(this.forecastStore);
      await this.clearIndexedDBStore(this.rawDataStore);

      console.log('🧹 All weather data cleared from storage');
    } catch (error) {
      console.error('Error clearing weather data:', error);
      throw error;
    }
  }

  // Private IndexedDB methods
  private async saveCurrentWeatherToIndexedDB(data: CurrentWeatherData): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.currentWeatherStore], 'readwrite');
      const store = transaction.objectStore(this.currentWeatherStore);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async saveForecastToIndexedDB(forecastData: ForecastDayData[]): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.forecastStore], 'readwrite');
      const store = transaction.objectStore(this.forecastStore);
      
      let completed = 0;
      const total = forecastData.length;

      forecastData.forEach(day => {
        const request = store.put(day);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  private async saveRawDataToIndexedDB(data: NWSRawData): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.rawDataStore], 'readwrite');
      const store = transaction.objectStore(this.rawDataStore);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getCurrentWeatherFromIndexedDB(): Promise<CurrentWeatherData | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.currentWeatherStore], 'readonly');
      const store = transaction.objectStore(this.currentWeatherStore);
      const request = store.get('current');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async getForecastFromIndexedDB(date: string): Promise<ForecastDayData | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.forecastStore], 'readonly');
      const store = transaction.objectStore(this.forecastStore);
      const request = store.get(date);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async getRawDataFromIndexedDB(): Promise<NWSRawData | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.rawDataStore], 'readonly');
      const store = transaction.objectStore(this.rawDataStore);
      const request = store.get('nws_raw');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async clearIndexedDBStore(storeName: string): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const weatherStorageService = new WeatherStorageService();
export type { CurrentWeatherData, ForecastDayData, NWSRawData };