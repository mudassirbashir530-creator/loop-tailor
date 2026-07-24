// src/lib/firebase-auth-shim.ts
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';
import { getApiUrl } from './apiHelpers';

function decorateUser(userObj: any) {
  if (!userObj) return null;
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

let currentUser: any = null;
const authListeners = new Set<(user: any) => void>();

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
  callback(currentUser);
  authListeners.add(callback);
  return () => {
    authListeners.delete(callback);
  };
}

function triggerAuthListeners() {
  authListeners.forEach(cb => cb(currentUser));
}

async function safeJson(res: Response, fallbackValue: any = {}) {
  const text = await res.text();
  if (!text) return fallbackValue;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("HTML_RESPONSE");
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Express Backend API first
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) {
      const user = await res.json();
      currentUser = decorateUser({
        uid: user.uid || user._id || user.id,
        email: user.email,
        displayName: user.ownerName || user.name || 'User',
        emailVerified: true,
      });
      
      safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
      triggerAuthListeners();
      return { user: currentUser };
    } else if (isJson) {
      const errData = await res.json();
      throw new Error(errData.error || 'Invalid credentials');
    }
  } catch (apiErr: any) {
    if (apiErr.message !== 'HTML_RESPONSE' && !apiErr.message.includes('fetch') && apiErr.message !== 'Failed to fetch') {
      throw apiErr;
    }
  }

  // 2. Client-side Fallback (For Cloudflare Pages static hosting)
  let localUsers: any[] = [];
  try {
    const savedUsers = safeGetItem('loop_tailor_users_db');
    if (savedUsers) localUsers = JSON.parse(savedUsers);
  } catch (e) {}

  let foundUser = localUsers.find(u => u.email === normalizedEmail);

  // Super Admin Fallback
  if (!foundUser && normalizedEmail === 'looptailor@gmail.com') {
    foundUser = {
      uid: 'user_looptailor_admin',
      _id: 'user_looptailor_admin',
      email: 'looptailor@gmail.com',
      displayName: 'Super Admin',
      password: password,
      role: 'admin',
      isAdmin: true
    };
  }

  if (!foundUser) {
    throw new Error('No user found with this email. Please sign up first.');
  }

  if (foundUser.password && foundUser.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  currentUser = decorateUser({
    uid: foundUser.uid || foundUser._id || 'user_' + Date.now(),
    email: foundUser.email,
    displayName: foundUser.displayName || foundUser.ownerName || 'User',
    emailVerified: true,
    role: foundUser.role,
    isAdmin: foundUser.isAdmin
  });

  safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
  triggerAuthListeners();
  return { user: currentUser };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Express Backend API first
  try {
    const res = await fetch(getApiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) {
      const user = await res.json();
      currentUser = decorateUser({
        uid: user.uid || user._id || user.id,
        email: user.email,
        displayName: user.ownerName || user.name || 'User',
        emailVerified: true,
      });
      
      safeSetItem('loop_tailor_user', JSON.stringify(currentUser.toJSON()));
      triggerAuthListeners();
      return { user: currentUser };
    } else if (isJson) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to sign up');
    }
  } catch (apiErr: any) {
    if (apiErr.message !== 'HTML_RESPONSE' && !apiErr.message.includes('fetch') && apiErr.message !== 'Failed to fetch') {
      throw apiErr;
    }
  }

  // 2. Client-side Fallback (For Cloudflare Pages static hosting)
  let localUsers: any[] = [];
  try {
    const savedUsers = safeGetItem('loop_tailor_users_db');
    if (savedUsers) localUsers = JSON.parse(savedUsers);
  } catch (e) {}

  if (localUsers.some(u => u.email === normalizedEmail)) {
    throw new Error('An account with this email address already exists. Please login instead.');
  }

  const userId = "user_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  const newUser = {
    uid: userId,
    _id: userId,
    email: normalizedEmail,
    displayName: normalizedEmail.split('@')[0],
    emailVerified: true,
    password: password
  };

  localUsers.push(newUser);
  safeSetItem('loop_tailor_users_db', JSON.stringify(localUsers));

  currentUser = decorateUser(newUser);
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
  
  try {
    await fetch(getApiUrl(`/api/db/users/${currentUser.uid}?merge=true`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: profileUpdates.displayName || currentUser.displayName,
        photoURL: profileUpdates.photoURL || currentUser.photoURL,
      })
    });
  } catch (e) {}
  
  triggerAuthListeners();
}

export async function signOut() {
  currentUser = null;
  safeRemoveItem('loop_tailor_user');
  triggerAuthListeners();
}

export async function sendPasswordResetEmail(authInstance: any, email: string) {
  try {
    const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) return;
  } catch (e) {}
}
