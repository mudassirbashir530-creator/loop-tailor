import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: any | null;
  userData: any | null;
  isAdmin: boolean;
  loading: boolean;
  wasLoggedIn: boolean;
  impersonatedUser: any | null;
  impersonateUser: (targetUser: any | null) => void;
  stopImpersonation: () => void;
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
    plan?: string,
    currency?: string,
    servicesOffered?: string[]
  ) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  isAdmin: false,
  loading: true,
  wasLoggedIn: false,
  impersonatedUser: null,
  impersonateUser: () => {},
  stopImpersonation: () => {},
  signIn: async () => {},
  signUp: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

import { safeStorage } from '../lib/safeStorage';

export const PLAN_DETAILS = {
  free: {
    plan: "free" as const,
    planPrice: 0,
    planLimits: {
      customers: 10,
      ordersPerMonth: 15,
      workers: 3
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
      canUseWhatsApp: false,
      canUsePayroll: false,
      canViewAnalytics: false,
      canCustomBranding: false,
      canManageWorkers: true
    }
  },
  basic: {
    plan: "basic" as const,
    planPrice: 500,
    planLimits: {
      customers: 50,
      ordersPerMonth: 60,
      workers: 3
    },
    features: {
      canDownloadInvoice: true,
      canUploadImages: true,
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
      canUploadImages: true,
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
  const [realUser, setRealUser] = useState<User | null>(null);
  const [realUserData, setRealUserData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wasLoggedIn, setWasLoggedIn] = useState(() => safeStorage.getItem('wasLoggedIn') === 'true');
  const [impersonatedUser, setImpersonatedUser] = useState<any | null>(null);

  const checkIfAdmin = async (email: string) => {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', email));
      return adminDoc.exists();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    let userDataUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      setRealUser(currentUser);
      
      const setupAuth = async () => {
        try {
          if (currentUser) {
            safeStorage.setItem('wasLoggedIn', 'true');
            setWasLoggedIn(true);

            if (userDataUnsub) {
              userDataUnsub();
            }

            const adminStatus = currentUser.email ? await checkIfAdmin(currentUser.email) : false;
            setIsAdmin(adminStatus);

            userDataUnsub = onSnapshot(doc(db, 'users', currentUser.uid), (userDoc) => {
              if (userDoc.metadata.hasPendingWrites) {
                return;
              }
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
                      if (lr?.toDate) {
                        date = lr.toDate();
                      } else if (lr?.seconds) {
                        date = new Date(lr.seconds * 1000);
                      } else {
                        date = new Date(lr);
                      }
                      if (isNaN(date.getTime())) return false; 
                      const now = new Date();
                      return date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear();
                    };

                    const migrationNeeded = !userDataFetched?.plan || !userDataFetched?.planLimits || !userDataFetched?.currentUsage;

                    if (isNewMonth(lastReset) || migrationNeeded) {
                      needsUpdate = true;
                    }

                    if (needsUpdate) {
                      const activePlan = (userDataFetched?.plan || 'free') as 'free' | 'basic' | 'standard' | 'premium';
                      const details = PLAN_DETAILS[activePlan] || PLAN_DETAILS.free;
                      
                      const updatedFields = {
                        plan: activePlan,
                        planPrice: details.planPrice,
                        planLimits: userDataFetched?.planLimits || details.planLimits,
                        features: {
                          ...details.features,
                          ...(userDataFetched?.features || {})
                        },
                        planActivatedAt: userDataFetched?.planActivatedAt || serverTimestamp(),
                        planExpiresAt: userDataFetched?.planExpiresAt || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
                        currentUsage: {
                          customers: userDataFetched?.currentUsage?.customers ?? 0,
                          ordersThisMonth: isNewMonth(lastReset) ? 0 : (userDataFetched?.currentUsage?.ordersThisMonth ?? 0),
                          workers: userDataFetched?.currentUsage?.workers ?? 0,
                          lastResetDate: serverTimestamp()
                        }
                      };

                      await setDoc(doc(db, 'users', currentUser.uid), updatedFields, { merge: true });
                      return;
                    }

                    setRealUserData(userDataFetched);
                  } else {
                    setRealUserData(null);
                  }
                  
                  const isUserAdmin = currentUser.email ? await checkIfAdmin(currentUser.email) : false;
                  
                  if (isUserAdmin) {
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
                              console.warn("Could not set admin role after retries:", e);
                            }
                            await new Promise(r => setTimeout(r, 500));
                          }
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.error("Error in processSnapshot:", err);
                } finally {
                  setLoading(false);
                }
              };

              processSnapshot();
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
              setLoading(false);
            });

          } else {
            setRealUserData(null);
            setIsAdmin(false);
            setLoading(false);
          }
        } catch (err) {
          console.error("Error in setupAuth:", err);
          setLoading(false);
        }
      };

      setupAuth();
    });

    return () => {
      unsubscribe();
      if (userDataUnsub) {
        userDataUnsub();
      }
    };
  }, []);

  // Live synchronization for impersonated user
  useEffect(() => {
    if (!impersonatedUser?.uid && !impersonatedUser?.id) return;
    const targetUid = impersonatedUser.id || impersonatedUser.uid;

    const unsubImpersonated = onSnapshot(doc(db, 'users', targetUid), (docSnap) => {
      if (docSnap.exists()) {
        const freshData = { id: docSnap.id, ...docSnap.data() };
        setImpersonatedUser((prev: any) => ({
          ...(prev || {}),
          ...freshData
        }));
      }
    }, (err) => {
      console.warn("Live impersonation listener notice:", err);
    });

    return () => unsubImpersonated();
  }, [impersonatedUser?.id, impersonatedUser?.uid]);

  const impersonateUser = (targetUser: any | null) => {
    setImpersonatedUser(targetUser);
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
  };

  // Effective user & userData (incorporating Impersonation & Real-Time Feature Merging)
  const effectiveUser = impersonatedUser ? {
    uid: impersonatedUser.id || impersonatedUser.uid,
    email: impersonatedUser.email,
    displayName: impersonatedUser.ownerName || impersonatedUser.shopName || impersonatedUser.email,
    photoURL: impersonatedUser.photoURL || null
  } : realUser;

  const targetPlanKey = (impersonatedUser?.plan || 'free') as keyof typeof PLAN_DETAILS;
  const defaultPlanFeatures = PLAN_DETAILS[targetPlanKey]?.features || PLAN_DETAILS.free.features;

  const effectiveUserData = impersonatedUser ? {
    uid: impersonatedUser.id || impersonatedUser.uid,
    email: impersonatedUser.email,
    ownerName: impersonatedUser.ownerName || '',
    phone: impersonatedUser.phone || '',
    shopName: impersonatedUser.shopName || '',
    plan: impersonatedUser.plan || 'free',
    planLimits: impersonatedUser.planLimits || PLAN_DETAILS[targetPlanKey]?.planLimits || { customers: 10, ordersPerMonth: 15, workers: 3 },
    features: {
      ...defaultPlanFeatures,
      ...(impersonatedUser.features || {})
    },
    currentUsage: impersonatedUser.currentUsage || { customers: 0, ordersThisMonth: 0, workers: 0 },
    isBlocked: impersonatedUser.isBlocked || false,
    isImpersonated: true
  } : realUserData;

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      setImpersonatedUser(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, 'auth/signin');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    pass: string, 
    name: string, 
    phone: string, 
    language: string,
    photoURL?: string,
    shopName?: string,
    shopLogoUrl?: string,
    shopAddress?: string,
    plan: string = 'free',
    currency: string = 'PKR',
    servicesOffered: string[] = []
  ) => {
    setLoading(true);
    try {
      setImpersonatedUser(null);
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // Attempt automatic sign-in to sync existing account data across browsers/devices
          try {
            await signInWithEmailAndPassword(auth, email, pass);
            return;
          } catch (signInErr: any) {
            throw new Error('An account with this email address already exists. Please sign in with your password.');
          }
        }
        throw authError;
      }

      const newAuthUser = userCredential.user;
      
      await updateProfile(newAuthUser, { 
        displayName: name,
        photoURL: photoURL || null
      });

      const selectedPlanKey = (plan && PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS]) ? plan : 'free';
      const details = PLAN_DETAILS[selectedPlanKey as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
      const now = new Date();

      const userPayload = {
        uid: newAuthUser.uid,
        email,
        ownerName: name,
        phone,
        language,
        photoURL: photoURL || null,
        plan: selectedPlanKey,
        planPrice: details.planPrice,
        planLimits: details.planLimits,
        features: details.features,
        planActivatedAt: serverTimestamp(),
        planExpiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        currentUsage: {
          customers: 0,
          ordersThisMonth: 0,
          workers: 0,
          lastResetDate: serverTimestamp()
        },
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', newAuthUser.uid), userPayload);

      const shopPayload = {
        id: newAuthUser.uid,
        ownerId: newAuthUser.uid,
        name: shopName || `${name}'s Shop`,
        phone: phone,
        address: shopAddress || '',
        logoUrl: shopLogoUrl || '',
        currency: currency || 'PKR',
        servicesOffered: servicesOffered || [],
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'shops', newAuthUser.uid), shopPayload);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'auth/signup');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setImpersonatedUser(null);
      await signOut(auth);
      safeStorage.removeItem('wasLoggedIn');
      setWasLoggedIn(false);
      setRealUser(null);
      setRealUserData(null);
      setIsAdmin(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, 'auth/logout');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser, 
      userData: effectiveUserData, 
      isAdmin, 
      loading, 
      wasLoggedIn,
      impersonatedUser,
      impersonateUser,
      stopImpersonation,
      signIn, 
      signUp, 
      logOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
