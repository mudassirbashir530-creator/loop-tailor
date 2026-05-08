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
      collection(db, 'customers', user.uid, 'items'),
      orderBy('createdAt', 'desc')
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
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        });
      });
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `customers/${user.uid}/items`);
    });

    return () => unsubscribe();
  }, [user]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'totalOrders'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'customers', user.uid, 'items'), {
        ...data,
        totalOrders: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Customer added successfully");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to add customer");
      handleFirestoreError(error, OperationType.CREATE, `customers/${user.uid}/items`);
    }
  };

  return { customers, loading, addCustomer };
}
