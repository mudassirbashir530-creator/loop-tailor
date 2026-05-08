import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Worker } from '../lib/types';
import { toast } from 'sonner';

export function useWorkers() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'workers', user.uid, 'items')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workersData: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        workersData.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          activeOrders: data.activeOrders || 0,
        });
      });
      setWorkers(workersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `workers/${user.uid}/items`);
    });

    return () => unsubscribe();
  }, [user]);

  const addWorker = async (workerData: Omit<Worker, 'id' | 'activeOrders'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'workers', user.uid, 'items'), {
        ...workerData,
        activeOrders: 0,
      });
      toast.success("Worker added");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to add worker");
      handleFirestoreError(error, OperationType.CREATE, `workers/${user.uid}/items`);
    }
  };

  return { workers, loading, addWorker };
}
