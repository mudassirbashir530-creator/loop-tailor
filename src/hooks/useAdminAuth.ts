import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        try {
          if (!currentUser.email) {
            setIsAdmin(false);
            setLoading(false);
            return;
          }
          // Part 1: admins/{user.email} → if exists = admin
          const adminDocRef = doc(db, 'admins', currentUser.email);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            setIsAdmin(true);
          } else {
            // Fallback checking for user email in metadata to prevent lock out during testing
            if (['looptailor@gmail.com', 'mudassirbashir530@gmail.com'].includes(currentUser.email)) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } catch (err: any) {
          console.error("Error checking admin auth:", err);
          setError(err.message);
          if (currentUser.email && ['looptailor@gmail.com', 'mudassirbashir530@gmail.com'].includes(currentUser.email)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading, error };
}
