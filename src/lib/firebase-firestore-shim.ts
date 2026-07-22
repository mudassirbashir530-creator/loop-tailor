// src/lib/firebase-firestore-shim.ts

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

// Map MongoDB response to Firestore-like DocumentSnapshot
function createDocSnapshot(id: string, data: any) {
  return {
    id,
    exists: () => !!data,
    data: () => data,
    metadata: { hasPendingWrites: false }
  };
}

async function safeJson(res: Response, fallbackValue: any = {}) {
  const text = await res.text();
  if (!text) return fallbackValue;
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`[JSON Parse Error] Failed parsing response from ${res.url}. Status: ${res.status}. Content:`, text);
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error(`Server returned HTML error page. This usually indicates a 404/500 routing error on server-side. URL: ${res.url}`);
    }
    throw new Error(text.slice(0, 200));
  }
}

// Fetch document
export async function getDoc(docRef: any) {
  try {
    const res = await fetch(`/api/db/${docRef.collection}/${docRef.id}`);
    if (!res.ok) {
      if (res.status === 404) {
        return createDocSnapshot(docRef.id, null);
      }
      throw new Error("Failed to fetch doc");
    }
    const data = await safeJson(res);
    return createDocSnapshot(docRef.id, data);
  } catch (err) {
    console.error("getDoc error:", err);
    return createDocSnapshot(docRef.id, null);
  }
}

// Fetch collection or query
export async function getDocs(queryOrCollection: any) {
  try {
    let url = `/api/db/${queryOrCollection.collection || queryOrCollection.name}`;
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
    
    const res = await fetch(url);
    const data = await safeJson(res, []);
    
    const docs = Array.isArray(data) ? data.map((d: any) => createDocSnapshot(d.id || d._id, d)) : [];
    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb: (doc: any) => void) => docs.forEach(cb)
    };
  } catch (err) {
    console.error("getDocs error:", err);
    return { empty: true, docs: [], forEach: () => {} };
  }
}

// Add doc
export async function addDoc(collectionRef: any, data: any) {
  const res = await fetch(`/api/db/${collectionRef.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const saved = await safeJson(res);
  // Trigger general local updates
  triggerListeners(collectionRef.name);
  return { id: saved.id || saved._id };
}

// Set doc
export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const merge = options?.merge !== false;
  await fetch(`/api/db/${docRef.collection}/${docRef.id}?merge=${merge}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  triggerListeners(docRef.collection);
}

// Update doc
export async function updateDoc(docRef: any, data: any) {
  await fetch(`/api/db/${docRef.collection}/${docRef.id}?merge=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  triggerListeners(docRef.collection);
}

// Delete doc
export async function deleteDoc(docRef: any) {
  await fetch(`/api/db/${docRef.collection}/${docRef.id}`, {
    method: 'DELETE'
  });
  triggerListeners(docRef.collection);
}

// Live listener registry to support real-time update triggers!
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

// onSnapshot with automatic polling and manual triggers for instant responsiveness!
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

  // 1. Fetch immediately
  fetchAndTrigger();

  // 2. Register for local mutation triggers (makes the app feel 100% real-time and instant!)
  const collName = queryOrDoc.collection || queryOrDoc.name;
  if (collName) {
    const unregister = registerListener(collName, () => {
      fetchAndTrigger();
    });
    
    // 3. Periodic poll fallback in case of mutations from other clients/tabs
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

// Write batch support
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
