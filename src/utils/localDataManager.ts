
export interface LocalDataManager {
  exportAllData: () => void;
  importAllData: (file: File) => Promise<void>;
  clearAllData: () => void;
  getStorageUsage: () => { used: number; total: number };
}

const getAllLocalStorageData = () => {
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('family_calendar_')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return data;
};

export const localDataManager: LocalDataManager = {
  exportAllData: () => {
    const allData = getAllLocalStorageData();
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  },

  importAllData: (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // Clear existing family calendar data
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('family_calendar_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Import new data
          Object.entries(importedData).forEach(([key, value]) => {
            if (key.startsWith('family_calendar_')) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
          });
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  },

  clearAllData: () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('family_calendar_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  getStorageUsage: () => {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('family_calendar_')) {
        const value = localStorage.getItem(key) || '';
        used += key.length + value.length;
      }
    }
    
    // Estimate total available (5MB is typical localStorage limit)
    const total = 5 * 1024 * 1024; // 5MB in bytes
    
    return { used, total };
  }
};
