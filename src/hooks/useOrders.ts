import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, OrderStatus } from '../lib/types';
import { toast } from 'sonner';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders', user.uid, 'items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          workerId: data.workerId,
          workerName: data.workerName,
          status: data.status,
          clothingType: data.clothingType,
          measurements: data.measurements || {},
          designNotes: data.designNotes || '',
          price: data.price || 0,
          advancePayment: data.advancePayment || 0,
          remainingPayment: data.remainingPayment || 0,
          deliveryDate: data.deliveryDate,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `orders/${user.uid}/items`);
    });

    return () => unsubscribe();
  }, [user]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;
    try {
      const docRef = await addDoc(collection(db, 'orders', user.uid, 'items'), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update customer totalOrders
      if (orderData.customerId) {
        await updateDoc(doc(db, 'customers', user.uid, 'items', orderData.customerId), {
          totalOrders: increment(1)
        });
      }

      toast.success("Order created successfully");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to create order");
      handleFirestoreError(error, OperationType.CREATE, `orders/${user.uid}/items`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
     if (!user) return;
     try {
       await updateDoc(doc(db, 'orders', user.uid, 'items', orderId), {
         status,
         updatedAt: serverTimestamp()
       });
       toast.success("Status updated");
     } catch (error) {
       toast.error("Failed to update status");
       handleFirestoreError(error, OperationType.UPDATE, `orders/${user.uid}/items/${orderId}`);
     }
  }

  return { orders, loading, addOrder, updateOrderStatus };
}
