
// Type declarations for Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
  getTags(): Promise<string[]>;
  unregister(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
  periodicSync: PeriodicSyncManager;
}

interface ServiceWorkerGlobalScope {
  registration: ServiceWorkerRegistration & {
    sync: SyncManager;
    periodicSync: PeriodicSyncManager;
  };
}

// Extend Window interface to include ServiceWorkerRegistration with sync
declare global {
  interface Window {
    ServiceWorkerRegistration: {
      prototype: ServiceWorkerRegistration;
    };
  }
}
