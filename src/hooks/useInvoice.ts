import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, getDocs, collection, query, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const useInvoice = (orderId: string | undefined) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orderId) return;

    setLoading(true);
    
    // Fetch Order
    const unsubOrder = onSnapshot(doc(db, 'orders', orderId), (orderSnap) => {
      if (orderSnap.exists() && orderSnap.data().userId === user.uid) {
        const orderData: any = { id: orderSnap.id, ...orderSnap.data() };
        setOrder(orderData);
        
        // Fetch Customer if exists
        if (orderData.customerId) {
          onSnapshot(doc(db, 'clients', orderData.customerId), (cSnap) => {
            if (cSnap.exists()) {
              setCustomer({ id: cSnap.id, ...cSnap.data() });
            }
          });
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      setLoading(false);
    });

    // Fetch Shop
    const unsubShop = onSnapshot(doc(db, 'settings', user.uid), (shopSnap) => {
      if (shopSnap.exists()) {
        setShop(shopSnap.data());
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`));

    // Fetch Payments
    const qPayments = query(collection(db, `orders/${orderId}/payments`));
    const unsubPayments = onSnapshot(qPayments, (paymentsSnap) => {
      const pData = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPaymentsList(pData.sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, `orders/${orderId}/payments`));
    
    return () => {
      unsubOrder();
      unsubShop();
      unsubPayments();
    };
  }, [user, orderId]);

  const updateFooter = async (newFooter: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'settings', user.uid), {
        invoiceFooter: newFooter
      });
      toast.success('Invoice footer updated!');
    } catch (err: any) {
      toast.error('Failed to update footer');
    }
  };

  return {
    order,
    shop,
    customer,
    paymentsList,
    loading,
    updateFooter
  };
};
