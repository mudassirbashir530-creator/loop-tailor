import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { normalizePlanStatus } from '../lib/planUtils';

interface AuthContextType {
  user: User | null;
  userData: any | null;
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
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isAdmin: false,
  loading: true,
  wasLoggedIn: false,
  signIn: async () => {},
  signUp: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

import { safeStorage } from '../lib/safeStorage';

// Defined subscription plans details
export const PLAN_DETAILS = {
  basic: {
    plan: "basic" as const,
    planPrice: 500,
    planLimits: {
      customers: 50,
      ordersPerMonth: 60,
      workers: 3
    },
    features: {
      canDownloadInvoice: false,
      canUploadImages: false,
      canUseWhatsApp: false,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    }
  },
  standard: {
    plan: "standard" as const,
    planPrice: 1000,
    planLimits: {
      customers: 200,
      ordersPerMonth: 200,
      workers: 7
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: false,
      canUseWhatsApp: true,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    }
  },
  premium: {
    plan: "premium" as const,
    planPrice: 2000,
    planLimits: {
      customers: 0, // unlimited
      ordersPerMonth: 0, // unlimited
      workers: 0 // unlimited
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: true,
      canUsePayroll: true,
      canViewAnalytics: true,
      canCustomBranding: true,
      canManageWorkers: true
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wasLoggedIn, setWasLoggedIn] = useState(() => safeStorage.getItem('wasLoggedIn') === 'true');

  useEffect(() => {
    let userDataUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      
      const setupAuth = async () => {
        try {
          if (currentUser) {
            safeStorage.setItem('wasLoggedIn', 'true');
            setWasLoggedIn(true);

            if (userDataUnsub) {
              userDataUnsub();
            }

            userDataUnsub = onSnapshot(doc(db, 'users', currentUser.uid), (userDoc) => {
              const processSnapshot = async () => {
                try {
                  if (userDoc.exists()) {
                    const userDataFetched = userDoc.data();
                    
                    const now = new Date();
                    let needsUpdate = false;
                    let lastReset = userDataFetched?.currentUsage?.lastResetDate;

                    const isNewMonth = (lr: any) => {
                      if (!lr) return true;
                      let date: Date;
                      if (lr.toDate) date = lr.toDate();
                      else if (lr instanceof Date) date = lr;
                      else date = new Date(lr);
                      return date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear();
                    };

                    const migrationNeeded = !userDataFetched?.plan || !userDataFetched?.planLimits || !userDataFetched?.currentUsage;

                    if (isNewMonth(lastReset) || migrationNeeded) {
                      needsUpdate = true;
                    }

                    if (needsUpdate) {
                      const activePlan = (userDataFetched?.plan || 'basic') as 'basic' | 'standard' | 'premium';
                      const details = PLAN_DETAILS[activePlan] || PLAN_DETAILS.basic;
                      
                      const updatedFields = {
                        plan: activePlan,
                        planPrice: details.planPrice,
                        planLimits: details.planLimits,
                        features: details.features,
                        planActivatedAt: userDataFetched?.planActivatedAt || serverTimestamp(),
                        planExpiresAt: userDataFetched?.planExpiresAt || new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
                        currentUsage: {
                          customers: userDataFetched?.currentUsage?.customers ?? 0,
                          ordersThisMonth: isNewMonth(lastReset) ? 0 : (userDataFetched?.currentUsage?.ordersThisMonth ?? 0),
                          workers: userDataFetched?.currentUsage?.workers ?? 0,
                          lastResetDate: serverTimestamp()
                        }
                      };

                      await setDoc(doc(db, 'users', currentUser.uid), updatedFields, { merge: true });
                      return; // Retries process via next onSnapshot emissions
                    }

                    setUserData(userDataFetched);
                  } else {
                    setUserData(null);
                  }
                  
                  let isUserAdmin = false;
                  if (currentUser.email) {
                    try {
                      const adminDoc = await getDoc(doc(db, 'admins', currentUser.email));
                      if (adminDoc.exists() && adminDoc.data().isAdmin === true) {
                        isUserAdmin = true;
                      }
                    } catch (e) {
                      console.error("Error checking admin status", e);
                    }
                  }
                  
                  if (isUserAdmin || (currentUser.email && ["mudassirbashir530@gmail.com", "looptailor@gmail.com"].includes(currentUser.email))) {
                    if (userDoc.exists()) {
                      const userDataFetched = userDoc.data();
                      if (!userDataFetched?.isAdmin || userDataFetched?.role !== 'admin') {
                        let retries = 3;
                        while (retries > 0) {
                          try {
                            await setDoc(doc(db, 'users', currentUser.uid), {
                              role: 'admin',
                              isAdmin: true,
                              plan: 'enterprise',
                            }, { merge: true });
                            break; 
                          } catch (e) {
                            retries--;
                            if (retries === 0) {
                              console.warn("Could not auto-upgrade admin, will retry later:", e);
                            } else {
                              await new Promise(resolve => setTimeout(resolve, 1000));
                            }
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
                  console.error("Error in snapshot processing:", error);
                } finally {
                  setLoading(false);
                }
              };
              processSnapshot();
            }, (error) => {
              console.error("Error fetching user role:", error);
              setIsAdmin(false);
              setUserData(null);
              setLoading(false);
            });

          } else {
            if (userDataUnsub) {
              userDataUnsub();
              userDataUnsub = null;
            }
            safeStorage.removeItem('wasLoggedIn');
            setWasLoggedIn(false);
            setIsAdmin(false);
            setUserData(null);
            setLoading(false);
          }
        } catch (setupError) {
          console.error("Error in setupAuth:", setupError);
          setLoading(false);
        }
      };

      setupAuth();
    });

    return () => {
      unsubscribe();
      if (userDataUnsub) userDataUnsub();
    };
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
          const defaultPlan = 'basic';
          const details = PLAN_DETAILS[defaultPlan];
          const now = new Date();

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
            role: 'user',
            isAdmin: false,
            createdAt: serverTimestamp(),
            
            // New detailed fields for plans structure
            plan: defaultPlan,
            planPrice: details.planPrice,
            planLimits: details.planLimits,
            features: details.features,
            planActivatedAt: serverTimestamp(),
            planExpiresAt: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
            currentUsage: {
              customers: 0,
              ordersThisMonth: 0,
              workers: 0,
              lastResetDate: serverTimestamp()
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

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, loading, wasLoggedIn, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
