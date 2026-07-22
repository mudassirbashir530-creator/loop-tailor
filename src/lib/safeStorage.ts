
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';

export const safeStorage = {
  getItem: (key: string): string | null => {
    return safeGetItem(key);
  },

  setItem: (key: string, value: string): void => {
    safeSetItem(key, value);
  },

  removeItem: (key: string): void => {
    safeRemoveItem(key);
  },

  clear: (): void => {
    // Rely on clearing if storage is accessible, otherwise clear is a no-op or we can clear memoryStorage
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('Storage clear denied');
    }
  }
};

