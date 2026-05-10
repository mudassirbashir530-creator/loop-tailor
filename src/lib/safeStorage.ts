
type StorageType = 'localStorage' | 'sessionStorage';

const isStorageAvailable = (type: StorageType): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window[type];
    if (!storage) return false;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable('localStorage')) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage access denied, falling back to memory');
    }
    return memoryStorage.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable('localStorage')) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('Storage access denied, falling back to memory');
    }
    memoryStorage.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable('localStorage')) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('Storage access denied, falling back to memory');
    }
    memoryStorage.delete(key);
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && isStorageAvailable('localStorage')) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn('Storage access denied, falling back to memory');
    }
    memoryStorage.clear();
  }
};
