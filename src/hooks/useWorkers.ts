import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, serverTimestamp, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
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
      return;
    }

    const q = query(
      collection(db, 'workers'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workersData: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          workersData.push({
            id: doc.id,
            name: data.name || 'Unnamed Worker',
            phone: data.phone || '',
            whatsappPhone: data.whatsappPhone || '',
            countryCode: data.countryCode || '+92',
            role: data.role || 'tailor',
            salaryType: (() => {
              const st = data.salaryType || 'monthly';
              if (st === 'fixed') return 'monthly';
              if (st === 'per-order' || st === 'per_order') return 'per_suit';
              return st;
            })(),
            salaryAmount: data.salaryAmount || 0,
            speciality: data.speciality || '',
            address: data.address || '',
            notes: data.notes || '',
            joiningDate: data.joiningDate || new Date().toISOString(),
            profileImage: data.profileImage || null,
            status: data.status || 'available',
            activeOrders: data.activeOrders || 0,
            completedOrders: data.completedOrders || 0,
            totalEarnings: data.totalEarnings || 0,
            userId: data.userId || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          });
        }
      });
      setWorkers(workersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addWorker = async (workerData: Omit<Worker, 'id' | 'activeOrders' | 'completedOrders' | 'totalEarnings' | 'userId' | 'createdAt'>) => {
    if (!user) return null;
    try {
      let mappedSalaryType = workerData.salaryType;
      if ((mappedSalaryType as any) === 'fixed') mappedSalaryType = 'monthly';
      if ((mappedSalaryType as any) === 'per-order' || (mappedSalaryType as any) === 'per_order') mappedSalaryType = 'per_suit';

      const dataToSave: any = {
        ...workerData,
        salaryType: mappedSalaryType,
        userId: user.uid,
        createdBy: user.uid,
        activeOrders: 0,
        completedOrders: 0,
        totalEarnings: 0,
        createdAt: serverTimestamp(),
      };
      
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      const docRef = await addDoc(collection(db, 'workers'), dataToSave);
      toast.success("Worker added perfectly");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to add worker");
      handleFirestoreError(error, OperationType.CREATE, 'workers');
    }
  };

  const updateWorker = async (id: string, workerData: Partial<Worker>) => {
    if (!user) return;
    try {
      let mappedSalaryType = workerData.salaryType;
      if ((mappedSalaryType as any) === 'fixed') mappedSalaryType = 'monthly';
      if ((mappedSalaryType as any) === 'per-order' || (mappedSalaryType as any) === 'per_order') mappedSalaryType = 'per_suit';

      const dataToUpdate: any = {
        ...workerData,
        updatedAt: serverTimestamp(),
      };
      if (mappedSalaryType !== undefined) {
        dataToUpdate.salaryType = mappedSalaryType;
      }
      
      Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

      await updateDoc(doc(db, 'workers', id), dataToUpdate);
      toast.success("Worker updated successfully");
    } catch (error) {
      toast.error("Failed to update worker");
      handleFirestoreError(error, OperationType.UPDATE, 'workers');
    }
  };

  const deleteWorker = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'workers', id));
      toast.success("Worker deleted");
    } catch (error) {
      toast.error("Failed to delete worker");
      handleFirestoreError(error, OperationType.DELETE, 'workers');
    }
  };

  return { workers, loading, addWorker, updateWorker, deleteWorker };
}
