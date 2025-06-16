
// Performance utilities for 24/7 display operation
export class PerformanceMonitor {
  private static memoryCheckInterval: NodeJS.Timeout | null = null;
  private static performanceMetrics = {
    memoryUsage: 0,
    renderCount: 0,
    lastCleanup: Date.now()
  };

  static startMonitoring() {
    // Clear any existing interval
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    // Monitor memory usage every 30 minutes
    this.memoryCheckInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, 30 * 60 * 1000);

    console.log('Performance monitoring started for 24/7 operation');
  }

  static stopMonitoring() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  static performMemoryCleanup() {
    // Clear localStorage of old cache entries (older than 24 hours)
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.includes('cache') || key.includes('temp')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && (now - data.timestamp) > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    this.performanceMetrics.lastCleanup = now;
    console.log('Memory cleanup performed at', new Date().toISOString());
  }

  static getMetrics() {
    return { ...this.performanceMetrics };
  }
}

// Efficient interval manager to prevent memory leaks
export class IntervalManager {
  private static intervals = new Map<string, NodeJS.Timeout>();

  static setInterval(key: string, callback: () => void, delay: number) {
    // Clear existing interval with same key
    this.clearInterval(key);
    
    const intervalId = setInterval(callback, delay);
    this.intervals.set(key, intervalId);
    
    return intervalId;
  }

  static clearInterval(key: string) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  static clearAllIntervals() {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
  }

  static getActiveIntervals() {
    return Array.from(this.intervals.keys());
  }
}

// Display optimization utilities
export const displayOptimizations = {
  // Prevent screen burn-in by slightly adjusting elements
  enableBurnInPrevention: () => {
    let offset = 0;
    
    return setInterval(() => {
      offset = (offset + 1) % 4; // Move 0-3 pixels
      document.body.style.transform = `translate(${offset}px, ${offset}px)`;
    }, 10 * 60 * 1000); // Every 10 minutes
  },

  // Optimize for OLED displays
  enableOLEDOptimization: () => {
    // Add dark mode preference for OLED
    document.documentElement.setAttribute('data-oled-optimized', 'true');
  },

  // Reduce animations after midnight to save power
  adjustForTimeOfDay: () => {
    const hour = new Date().getHours();
    const isNightTime = hour >= 22 || hour <= 6;
    
    if (isNightTime) {
      document.documentElement.setAttribute('data-night-mode', 'true');
      // Reduce animation durations
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    } else {
      document.documentElement.removeAttribute('data-night-mode');
      document.documentElement.style.removeProperty('--animation-duration');
    }
  }
};
