import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    shopAddress?: string
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
              if (userDoc.data()?.role !== 'admin' || !userDoc.data()?.isAdmin) {
                // Auto-fix admin role in Firestore
                await setDoc(doc(db, 'users', currentUser.uid), {
                  role: 'admin',
                  isAdmin: true,
                  plan: 'premium',
                  subscriptionActive: true,
                  trialActive: false,
                  paymentStatus: 'paid'
                }, { merge: true });
              }
              setIsAdmin(true);
            } else if (userDoc.exists() && userDoc.data().role === 'admin') {
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
    shopAddress?: string
  ) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: name || user.displayName || 'New User',
          email: user.email,
          phone: phone || '',
          photoURL: photoURL || user.photoURL || '',
          provider: provider,
          preferred_language: language || 'en',
          plan: null,
          role: 'user',
          isAdmin: false,
          paymentStatus: 'not_paid',
          subscriptionActive: false,
          trialActive: false,
          trialStartDate: null,
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

      // Also ensure shop document exists for backward compatibility with existing app logic
      const shopRef = doc(db, 'shops', user.uid);
      const shopSnap = await getDoc(shopRef);
      if (!shopSnap.exists()) {
        await setDoc(shopRef, {
          name: shopName || name || user.displayName || 'My Tailor Shop',
          phone: phone || '',
          logoUrl: shopLogoUrl || '',
          address: shopAddress || '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await saveUserData(userCredential.user, 'password');
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    language: string = 'en',
    photoURL?: string,
    shopName?: string,
    shopLogoUrl?: string,
    shopAddress?: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const profileUpdates: any = { displayName: name };
    if (photoURL) {
      profileUpdates.photoURL = photoURL;
    }
    await updateProfile(userCredential.user, profileUpdates);
    
    await saveUserData(userCredential.user, 'password', name, phone, language, photoURL, shopName, shopLogoUrl, shopAddress);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send verification code');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, wasLoggedIn, signIn, signUp, resetPassword, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
