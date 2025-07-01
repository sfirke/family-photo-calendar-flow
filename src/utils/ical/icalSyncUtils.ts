
import { Event } from '@/types/calendar';

export const icalSyncUtils = {
  calculateSyncInterval: (lastSync: string | undefined): number => {
    if (!lastSync) return 0;
    
    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    return now.getTime() - lastSyncTime.getTime();
  },

  shouldSync: (lastSync: string | undefined, intervalMs: number = 15 * 60 * 1000): boolean => {
    const timeSinceSync = icalSyncUtils.calculateSyncInterval(lastSync);
    return timeSinceSync > intervalMs;
  },

  mergeSyncResults: (existingEvents: Event[], newEvents: Event[]): Event[] => {
    // Create a map of existing events by unique identifier
    const existingMap = new Map<string, Event>();
    existingEvents.forEach(event => {
      const key = `${event.title}-${event.date.getTime()}-${event.time}`;
      existingMap.set(key, event);
    });

    // Add or update events from new sync
    newEvents.forEach(event => {
      const key = `${event.title}-${event.date.getTime()}-${event.time}`;
      existingMap.set(key, event);
    });

    return Array.from(existingMap.values());
  },

  formatSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error'): string => {
    switch (status) {
      case 'idle':
        return 'Ready to sync';
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync successful';
      case 'error':
        return 'Sync failed';
      default:
        return 'Unknown status';
    }
  },

  formatLastSyncTime: (lastSync: string | undefined): string => {
    if (!lastSync) return 'Never synced';
    
    const syncTime = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - syncTime.getTime();
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} minutes ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)} hours ago`;
    return `${Math.floor(diffMs / 86400000)} days ago`;
  }
};
