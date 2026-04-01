import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else if (currentUser.email === 'mudassirbashir530@gmail.com' && currentUser.emailVerified) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false);
        }
      } else {
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
          role: 'user',
          createdAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
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
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, resetPassword, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
