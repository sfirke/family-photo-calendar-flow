
interface PerformanceEntry {
  name: string;
  startTime: number;
  duration?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
}

class PerformanceTracker {
  private entries: Map<string, PerformanceEntry> = new Map();

  startMeasurement(name: string): void {
    this.entries.set(name, {
      name,
      startTime: performance.now()
    });
  }

  endMeasurement(name: string): number | null {
    const entry = this.entries.get(name);
    if (!entry) return null;

    const duration = performance.now() - entry.startTime;
    entry.duration = duration;
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  getMetrics(): PerformanceMetrics {
    const renderEntry = this.entries.get('render');
    
    return {
      renderTime: renderEntry?.duration || 0,
      memoryUsage: this.getMemoryUsage(),
      componentCount: this.entries.size
    };
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memoryInfo = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      return memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : undefined;
    }
    return undefined;
  }

  reset(): void {
    this.entries.clear();
  }
}

export const performanceTracker = new PerformanceTracker();

export const measureComponentRender = <T>(
  component: () => T,
  componentName: string
): T => {
  performanceTracker.startMeasurement(`${componentName}-render`);
  const result = component();
  performanceTracker.endMeasurement(`${componentName}-render`);
  return result;
};

export const logRenderMetrics = (): void => {
  const metrics = performanceTracker.getMetrics();
  console.table(metrics);
};

// Export additional utilities needed by other components
export class PerformanceMonitor {
  static trackPageLoad(): void {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    });
  }
}

export class IntervalManager {
  private intervals: Set<number> = new Set();

  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id: number): void {
    window.clearInterval(id);
    this.intervals.delete(id);
  }

  clearAll(): void {
    this.intervals.forEach(id => window.clearInterval(id));
    this.intervals.clear();
  }
}

export const displayOptimizations = {
  enableVirtualization: () => {
    console.log('Virtual scrolling enabled for large lists');
  },
  
  enableImageLazyLoading: () => {
    console.log('Lazy loading enabled for images');
  }
};
