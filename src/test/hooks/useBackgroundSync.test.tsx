import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { mockSecurityModule, resetSecurityMocks } from '../utils/securityMocks';

// Apply security mock
mockSecurityModule();

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock ServiceWorker and related APIs
const mockServiceWorker = {
  ready: Promise.resolve({
    active: {
      postMessage: vi.fn(),
    },
    sync: {
      register: vi.fn(),
    }
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  configurable: true,
});

// Mock ServiceWorkerRegistration prototype
Object.defineProperty(window, 'ServiceWorkerRegistration', {
  value: {
    prototype: {
      sync: true,
      periodicSync: true,
    }
  },
  configurable: true,
});

describe('useBackgroundSync', () => {
  beforeEach(() => {
    resetSecurityMocks();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with correct support flags', () => {
    const { result } = renderHook(() => useBackgroundSync());

    expect(result.current.isBackgroundSyncSupported).toBe(true);
    expect(result.current.isPeriodicSyncSupported).toBe(true);
  });

  it('should provide background sync functions', () => {
    const { result } = renderHook(() => useBackgroundSync());

    expect(typeof result.current.registerBackgroundSync).toBe('function');
    expect(typeof result.current.registerPeriodicSync).toBe('function');
    expect(typeof result.current.triggerBackgroundSync).toBe('function');
    expect(typeof result.current.processSyncQueue).toBe('function');
  });

  it('should process sync queue from localStorage', () => {
    const mockSyncQueue = [
      { calendarId: 'test-1', syncTime: new Date().toISOString() },
      { calendarId: 'test-2', syncTime: new Date().toISOString() }
    ];
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSyncQueue));
    
    // Mock dispatchEvent
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    
    const { result } = renderHook(() => useBackgroundSync());

    act(() => {
      result.current.processSyncQueue();
    });

    expect(localStorageMock.getItem).toHaveBeenCalledWith('calendar_sync_queue');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('calendar_sync_queue');
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'background-sync-data-available',
        detail: { syncQueue: mockSyncQueue }
      })
    );
  });

  it('should handle empty sync queue gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useBackgroundSync());

    expect(() => {
      act(() => {
        result.current.processSyncQueue();
      });
    }).not.toThrow();
  });

  it('should initialize with empty sync queue', () => {
    const { result } = renderHook(() => useBackgroundSync());

    expect(result.current.syncQueue).toEqual([]);
    expect(result.current.lastSyncResult).toBe(null);
  });

  it('should call registerBackgroundSync without throwing', async () => {
    const { result } = renderHook(() => useBackgroundSync());

    await expect(
      act(() => result.current.registerBackgroundSync())
    ).resolves.not.toThrow();
  });

  it('should call registerPeriodicSync without throwing', async () => {
    const { result } = renderHook(() => useBackgroundSync());
    
    // Wait for all effects to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.registerPeriodicSync).toBe('function');
    
    await expect(
      act(async () => {
        await result.current.registerPeriodicSync();
      })
    ).resolves.not.toThrow();
  });

  it('should handle service worker not supported', async () => {
    // Temporarily remove ServiceWorker support
    const originalServiceWorker = navigator.serviceWorker;
    const originalSWRegistration = window.ServiceWorkerRegistration;
    
    delete (navigator as any).serviceWorker;
    delete (window as any).ServiceWorkerRegistration;

    const { result } = renderHook(() => useBackgroundSync());

    // Wait for effects to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.isBackgroundSyncSupported).toBe('boolean');
    expect(result.current.isBackgroundSyncSupported).toBe(false);
    expect(result.current.isPeriodicSyncSupported).toBe(false);

    // Restore ServiceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    });
    Object.defineProperty(window, 'ServiceWorkerRegistration', {
      value: originalSWRegistration,
      configurable: true,
    });
  });
});