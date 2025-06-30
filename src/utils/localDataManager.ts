
import { Event } from '@/types/calendar';

interface ExportData {
  events: Event[];
  exportDate: string;
  version: string;
}

class LocalDataManager {
  exportAllData(): void {
    try {
      const localEvents = localStorage.getItem('family_calendar_events');
      const events = localEvents ? JSON.parse(localEvents) : [];
      
      const exportData: ExportData = {
        events,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `family-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export local data');
    }
  }

  async importAllData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData: ExportData = JSON.parse(e.target?.result as string);
          
          if (importData.events && Array.isArray(importData.events)) {
            localStorage.setItem('family_calendar_events', JSON.stringify(importData.events));
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse import file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  clearAllData(): void {
    try {
      localStorage.removeItem('family_calendar_events');
      localStorage.removeItem('family_calendar_events_version');
      localStorage.removeItem('family_calendar_ical_events');
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
  }

  getStorageUsage(): { used: number; total: number } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.hasOwn(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Estimate total storage (browsers typically allow 5-10MB for localStorage)
      const total = 5 * 1024 * 1024; // 5MB
      
      return { used, total };
    } catch (error) {
      return { used: 0, total: 5 * 1024 * 1024 };
    }
  }
}

// Export legacy functions for backwards compatibility
export const exportLocalData = (): void => {
  localDataManager.exportAllData();
};

export const importLocalData = (file: File): Promise<void> => {
  return localDataManager.importAllData(file);
};

export const clearLocalData = (): void => {
  localDataManager.clearAllData();
};

// Export the manager instance
export const localDataManager = new LocalDataManager();
