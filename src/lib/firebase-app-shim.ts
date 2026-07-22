// src/lib/firebase-app-shim.ts

export function initializeApp() {
  return { name: '[MongoDB Firebase Shim]' };
}

export function getApps() {
  return [];
}

export function getApp() {
  return { name: '[MongoDB Firebase Shim]' };
}
