// src/lib/firebase-firestore-shim.ts
import { safeGetItem, safeSetItem } from '../utils/storage';
import { getApiUrl } from './apiHelpers';

export const db = { type: 'db' };

export function getFirestore() {
  return db;
}

export function initializeFirestore() {
  return db;
}

export function memoryLocalCache() {
  return {};
}

export function collection(dbInstance: any, name: string) {
  return { type: 'collection', name };
}

export function doc(dbInstanceOrCollection: any, pathOrId?: string, ...rest: string[]) {
  if (dbInstanceOrCollection && dbInstanceOrCollection.type === 'collection') {
    return { type: 'doc', collection: dbInstanceOrCollection.name, id: pathOrId || crypto.randomUUID() };
  }
  
  let coll = typeof dbInstanceOrCollection === 'string' ? dbInstanceOrCollection : pathOrId;
  let docId = rest[0];

  if (coll && coll.includes('/')) {
    const parts = coll.split('/').filter(Boolean);
    if (parts.length >= 2) {
      coll = parts[0];
      docId = parts[1];
    }
  }

  return { type: 'doc', collection: coll || 'unknown', id: docId || crypto.randomUUID() };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { type: 'query', collection: collectionRef.name, constraints };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', value: n };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function increment(n: number) {
  return { __type: 'increment', value: n };
}

function createDocSnapshot(id: string, data: any) {
  return {
    id,
    exists: () => !!data,
    data: () => data,
    metadata: { hasPendingWrites: false }
  };
}

const memoryStoreCache = new Map<string, Record<string, any>>();

function getLocalStore(collectionName: string): Record<string, any> {
  if (memoryStoreCache.has(collectionName)) {
    return memoryStoreCache.get(collectionName)!;
  }
  try {
    const json = safeGetItem(`loop_tailor_db_${collectionName}`);
    const parsed = json ? JSON.parse(json) : {};
    memoryStoreCache.set(collectionName, parsed);
    return parsed;
  } catch (e) {
    return {};
  }
}

function setLocalStore(collectionName: string, store: Record<string, any>) {
  memoryStoreCache.set(collectionName, store);
  try {
    safeSetItem(`loop_tailor_db_${collectionName}`, JSON.stringify(store));
  } catch (e) {}
}

interface PendingSyncItem {
  id: string;
  collection: string;
  docId: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: any;
  timestamp: string;
}

function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = safeGetItem('loop_tailor_pending_sync');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePendingSyncQueue(queue: PendingSyncItem[]) {
  try {
    safeSetItem('loop_tailor_pending_sync', JSON.stringify(queue));
  } catch (e) {}
}

function enqueuePendingSync(item: Omit<PendingSyncItem, 'id' | 'timestamp'>) {
  const queue = getPendingSyncQueue();
  // Avoid duplicate queue entries for the same doc mutation
  const existingIdx = queue.findIndex(q => q.collection === item.collection && q.docId === item.docId && q.method === item.method);
  if (existingIdx >= 0) {
    queue[existingIdx] = { ...item, id: queue[existingIdx].id, timestamp: new Date().toISOString() };
  } else {
    queue.push({ ...item, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
  }
  savePendingSyncQueue(queue);
}

// Background auto-sync function whenever internet reconnects
export async function syncPendingOfflineData() {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return;

  const remaining: PendingSyncItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.body ? { 'Content-Type': 'application/json' } : undefined,
        body: item.body ? JSON.stringify(item.body) : undefined
      });
      if (res.ok) {
        syncedCount++;
      } else {
        remaining.push(item);
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  savePendingSyncQueue(remaining);

  if (syncedCount > 0) {
    console.log(`⚡ Auto-synced ${syncedCount} offline mutations to server.`);
    listeners.forEach((_, coll) => triggerListeners(coll));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingOfflineData();
  });
}

// Fetch document
export async function getDoc(docRef: any) {
  // Super Admin bypass for promptness
  if (docRef.collection === 'admins') {
    if (docRef.id === 'looptailor@gmail.com' || docRef.id === 'mudassirbashir530@gmail.com') {
      return createDocSnapshot(docRef.id, { email: docRef.id, role: 'admin', createdAt: new Date().toISOString() });
    }
  }

  try {
    const res = await fetch(getApiUrl(`/api/db/${docRef.collection}/${docRef.id}`));
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) {
      const data = await res.json();
      // Cache server response locally
      const store = getLocalStore(docRef.collection);
      store[docRef.id] = data;
      setLocalStore(docRef.collection, store);
      return createDocSnapshot(docRef.id, data);
    }
  } catch (err) {}

  // Fallback to client-side storage
  const store = getLocalStore(docRef.collection);
  const localData = store[docRef.id] || null;
  return createDocSnapshot(docRef.id, localData);
}

