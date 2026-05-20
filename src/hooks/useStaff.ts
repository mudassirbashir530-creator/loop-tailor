import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'Cutter' | 'Stitcher' | 'Finisher' | 'Other' | 'tailor' | 'master' | 'helper' | 'cutter' | 'embroidery' | 'other';
  salaryType: 'fixed' | 'per-order' | 'monthly' | 'per_suit' | 'per_order';
  salaryAmount: number;
  userId?: string;
  createdAt?: any;
}

export function useStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(collection(db, 'workers'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let mappedRole = data.role || 'tailor';
        if (mappedRole === 'Cutter') mappedRole = 'cutter';
        if (mappedRole === 'Stitcher') mappedRole = 'tailor';
        if (mappedRole === 'Finisher') mappedRole = 'helper';
        if (mappedRole === 'Other') mappedRole = 'other';

        let mappedSalaryType = data.salaryType || 'monthly';
        if (mappedSalaryType === 'fixed') mappedSalaryType = 'monthly';
        if (mappedSalaryType === 'per-order') mappedSalaryType = 'per_suit';
        if (mappedSalaryType === 'per_order') mappedSalaryType = 'per_suit';

        return {
          id: docSnap.id,
          ...data,
          role: mappedRole,
          salaryType: mappedSalaryType,
          name: data.name || 'Unnamed Worker',
          phone: data.phone || '',
          salaryAmount: data.salaryAmount || 0,
        };
      }) as StaffMember[];
      setStaff(staffData.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'workers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addStaff = async (data: Omit<StaffMember, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return null;
    try {
      let mappedSalaryType = data.salaryType;
      if (mappedSalaryType === 'fixed') mappedSalaryType = 'monthly';
      if (mappedSalaryType === 'per-order') mappedSalaryType = 'per_suit';

      let mappedRole = data.role;
      if (mappedRole === 'Cutter') mappedRole = 'cutter';
      if (mappedRole === 'Stitcher') mappedRole = 'tailor';
      if (mappedRole === 'Finisher') mappedRole = 'helper';
      if (mappedRole === 'Other') mappedRole = 'other';

      const docRef = await addDoc(collection(db, 'workers'), {
        ...data,
        role: mappedRole,
        salaryType: mappedSalaryType,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workers');
      throw error;
    }
  };

  const updateStaff = async (id: string, data: Partial<StaffMember>) => {
    if (!user) return;
    try {
      const dataToSave = { ...data };
      if (dataToSave.salaryType === 'fixed') dataToSave.salaryType = 'monthly';
      if (dataToSave.salaryType === 'per-order') dataToSave.salaryType = 'per_suit';
      
      if (dataToSave.role === 'Cutter') dataToSave.role = 'cutter';
      if (dataToSave.role === 'Stitcher') dataToSave.role = 'tailor';
      if (dataToSave.role === 'Finisher') dataToSave.role = 'helper';
      if (dataToSave.role === 'Other') dataToSave.role = 'other';

      await updateDoc(doc(db, 'workers', id), dataToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workers/${id}`);
      throw error;
    }
  };

  const deleteStaff = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'workers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workers/${id}`);
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
