import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { normalizePlanStatus } from '../lib/planUtils';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  wasLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    language: string,
    photoURL?: string,
    shopName?: string,
    shopLogoUrl?: string,
    shopAddress?: string,
    plan?: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  wasLoggedIn: false,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wasLoggedIn, setWasLoggedIn] = useState(() => localStorage.getItem('wasLoggedIn') === 'true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('wasLoggedIn', 'true');
        setWasLoggedIn(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (currentUser.email && ["mudassirbashir530@gmail.com", "looptailor@gmail.com"].includes(currentUser.email)) {
            // Only update admin role if the document exists AND the role isn't already admin.
            // This prevents a race condition with the initial document creation in saveUserData.
            if (userDoc.exists() && (!userDoc.data()?.isAdmin || userDoc.data()?.role !== 'admin')) {
              // Retry logic for admin upgrade to prevent race conditions (Bug 3 Fix)
              let retries = 3;
              while (retries > 0) {
                try {
                  await setDoc(doc(db, 'users', currentUser.uid), {
                    role: 'admin',
                    isAdmin: true,
                    plan: 'premium',
                    subscriptionActive: true,
                    trialActive: false,
                    paymentStatus: 'paid'
                  }, { merge: true });
                  break; // Success
                } catch (e) {
                  retries--;
                  if (retries === 0) {
                    console.warn("Could not auto-upgrade admin, will retry later:", e);
                  } else {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  }
                }
              }
            }
            setIsAdmin(true);
          } else if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false);
        }
      } else {
        localStorage.removeItem('wasLoggedIn');
        setWasLoggedIn(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

    const saveUserData = async (
      user: User, 
      provider: string, 
      name?: string, 
      phone?: string, 
      language?: string,
      photoURL?: string,
      shopName?: string,
      shopLogoUrl?: string,
      shopAddress?: string,
      plan?: string
    ) => {
      // 1. Write to Users collection
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            ownerName: name || user.displayName || 'New User',
            email: user.email,
            phone: phone || '',
            shopName: shopName || 'My Tailor Shop',
            countryCode: '+92',
            photoURL: photoURL || user.photoURL || '',
            provider: provider,
            preferred_language: language || 'en',
            subscriptionPlan: plan || 'free',
            role: 'user',
            isAdmin: false,
            paymentStatus: 'not_paid',
            subscriptionActive: false,
            trialActive: true,
            trialStartDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            features: {
              cms: true,
              workerAssign: false,
              whatsapp: false,
              invoice: false,
              imageUpload: false,
              aiSuggestions: false
            }
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        throw error; // Re-throw to prevent moving to the next step if this fails
      }
  
      // 2. Initialize settings document
      try {
        const settingsRef = doc(db, 'settings', user.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
          await setDoc(settingsRef, {
            name: shopName || name || user.displayName || 'My Tailor Shop',
            phone: phone || '',
            logoUrl: shopLogoUrl || '',
            address: shopAddress || '',
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
        throw error;
      }
    };

  const signIn = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
    // Removed saveUserData call to prevent unnecessary writes and permission errors (Bug 2 Fix)
  };

  // NOTE: If you receive an 'auth/operation-not-allowed' error, you must enable 
  // "Email/Password" sign-in method in your Firebase Console under Authentication. (Bug 4 Fix)
  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    language: string = 'en',
    photoURL?: string,
    shopName?: string,
    shopLogoUrl?: string,
    shopAddress?: string,
    plan?: string
  ) => {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const profileUpdates: any = { displayName: name };
    if (photoURL) {
      profileUpdates.photoURL = photoURL;
    }
    await updateProfile(userCredential.user, profileUpdates);
    
    await saveUserData(userCredential.user, 'password', name, phone, language, photoURL, shopName, shopLogoUrl, shopAddress, plan);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, wasLoggedIn, signIn, signUp, resetPassword, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
