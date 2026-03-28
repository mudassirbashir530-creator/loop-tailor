import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  resetPassword: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveUserData = async (user: User, provider: string, name?: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: name || user.displayName || 'New User',
          email: user.email,
          photoURL: user.photoURL || '',
          provider: provider,
          createdAt: new Date().toISOString(),
        });
      }

      // Also ensure shop document exists for backward compatibility with existing app logic
      const shopRef = doc(db, 'shops', user.uid);
      const shopSnap = await getDoc(shopRef);
      if (!shopSnap.exists()) {
        await setDoc(shopRef, {
          name: name || user.displayName || 'My Tailor Shop',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const signIn = async (email?: string, password?: string) => {
    if (email && password) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // We don't necessarily need to save data on every email login, but it's safe if it checks exists()
      await saveUserData(userCredential.user, 'password');
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const userCredential = await signInWithPopup(auth, provider);
      await saveUserData(userCredential.user, 'google');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await saveUserData(userCredential.user, 'password', name);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resetPassword, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
