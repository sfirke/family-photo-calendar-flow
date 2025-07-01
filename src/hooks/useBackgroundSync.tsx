
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BackgroundSyncResult {
  timestamp: string;
  syncedCount: number;
  errorCount: number;
  totalCalendars: number;
}

export const useBackgroundSync = () => {
  const [isBackgroundSyncSupported, setIsBackgroundSyncSupported] = useState(false);
  const [isPeriodicSyncSupported, setIsPeriodicSyncSupported] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<BackgroundSyncResult | null>(null);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const { toast } = useToast();

  // Check for background sync support with better error handling
  useEffect(() => {
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        setIsBackgroundSyncSupported(true);
      }
      
      if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
        setIsPeriodicSyncSupported(true);
      }
    } catch (error) {
      console.warn('Background sync support detection failed:', error);
      setIsBackgroundSyncSupported(false);
      setIsPeriodicSyncSupported(false);
    }
  }, []);

  // Listen for background sync messages with enhanced error handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'BACKGROUND_SYNC_COMPLETE') {
          const result = event.data.result as BackgroundSyncResult;
          setLastSyncResult(result);
          
          if (result.syncedCount > 0) {
            toast({
              title: "Background sync completed",
              description: `Successfully synced ${result.syncedCount} calendar(s)`,
            });
          }
          
          if (result.errorCount > 0) {
            toast({
              title: "Sync issues detected",
              description: `${result.errorCount} calendar(s) failed to sync`,
              variant: "destructive"
            });
          }

          processSyncQueue();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [toast]);

  // Process sync queue from service worker
  const processSyncQueue = useCallback(() => {
    try {
      const queueData = localStorage.getItem('calendar_sync_queue');
      if (queueData) {
        const queue = JSON.parse(queueData);
        setSyncQueue(queue);
        
        localStorage.removeItem('calendar_sync_queue');
        
        window.dispatchEvent(new CustomEvent('background-sync-data-available', { 
          detail: { syncQueue: queue } 
        }));
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }, []);

  // Register for background sync with proper error handling
  const registerBackgroundSync = useCallback(async (): Promise<boolean> => {
    if (!isBackgroundSyncSupported) {
      console.log('Background sync not supported, using fallback');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          resolve(false);
        }, 5000);
        
        registration.active?.postMessage(
          { type: 'REGISTER_BACKGROUND_SYNC' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }, [isBackgroundSyncSupported]);

  // Register for periodic background sync with timeout
  const registerPeriodicSync = useCallback(async (): Promise<boolean> => {
    if (!isPeriodicSyncSupported) {
      console.log('Periodic sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        setTimeout(() => {
          resolve(false);
        }, 5000);
        
        registration.active?.postMessage(
          { type: 'REGISTER_PERIODIC_SYNC' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to register periodic sync:', error);
      return false;
    }
  }, [isPeriodicSyncSupported]);

  // Improved background sync trigger with fallback
  const triggerBackgroundSync = useCallback(async (): Promise<boolean> => {
    if (!isBackgroundSyncSupported) {
      console.log('Background sync not supported, manual sync required');
      toast({
        title: "Manual sync required",
        description: "Background sync not available, please use manual sync",
        variant: "default"
      });
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if ('sync' in registration) {
        await (registration as any).sync.register('calendar-sync');
        
        toast({
          title: "Background sync scheduled",
          description: "Calendar sync will run in the background",
        });
        
        return true;
      } else {
        console.warn('Background sync registration not available');
        return false;
      }
    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      
      toast({
        title: "Sync scheduling failed",
        description: "Please try manual sync instead",
        variant: "destructive"
      });
      
      return false;
    }
  }, [isBackgroundSyncSupported, toast]);

  return {
    isBackgroundSyncSupported,
    isPeriodicSyncSupported,
    lastSyncResult,
    syncQueue,
    registerBackgroundSync,
    registerPeriodicSync,
    triggerBackgroundSync,
    processSyncQueue
  };
};
