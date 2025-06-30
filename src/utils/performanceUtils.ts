
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
      const memoryInfo = (performance as PerformanceEntry & { memory?: { usedJSHeapSize: number } }).memory;
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
