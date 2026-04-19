import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'stitcher' | 'cutter' | 'presser';
  createdAt?: any;
}

export function useStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStaff([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'shops', user.uid, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      setStaff(staffData.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'staff');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addStaff = async (data: Omit<StaffMember, 'id' | 'createdAt'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'shops', user.uid, 'staff'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'staff');
      throw error;
    }
  };

  const updateStaff = async (id: string, data: Partial<StaffMember>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'staff', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff/${id}`);
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'shops', user.uid, 'staff', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff/${id}`);
      throw error;
    }
  };

  return {
    staff,
    loading,
    addStaff,
    updateStaff,
    deleteStaff
  };
}
