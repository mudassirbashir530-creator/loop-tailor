import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, collection, query, updateDoc, setDoc } from 'firebase/firestore';
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
      try {
        if (orderSnap.exists()) {
          const orderData: any = { id: orderSnap.id, ...orderSnap.data() };
          setOrder(orderData);

          // Fetch Customer if exists on clients collection
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
      } catch (err) {
        console.error("Error processing order snapshot:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      setLoading(false);
    });

    // Fetch Shop Data from shops/{currentUserId} & settings/{currentUserId}
    let unsubSettings: (() => void) | null = null;
    const unsubShop = onSnapshot(doc(db, 'shops', user.uid), (shopSnap) => {
      if (unsubSettings) unsubSettings();
      
      unsubSettings = onSnapshot(doc(db, 'settings', user.uid), (settingsSnap) => {
        const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
        const shopData = shopSnap.exists() ? shopSnap.data() : {};

        // Merge: shops/{currentUserId} takes precedence as requested
        setShop({
          name: shopData.shopName || settingsData.name || 'Loop Tailor',
          phone: shopData.shopPhone || settingsData.phone || '',
          address: shopData.shopAddress || settingsData.address || '',
          email: shopData.shopEmail || user.email || '',
          logoUrl: shopData.shopLogo || settingsData.logoUrl || settingsData.shopLogo || '',
          invoiceFooter: shopData.invoiceFooter || settingsData.invoiceFooter || '',
          currency: settingsData.currency || 'PKR',
          shopName: shopData.shopName || settingsData.name || 'Loop Tailor',
          shopLogo: shopData.shopLogo || settingsData.logoUrl || settingsData.shopLogo || '',
          shopPhone: shopData.shopPhone || settingsData.phone || '',
          shopAddress: shopData.shopAddress || settingsData.address || '',
          shopEmail: shopData.shopEmail || user.email || '',
        });
      }, (err) => {
        console.error("Error fetching settings fallback for shop:", err);
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
    });

    // Fetch Payments under orders/{orderId}/payments
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
      if (unsubSettings) unsubSettings();
      unsubPayments();
    };
  }, [user, orderId]);

  // Save/Update Footer to shops/{userId}.invoiceFooter in Firestore
  const updateFooter = async (newFooter: string) => {
    if (!user) return;
    try {
      // 1. Write to shops/{currentUserId}.invoiceFooter
      await setDoc(doc(db, 'shops', user.uid), {
        invoiceFooter: newFooter
      }, { merge: true });

      // 2. Also save to settings/{user.uid}.invoiceFooter for complete backward compatibility
      await setDoc(doc(db, 'settings', user.uid), {
        invoiceFooter: newFooter
      }, { merge: true });

      toast.success('Invoice footer saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update footer');
    }
  };

  // Update order fields (notes, deliveryDate, rackLocation) in Firestore
  const updateOrderFields = async (fields: { notes?: string; deliveryDate?: any; rackLocation?: string }) => {
    if (!user || !orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), fields);
      toast.success('Order details updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update order details');
    }
  };

  return {
    order,
    shop,
    customer,
    paymentsList,
    loading,
    updateFooter,
    updateOrderFields,
  };
};