// Fetch collection or query
export async function getDocs(queryOrCollection: any) {
  const collName = queryOrCollection.collection || queryOrCollection.name;

  try {
    let url = `/api/db/${collName}`;
    const params = new URLSearchParams();
    
    if (queryOrCollection.constraints) {
      for (const c of queryOrCollection.constraints) {
        if (c.type === 'where' && c.op === '==') {
          params.append(c.field, String(c.value));
        } else if (c.type === 'orderBy') {
          params.append('orderBy', c.field);
          params.append('orderDir', c.direction);
        } else if (c.type === 'limit') {
          params.append('limit', String(c.value));
        }
      }
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const res = await fetch(getApiUrl(url));
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) {
      const data = await res.json();
      const docs = Array.isArray(data) ? data.map((d: any) => createDocSnapshot(d.id || d._id, d)) : [];

      // Cache all server docs locally
      if (Array.isArray(data)) {
        const store = getLocalStore(collName);
        data.forEach((d: any) => {
          const docId = d.id || d._id;
          if (docId) store[docId] = d;
        });
        setLocalStore(collName, store);
      }

      return {
        empty: docs.length === 0,
        docs,
        size: docs.length,
        forEach: (cb: (doc: any) => void) => docs.forEach(cb)
      };
    }
  } catch (err) {}

  // Fallback to client-side local storage query
  const store = getLocalStore(collName);
  let docsArray = Object.entries(store).map(([id, data]) => ({ id, ...(data as any) }));

  if (queryOrCollection.constraints) {
    for (const c of queryOrCollection.constraints) {
      if (c.type === 'where' && c.op === '==') {
        docsArray = docsArray.filter(d => String(d[c.field]) === String(c.value));
      } else if (c.type === 'limit') {
        docsArray = docsArray.slice(0, c.value);
      }
    }
  }

  const docs = docsArray.map(d => createDocSnapshot(d.id, d));
  return {
    empty: docs.length === 0,
    docs,
    size: docs.length,
    forEach: (cb: (doc: any) => void) => docs.forEach(cb)
  };
}

// Add doc
export async function addDoc(collectionRef: any, data: any) {
  const docId = data.id || data._id || crypto.randomUUID();
  const payload = { ...data, id: docId, _id: docId };

  // Save locally first for instant zero-latency UI update
  const store = getLocalStore(collectionRef.name);
  store[docId] = payload;
  setLocalStore(collectionRef.name, store);

  const url = getApiUrl(`/api/db/${collectionRef.name}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      enqueuePendingSync({ collection: collectionRef.name, docId, method: 'POST', url, body: payload });
    }
  } catch (e) {
    enqueuePendingSync({ collection: collectionRef.name, docId, method: 'POST', url, body: payload });
  }

  triggerListeners(collectionRef.name);
  return { id: docId };
}

// Set doc
export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const store = getLocalStore(docRef.collection);
  const existing = store[docRef.id] || {};
  const merge = options?.merge !== false;
  
  const updated = merge ? { ...existing, ...data, id: docRef.id } : { ...data, id: docRef.id };
  store[docRef.id] = updated;
  setLocalStore(docRef.collection, store);

  const url = getApiUrl(`/api/db/${docRef.collection}/${docRef.id}?merge=${merge}`);
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      enqueuePendingSync({ collection: docRef.collection, docId: docRef.id, method: 'PUT', url, body: data });
    }
  } catch (e) {
    enqueuePendingSync({ collection: docRef.collection, docId: docRef.id, method: 'PUT', url, body: data });
  }

  triggerListeners(docRef.collection);
}

// Update doc
export async function updateDoc(docRef: any, data: any) {
  return setDoc(docRef, data, { merge: true });
}

// Delete doc
export async function deleteDoc(docRef: any) {
  const store = getLocalStore(docRef.collection);
  delete store[docRef.id];
  setLocalStore(docRef.collection, store);

  const url = getApiUrl(`/api/db/${docRef.collection}/${docRef.id}`);
  try {
    const res = await fetch(url, {
      method: 'DELETE'
    });
    if (!res.ok) {
      enqueuePendingSync({ collection: docRef.collection, docId: docRef.id, method: 'DELETE', url });
    }
  } catch (e) {
    enqueuePendingSync({ collection: docRef.collection, docId: docRef.id, method: 'DELETE', url });
  }

  triggerListeners(docRef.collection);
}

// Live listener registry
const listeners = new Map<string, Set<() => void>>();

function registerListener(collectionName: string, cb: () => void) {
  if (!listeners.has(collectionName)) {
    listeners.set(collectionName, new Set());
  }
  listeners.get(collectionName)!.add(cb);
  return () => {
    listeners.get(collectionName)?.delete(cb);
  };
}

function triggerListeners(collectionName: string) {
  const set = listeners.get(collectionName);
  if (set) {
    set.forEach(cb => cb());
  }
}

// onSnapshot with automatic polling and local triggers
export function onSnapshot(queryOrDoc: any, onNext: (snap: any) => void, onError?: (err: any) => void) {
  let isUnsubscribed = false;
  
  const fetchAndTrigger = async () => {
    if (isUnsubscribed) return;
    try {
      if (queryOrDoc.type === 'doc') {
        const snap = await getDoc(queryOrDoc);
        if (!isUnsubscribed) onNext(snap);
      } else {
        const snap = await getDocs(queryOrDoc);
        if (!isUnsubscribed) onNext(snap);
      }
    } catch (err) {
      if (!isUnsubscribed && onError) onError(err);
    }
  };

  fetchAndTrigger();

  const collName = queryOrDoc.collection || queryOrDoc.name;
  if (collName) {
    const unregister = registerListener(collName, () => {
      fetchAndTrigger();
    });
    
    const intervalId = setInterval(fetchAndTrigger, 4000);

    return () => {
      isUnsubscribed = true;
      unregister();
      clearInterval(intervalId);
    };
  }

  return () => {
    isUnsubscribed = true;
  };
}

export function writeBatch() {
  const operations: Array<() => Promise<void>> = [];
  return {
    set: (docRef: any, data: any, options?: any) => {
      operations.push(() => setDoc(docRef, data, options));
    },
    update: (docRef: any, data: any) => {
      operations.push(() => updateDoc(docRef, data));
    },
    delete: (docRef: any) => {
      operations.push(() => deleteDoc(docRef));
    },
    commit: async () => {
      await Promise.all(operations.map(op => op()));
    }
  };
}
