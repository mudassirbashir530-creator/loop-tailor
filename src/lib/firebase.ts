import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, runTransaction, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Use environment variables if available, otherwise fallback to the config file
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const storage = getStorage(app);

import { toast } from 'sonner';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  let errorMessage = 'An unexpected error occurred.';
  const errorStr = errInfo.error.toLowerCase();
  
  if (errorStr.includes('missing or insufficient permissions')) {
    errorMessage = 'Permission denied: Please check your account settings and verify you have access to this action.';
  } else if (errorStr.includes('not found') || errorStr.includes('no document to update')) {
    errorMessage = 'Record not found. Please refresh the page and try again.';
  } else if (errorStr.includes('offline') || errorStr.includes('unavailable') || errorStr.includes('network error')) {
    errorMessage = 'No internet connection. Please check your network and try again.';
  } else {
    errorMessage = errInfo.error;
  }
  toast.error(errorMessage);
  
  throw new Error(JSON.stringify(errInfo));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const errorStr = String(error?.message || error).toLowerCase();
      const isTransient = errorStr.includes('offline') || errorStr.includes('unavailable') || errorStr.includes('network error');
      
      if (isTransient && attempt < maxRetries) {
        attempt++;
        const delayMs = attempt * 1000;
        console.warn(`Transient error detected. Retrying operation in ${delayMs}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Operation failed after retries.');
}

/**
 * Generates a unique, incremental Token ID for a shop.
 * Uses a transaction to ensure atomicity and prevent duplicates.
 * Format: LT-{YEAR}{MONTH}-{NUMBER} (e.g. LT-2604-101)
 * Resets to 100 each month automatically.
 */
export async function generateTokenId(shopId: string): Promise<string> {
  const counterRef = doc(db, 'counters', shopId);
  
  try {
    const newTokenId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentMonth = `${year}${month}`;
      
      let lastId = 100;
      let lastMonth = currentMonth;
      
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (data.lastMonth === currentMonth) {
          lastId = data.lastTokenId || 100;
        } else {
          // Reset for new month
          lastId = 100;
        }
      }
      
      const nextId = lastId + 1;
      transaction.set(counterRef, { lastTokenId: nextId, lastMonth: currentMonth }, { merge: true });
      return `LT-${currentMonth}-${nextId}`;
    });
    
    return newTokenId;
  } catch (error) {
    console.error("Error generating token ID:", error);
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const randomFallback = Math.floor(now.getTime() % 10000).toString().padStart(4, '0');
    return `LT-${year}${month}-${randomFallback}`;
  }
}
