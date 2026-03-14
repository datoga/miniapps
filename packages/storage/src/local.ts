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
  setJSON<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove a value from localStorage
   */
  remove(key: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
