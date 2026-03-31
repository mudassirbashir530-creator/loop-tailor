import { useState, useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check current permission status on mount
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Only initialize messaging if we are not in a service worker context
        // and we have permission
        if ('serviceWorker' in navigator) {
          const messaging = getMessaging();
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          
          if (!vapidKey) {
            console.warn('VITE_FIREBASE_VAPID_KEY is missing. Push notifications will not work.');
            return;
          }

          try {
            const currentToken = await getToken(messaging, { vapidKey });
            
            if (currentToken) {
              setToken(currentToken);
              
              // Save token to Firestore if user is logged in
              const user = auth.currentUser;
              if (user) {
                await setDoc(doc(db, `users/${user.uid}/fcmTokens`, currentToken), {
                  token: currentToken,
                  createdAt: new Date().toISOString(),
                  device: navigator.userAgent
                }, { merge: true });
                console.log('FCM Token saved to Firestore');
              }
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
          }
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      // Handle gracefully
      console.error('Error requesting notification permission:', error);
    }
  };

  return { permission, token, requestPermission };
}
