const memoryStorage = new Map<string, string>();
const sessionMemoryStorage = new Map<string, string>();

const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window.localStorage;
    if (!storage) return false;
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

const isSessionStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window.sessionStorage;
    if (!storage) return false;
    const x = '__session_storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
};

export function safeGetItem(key: string): string | null {
  try {
    if (isLocalStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage getItem failed, returning fallback memory value:', e);
  }
  return memoryStorage.get(key) || null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    console.warn('localStorage setItem failed, writing to fallback memory:', e);
  }
  memoryStorage.set(key, value);
}

export function safeRemoveItem(key: string): void {
  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (e) {
    console.warn('localStorage removeItem failed, removing from fallback memory:', e);
  }
  memoryStorage.delete(key);
}

export function safeSessionGetItem(key: string): string | null {
  try {
    if (isSessionStorageAvailable()) {
      return window.sessionStorage.getItem(key);
    }
  } catch (e) {
    console.warn('sessionStorage getItem failed, returning fallback memory value:', e);
  }
  return sessionMemoryStorage.get(key) || null;
}

export function safeSessionSetItem(key: string, value: string): void {
  try {
    if (isSessionStorageAvailable()) {
      window.sessionStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    console.warn('sessionStorage setItem failed, writing to fallback memory:', e);
  }
  sessionMemoryStorage.set(key, value);
}

export function safeSessionRemoveItem(key: string): void {
  try {
    if (isSessionStorageAvailable()) {
      window.sessionStorage.removeItem(key);
      return;
    }
  } catch (e) {
    console.warn('sessionStorage removeItem failed, removing from fallback memory:', e);
  }
  sessionMemoryStorage.delete(key);
}
