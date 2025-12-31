/**
 * LocalStorage helpers as fallback for IndexedDB
 */
export const local = {
  /**
   * Get a JSON value from localStorage
   */
  getJSON<T>(key: string): T | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set a JSON value in localStorage
   */
  setJSON<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail (quota exceeded, etc.)
    }
  },

  /**
   * Remove a value from localStorage
   */
  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
};

