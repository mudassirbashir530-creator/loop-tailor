import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ADMIN_EMAILS } from '../config/adminConfig';

export function useAdminAccess() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const isUserAdmin = 
          userData?.isAdmin === true || 
          userData?.role === 'admin' ||
          (user.email && ADMIN_EMAILS.includes(user.email));

        setIsAdmin(!!isUserAdmin);
      } catch (error) {
        console.error("Error checking admin access:", error);
        
        // Fallback check
        if (user.email && ADMIN_EMAILS.includes(user.email)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}
