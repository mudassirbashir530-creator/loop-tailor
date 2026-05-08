import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from '../lib/types';
import { toast } from 'sonner';

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'customers'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        customersData.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          totalOrders: data.totalOrders || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        });
      });
      customersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...data,
        userId: user.uid,
        totalOrders: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Customer added successfully");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to add customer");
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'customers', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      toast.success("Customer updated");
    } catch (error) {
      toast.error("Failed to update customer");
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  return { customers, loading, addCustomer, updateCustomer };
}
