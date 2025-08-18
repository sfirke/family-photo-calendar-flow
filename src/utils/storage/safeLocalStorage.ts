// A lightweight wrapper to safely access localStorage in environments where it may be undefined (SSR/tests)
// Provides no-op fallbacks when not available.
export interface SafeLocalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  exists(key: string): boolean;
}

class SafeLocalStorage implements SafeLocalStorageLike {
  private get ls(): Storage | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage;
    } catch {
      return null;
    }
  }

  getItem(key: string): string | null {
    const ls = this.ls; return ls ? ls.getItem(key) : null;
  }
  setItem(key: string, value: string): void {
    const ls = this.ls; if (ls) ls.setItem(key, value);
  }
  removeItem(key: string): void {
    const ls = this.ls; if (ls) ls.removeItem(key);
  }
  clear(): void {
    const ls = this.ls; if (ls) ls.clear();
  }
  exists(key: string): boolean {
    const ls = this.ls; return ls ? ls.getItem(key) !== null : false;
  }
}

export const safeLocalStorage: SafeLocalStorageLike = new SafeLocalStorage();
