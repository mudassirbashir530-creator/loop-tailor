import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, runTransaction, enableIndexedDbPersistence } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence for Firestore (IndexedDB)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence.');
  }
});

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
  if (errInfo.error.includes('Missing or insufficient permissions')) {
    errorMessage = 'You do not have permission to perform this action.';
  } else {
    errorMessage = errInfo.error;
  }
  toast.error(errorMessage);
  
  throw new Error(JSON.stringify(errInfo));
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
    throw new Error("Failed to generate a unique order ID. Please try again.");
  }
}
