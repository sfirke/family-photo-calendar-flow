
const CACHE_NAME = 'family-photo-calendar-v1.2.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/version.json'
];

// External API domains that should bypass the service worker
const EXTERNAL_API_DOMAINS = [
  'api.notion.com',
  'notion.so',
  'www.notion.so',
  'api.codetabs.com',
  'cors-anywhere.herokuapp.com',
  'thingproxy.freeboard.io',
  'cors.bridged.cc'
];

// Check if a URL should bypass the service worker
function shouldBypassServiceWorker(url) {
  try {
    const urlObj = new URL(url);
    return EXTERNAL_API_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return false;
  }
}

// Install event - cache resources with error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use Promise.allSettled to handle individual failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
});

// Fetch event - serve from cache when offline, but bypass external APIs
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // IMPORTANT: Let external API calls bypass the service worker completely
  if (shouldBypassServiceWorker(event.request.url)) {
    console.log('Bypassing service worker for external API:', event.request.url);
    return; // Don't intercept, let the request go through normally
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request since it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).catch(err => {
          console.warn('Fetch failed for internal resource:', err);
          // Only return offline response for internal resources
          return new Response('Offline', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
      .catch(err => {
        console.error('Cache match failed:', err);
        return fetch(event.request).catch(() => {
          return new Response('Offline', { 
            status: 200, 
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'calendar-sync') {
    event.waitUntil(syncCalendarsInBackground());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic background sync triggered:', event.tag);
  
  if (event.tag === 'calendar-periodic-sync') {
    event.waitUntil(syncCalendarsInBackground());
  }
});

// Background calendar sync function
async function syncCalendarsInBackground() {
  try {
    console.log('Starting background calendar sync');
    
    // Get stored calendars from IndexedDB
    const calendars = await getStoredCalendars();
    const enabledCalendars = calendars.filter(cal => cal.enabled);
    
    if (enabledCalendars.length === 0) {
      console.log('No enabled calendars to sync');
      return;
    }
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const calendar of enabledCalendars) {
      try {
        await syncSingleCalendar(calendar);
        syncedCount++;
        console.log(`Successfully synced calendar: ${calendar.name}`);
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync calendar ${calendar.name}:`, error);
      }
    }
    
    // Store sync results
    const syncResult = {
      timestamp: new Date().toISOString(),
      syncedCount,
      errorCount,
      totalCalendars: enabledCalendars.length
    };
    
    // Notify the main thread about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        result: syncResult
      });
    });
    
    console.log('Background sync completed:', syncResult);
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper function to get calendars from IndexedDB
async function getStoredCalendars() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FamilyCalendarDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('calendar_feeds')) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['calendar_feeds'], 'readonly');
      const store = transaction.objectStore('calendar_feeds');
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
    };
  });
}

// Helper function to sync a single calendar
async function syncSingleCalendar(calendar) {
  const CORS_PROXIES = [
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
    (url) => `https://cors.bridged.cc/${url}`,
  ];
  
  // Try direct fetch first, then proxies
  let icalData = null;
  
  try {
    const response = await fetch(calendar.url, {
      mode: 'cors',
      headers: {
        'Accept': 'text/calendar, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; FamilyCalendarApp/1.0)',
      }
    });
    
    if (response.ok) {
      const data = await response.text();
      if (data && data.toLowerCase().includes('begin:vcalendar')) {
        icalData = data;
      }
    }
  } catch (error) {
    // Direct fetch failed, try proxies
  }
  
  // Try proxies if direct fetch failed
  if (!icalData) {
    for (const proxy of CORS_PROXIES) {
      try {
        const proxyUrl = proxy(calendar.url);
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          const data = await response.text();
          if (data && data.toLowerCase().includes('begin:vcalendar')) {
            icalData = data;
            break;
          }
        }
      } catch (error) {
        // Continue to next proxy
      }
    }
  }
  
  if (!icalData) {
    throw new Error('Failed to fetch calendar data from all sources');
  }
  
  // Store the raw iCal data temporarily for the main thread to process
  // We can't import ICAL.js in the service worker, so we'll let the main thread handle parsing
  const syncData = {
    calendarId: calendar.id,
    icalData: icalData,
    syncTime: new Date().toISOString()
  };
  
  // Store in a temporary location for the main thread to pick up
  const request = indexedDB.open('FamilyCalendarDB', 1);
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      
      // Create a temporary store for sync data if it doesn't exist
      if (!db.objectStoreNames.contains('sync_queue')) {
        // Can't modify schema here, so we'll use localStorage as fallback
        try {
          const existingQueue = JSON.parse(localStorage.getItem('calendar_sync_queue') || '[]');
          existingQueue.push(syncData);
          localStorage.setItem('calendar_sync_queue', JSON.stringify(existingQueue));
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }
      
      const transaction = db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const addRequest = store.add(syncData);
      
      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => resolve();
    };
  });
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .catch(err => {
        console.error('Cache cleanup failed:', err);
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    // Register for background sync
    self.registration.sync.register('calendar-sync')
      .then(() => {
        console.log('Background sync registered successfully');
        event.ports[0]?.postMessage({ success: true });
      })
      .catch((error) => {
        console.error('Failed to register background sync:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
  } else if (event.data && event.data.type === 'REGISTER_PERIODIC_SYNC') {
    // Register for periodic background sync (if supported)
    if ('periodicSync' in self.registration) {
      self.registration.periodicSync.register('calendar-periodic-sync', {
        minInterval: 12 * 60 * 60 * 1000, // 12 hours
      })
        .then(() => {
          console.log('Periodic background sync registered successfully');
          event.ports[0]?.postMessage({ success: true });
        })
        .catch((error) => {
          console.error('Failed to register periodic background sync:', error);
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
    } else {
      event.ports[0]?.postMessage({ success: false, error: 'Periodic sync not supported' });
    }
  }
});
