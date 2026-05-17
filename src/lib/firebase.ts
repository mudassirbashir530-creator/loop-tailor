import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDd2HsiD-yRps2q-FgbH8G5w_Wl1vJMMC8",
  authDomain: "tailor-app-76f20.firebaseapp.com",
  databaseURL: "https://tailor-app-76f20-default-rtdb.firebaseio.com",
  projectId: "tailor-app-76f20",
  storageBucket: "tailor-app-76f20.firebasestorage.app",
  messagingSenderId: "974622533594",
  appId: "1:974622533594:web:e9b27ddf8886abbb4942e3",
  measurementId: "G-5BMD8109NH"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Handle storage access denail gracefully
const setAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error: any) {
    console.warn("Storage access denied for browserLocalPersistence, trying fallback...", error.message);
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (sessionError: any) {
      console.warn("Storage access denied for browserSessionPersistence, using inMemoryPersistence", sessionError.message);
      await setPersistence(auth, inMemoryPersistence);
    }
  }
};

setAuthPersistence();

export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Messaging conditionally (not supported in all browsers i.e Safari)
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// No test connection logic here to prevent early unhandled rejections during app boot.
// Firebase SDK handles its own connectivity state.
