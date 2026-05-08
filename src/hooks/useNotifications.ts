import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, messaging, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';

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
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
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

  const requestPermission = async () => {
    if (!user || !messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
           // Providing VAPID key is necessary for some environments, but we'll try without it if the sw works.
        });
        if (token) {
          await setDoc(doc(db, 'fcmTokens', token), {
            token,
            userId: user.uid,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
  };

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
       toast.success(`${payload.notification?.title}: ${payload.notification?.body}`);
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), {
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
        const ref = doc(db, 'notifications', n.id);
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
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const addNotification = async (data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        userId: user.uid,
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
