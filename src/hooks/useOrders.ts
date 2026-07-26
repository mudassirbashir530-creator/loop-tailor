import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, setDoc, updateDoc, doc, getDoc, serverTimestamp, increment, orderBy } from 'firebase/firestore';
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
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data) {
          const item: Order = {
            id: docSnap.id,
            customerId: data.customerId || '',
            customerName: data.customerName || 'Unnamed',
            customerPhone: data.customerPhone || '',
            workerId: data.workerId || '',
            workerName: data.workerName || '',
            status: data.status || 'pending',
            clothingType: data.clothingType || '',
            measurements: data.measurements || {},
            referenceImages: data.referenceImages || [],
            designImages: data.designImages || [],
            referencePhotoUrl: data.referencePhotoUrl || '',
            sampleDesignUrl: data.sampleDesignUrl || '',
            invoiceImage: data.invoiceImage || null,
            designNotes: data.designNotes || '',
            price: data.price || 0,
            advancePayment: data.advancePayment || 0,
            remainingPayment: data.remainingPayment || 0,
            deliveryDate: data.deliveryDate || '',
            tokenId: data.tokenId || `T-${docSnap.id.slice(0, 6).toUpperCase()}`,
            createdBy: data.createdBy || data.userId || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          };
          ordersData.push(item);

          // Background auto sync to publicOrders and REST API for universal worker access
          setDoc(doc(db, 'publicOrders', docSnap.id), data, { merge: true }).catch(() => {});
          fetch('/api/db/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: docSnap.id, ...data })
          }).catch(() => {});
        }
      });

      ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user) return null;
    try {
      const orderDocRef = doc(collection(db, 'orders'));
      const tokenId = `T-${orderDocRef.id.slice(0, 6).toUpperCase()}`;
      
      const payload = {
        ...orderData,
        id: orderDocRef.id,
        tokenId,
        userId: user.uid,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(orderDocRef, payload);

      // Also set publicOrders collection for universal worker access
      await setDoc(doc(db, 'publicOrders', orderDocRef.id), payload, { merge: true }).catch(() => {});

      // Sync to MongoDB server database for fallback
      await fetch('/api/db/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          id: orderDocRef.id,
          _id: orderDocRef.id,
          tokenId,
          userId: user.uid,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }).catch(() => {});

      // Update customer totalOrders
      if (orderData.customerId) {
        await updateDoc(doc(db, 'customers', orderData.customerId), {
          totalOrders: increment(1)
        }).catch(() => {});
      }

      // Update worker activeOrders
      if (orderData.workerId) {
        await updateDoc(doc(db, 'workers', orderData.workerId), {
          activeOrders: increment(1)
        }).catch(() => {});
      }

      toast.success("Order created successfully");
      return orderDocRef.id;
    } catch (error) {
      toast.error("Failed to create order");
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
     if (!user) return;
     try {
       const orderRef = doc(db, 'orders', orderId);
       const orderSnap = await getDoc(orderRef);
       const previousData = orderSnap.data();
       const previousStatus = previousData?.status;
       const workerId = previousData?.workerId;

       await updateDoc(orderRef, {
         status,
         updatedAt: serverTimestamp()
       });

       await setDoc(doc(db, 'publicOrders', orderId), {
         status,
         updatedAt: serverTimestamp()
       }, { merge: true }).catch(() => {});

       await fetch(`/api/public/worker-order/${orderId}/status`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status })
       }).catch(() => {});

       // Update worker stats if status changed
       if (workerId && previousStatus !== status) {
         const workerRef = doc(db, 'workers', workerId);
         
         const terminalStates = ['delivered', 'completed', 'ready'];
         const isActive = (s: string) => !terminalStates.includes(s) && s !== 'cancelled';
         const isTerminal = (s: string) => terminalStates.includes(s);

         if (isActive(previousStatus) && isTerminal(status)) {
           const updates: any = {
             activeOrders: increment(-1),
             completedOrders: increment(1)
           };

           const workerSnap = await getDoc(workerRef);
           const workerData = workerSnap.data();
           if (workerData?.salaryType === 'per_order' || workerData?.salaryType === 'per_suit' || workerData?.salaryType === 'per-order') {
             updates.totalEarnings = increment(workerData.salaryAmount || 0);
           }

           await updateDoc(workerRef, updates);
         } else if (isActive(previousStatus) && status === 'cancelled') {
           await updateDoc(workerRef, {
             activeOrders: increment(-1)
           });
         } else if (isTerminal(previousStatus) && isActive(status)) {
           await updateDoc(workerRef, {
             activeOrders: increment(1),
             completedOrders: increment(-1)
           });
         }
       }

       toast.success("Status updated");
     } catch (error) {
       toast.error("Failed to update status");
       handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
     }
  }

  return { orders, loading, addOrder, updateOrderStatus };
}
