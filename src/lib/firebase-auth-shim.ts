// src/lib/firebase-auth-shim.ts
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';

function decorateUser(userObj: any) {
  if (!userObj) return null;
  // Ensure we don't end up with circular references if decorated multiple times
  const base = { ...userObj };
  delete base.getIdToken;
  delete base.getIdTokenResult;
  delete base.reload;
  delete base.toJSON;

  return {
    ...base,
    getIdToken: async (forceRefresh?: boolean) => 'mock-token-id',
    getIdTokenResult: async (forceRefresh?: boolean) => ({ token: 'mock-token-id' }),
    reload: async () => {},
    toJSON: () => base,
  };
}

// Simple reactive state for the logged-in user
let currentUser: any = null;
const authListeners = new Set<(user: any) => void>();

// Load initial user from localStorage for persistent sessions
try {
  const savedUser = safeGetItem('loop_tailor_user');
  if (savedUser) {
    currentUser = decorateUser(JSON.parse(savedUser));
  }
} catch (e) {
  console.error("Failed to load saved user session", e);
}

export const auth = {
  get currentUser() {
    return currentUser;
  }
};

export function getAuth() {
  return auth;
}

export const browserLocalPersistence = {};

export async function setPersistence() {
  // no-op
}

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  // Execute immediately
  callback(currentUser);
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

function triggerAuthListeners() {
  authListeners.forEach(cb => cb(currentUser));
}

import { getApiUrl } from './apiHelpers';

async function safeJson(res: Response, fallbackValue: any = {}) {
  const text = await res.text();
  if (!text) return fallbackValue;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`[JSON Parse Error] Failed parsing response from ${res.url}. Status: ${res.status}. Content:`, text);
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error(`Backend server is not connected. Please run 'npm run dev' to start local Express server or configure VITE_API_URL.`);
    }
    throw new Error(text.slice(0, 200));
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  const res = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err.error || 'Invalid credentials');
  }
  
  const user = await safeJson(res);
  currentUser = decorateUser({
    uid: user.uid || user._id || user.id,
    email: user.email,
    displayName: user.ownerName || user.name || 'User',
    emailVerified: true,
  });
  
  safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
  triggerAuthListeners();
  return { user: currentUser };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: string) {
  const res = await fetch(getApiUrl('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err.error || 'Failed to sign up');
  }
  
  const user = await safeJson(res);
  currentUser = decorateUser({
    uid: user.uid || user._id || user.id,
    email: user.email,
    displayName: user.ownerName || user.name || 'User',
    emailVerified: true,
  });
  
  safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
  triggerAuthListeners();
  return { user: currentUser };
}

export async function updateProfile(user: any, profileUpdates: { displayName?: string, photoURL?: string }) {
  if (!currentUser) return;
  
  currentUser = decorateUser({
    ...currentUser.toJSON ? currentUser.toJSON() : currentUser,
    ...profileUpdates
  });
  
  safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
  
  // Update in MongoDB
  await fetch(getApiUrl(`/api/db/users/${currentUser.uid}?merge=true`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerName: profileUpdates.displayName || currentUser.displayName,
      photoURL: profileUpdates.photoURL || currentUser.photoURL,
    })
  });
  
  triggerAuthListeners();
}

export async function signOut() {
  currentUser = null;
  safeRemoveItem('loop_tailor_user');
  triggerAuthListeners();
}

export async function sendPasswordResetEmail(authInstance: any, email: string) {
  const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err.error || 'Failed to send password reset email');
  }
}

