
import { useState, useCallback } from 'react';

export const useCalendarSync = () => {
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateSyncStatus = useCallback((calendarId: string, status: string) => {
    setSyncStatus(prev => ({ ...prev, [calendarId]: status }));
  }, []);

  const clearSyncStatus = useCallback((calendarId: string) => {
    setSyncStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[calendarId];
      return newStatus;
    });
  }, []);

  const startSync = useCallback((calendarId: string) => {
    setIsLoading(true);
    updateSyncStatus(calendarId, 'syncing');
  }, [updateSyncStatus]);

  const completeSync = useCallback((calendarId: string, success: boolean) => {
    setIsLoading(false);
    updateSyncStatus(calendarId, success ? 'success' : 'error');
  }, [updateSyncStatus]);

  return {
    syncStatus,
    isLoading,
    updateSyncStatus,
    clearSyncStatus,
    startSync,
    completeSync
  };
};
