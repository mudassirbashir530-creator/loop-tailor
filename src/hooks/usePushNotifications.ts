import { useState, useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check current permission status on mount
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('This browser does not support desktop notification');
        return;
      }

      setIsLoading(true);

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Only initialize messaging if we are not in a service worker context
        // and we have permission
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          } catch (e) {
            console.error('Service worker registration failed:', e);
          }

          const messaging = getMessaging();
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          
          if (!vapidKey) {
            console.warn('VITE_FIREBASE_VAPID_KEY is missing. Push notifications might not work natively if required by FCM.');
            // We proceed anyway to see if basic notifications still generate or if they fallback.
          }

          try {
            const currentToken = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
            
            if (currentToken) {
              setToken(currentToken);
              
              // Save token to Firestore if user is logged in
              const user = auth.currentUser;
              if (user) {
                await setDoc(doc(db, `shops/${user.uid}/fcmTokens`, currentToken), {
                  token: currentToken,
                  createdAt: new Date().toISOString(),
                  device: navigator.userAgent
                }, { merge: true });
                toast.success('Push notifications enabled!');
                console.log('FCM Token saved to Firestore');
              }
            } else {
              toast.error('No registration token available. Request permission to generate one.');
              console.log('No registration token available. Request permission to generate one.');
            }
          } catch (err) {
            toast.error('An error occurred while retrieving token.');
            console.log('An error occurred while retrieving token. ', err);
          }
        }
      } else {
        toast.error('Permission denied to receive push notifications.');
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      // Handle gracefully
      toast.error('Error requesting notification permission.');
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { permission, token, isLoading, requestPermission };
}
