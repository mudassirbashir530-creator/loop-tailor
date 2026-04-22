import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  type: string; // 'order_overdue', 'order_ready', 'payment_pending', 'new_order', 'order_started', 'order_delivered'
  title: string;
  message: string;
  orderId?: string;
  customerId?: string;
  read: boolean;
  createdAt: any;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'shops', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      let unread = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        notifs.push({ id: docSnap.id, ...data } as AppNotification);
        if (!data.read) unread++;
      });
      setNotifications(notifs);
      setUnreadCount(unread);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'shops', user.uid, 'notifications', id), {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;
      
      const batch = writeBatch(db);
      unreadNotifs.forEach(n => {
        const ref = doc(db, 'shops', user.uid, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications (batch)');
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'shops', user.uid, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const addNotification = async (data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'shops', user.uid, 'notifications'), {
        ...data,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to add notification', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    addNotification
  };
}
