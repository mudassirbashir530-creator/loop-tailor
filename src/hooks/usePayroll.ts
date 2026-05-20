import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface WorkerPayment {
  workerId: string;
  amountPaid: number;
  paymentDate: string;
}

export interface PayrollRecord {
  id: string;
  month: string; // Format: YYYY-MM
  status: 'open' | 'closed';
  payments: WorkerPayment[];
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export function usePayroll(month: string) {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !month) return;

    const q = query(
      collection(db, 'payroll'),
      where('userId', '==', user.uid),
      where('month', '==', month)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setPayroll({ id: docSnap.id, ...docSnap.data() } as PayrollRecord);
      } else {
        setPayroll(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'payroll');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, month]);

  const initOrUpdatePayroll = async (payments: WorkerPayment[], status: 'open' | 'closed' = 'open') => {
    if (!user) return;
    try {
      if (payroll) {
        await updateDoc(doc(db, 'payroll', payroll.id), {
          payments,
          status,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = doc(collection(db, 'payroll'));
        await setDoc(docRef, {
          month,
          status,
          payments,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'payroll');
      throw error;
    }
  };

  const lockPayroll = async () => {
    if (!payroll) return;
    try {
      await updateDoc(doc(db, 'payroll', payroll.id), {
        status: 'closed',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'payroll');
      throw error;
    }
  };

  return {
    payroll,
    loading,
    initOrUpdatePayroll,
    lockPayroll
  };
}
