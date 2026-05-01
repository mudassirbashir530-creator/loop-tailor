import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    });
    return () => unsub();
  }, []);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6">Admin Activity Log</h2>
      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className="border-b border-slate-100 pb-4">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-slate-900">{log.action}</h4>
              <span className="text-xs text-slate-500">{formatDate(log.timestamp)}</span>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Target:</span> {log.targetUser}
            </p>
            {log.details && (
              <p className="text-sm text-slate-500 mt-1">{log.details}</p>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="py-8 text-center text-slate-500">No logs found.</div>
        )}
      </div>
    </div>
  );
}
