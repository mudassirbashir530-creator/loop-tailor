import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { PLANS } from '../constants/plans';

export interface UserFeatures {
  canDownloadInvoice: boolean;
  canUploadImages: boolean;
  canUseWhatsApp: boolean;
  canUsePayroll: boolean;
  canViewAnalytics: boolean;
  canCustomBranding: boolean;
  canManageWorkers: boolean;
}

export interface UserPlanLimits {
  customers: number;
  ordersPerMonth: number;
  workers: number;
}

export interface UserCurrentUsage {
  customers: number;
  ordersThisMonth: number;
  workers: number;
  lastResetDate: any;
}

export interface AdminUser {
  id: string; // userId
  uid: string;
  email: string;
  plan: 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';
  planPrice: number;
  planActivatedAt: any;
  planLimits: UserPlanLimits;
  currentUsage: UserCurrentUsage;
  features: UserFeatures;
  isBlocked: boolean;
  blockedAt: any;
  blockedReason: string;
  blockedBy: string;
  createdAt: any;
  lastActiveAt: any;
  ownerName?: string;
  phone?: string;
  shopName?: string;
  photoURL?: string;
  logoUrl?: string; // from shop
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    let shopsCache: Record<string, any> = {};

    const unsubShops = onSnapshot(collection(db, 'shops'), (shopSnap) => {
      const tempShops: Record<string, any> = {};
      shopSnap.forEach((doc) => {
        tempShops[doc.id] = doc.data();
      });
      shopsCache = tempShops;
      
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          const shop = shopsCache[user.id] || {};
          return {
            ...user,
            shopName: shop.name || user.shopName || '',
            logoUrl: shop.logoUrl || '',
          };
        })
      );
    }, (err) => {
      console.warn("Error subscribing to shops collection:", err);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const tempUsers: AdminUser[] = [];
      snap.forEach((doc) => {
        const udata = doc.data() as any;
        const shop = shopsCache[doc.id] || {};
        
        tempUsers.push({
          id: doc.id,
          uid: udata.uid || doc.id,
          email: udata.email || '',
          plan: udata.plan || 'free',
          planPrice: udata.planPrice !== undefined ? udata.planPrice : 0,
          planActivatedAt: udata.planActivatedAt || null,
          planLimits: udata.planLimits || { customers: 10, ordersPerMonth: 15, workers: 3 },
          currentUsage: udata.currentUsage || { customers: 0, ordersThisMonth: 0, workers: 0, lastResetDate: null },
          features: udata.features || {
            canDownloadInvoice: true,
            canUploadImages: true,
            canUseWhatsApp: false,
            canUsePayroll: false,
            canViewAnalytics: false,
            canCustomBranding: false,
            canManageWorkers: true,
          },
          isBlocked: udata.isBlocked || false,
          blockedAt: udata.blockedAt || null,
          blockedReason: udata.blockedReason || '',
          blockedBy: udata.blockedBy || '',
          createdAt: udata.createdAt || null,
          lastActiveAt: udata.lastActiveAt || null,
          ownerName: udata.ownerName || '',
          phone: udata.phone || '',
          shopName: shop.name || udata.shopName || '',
          photoURL: udata.photoURL || '',
          logoUrl: shop.logoUrl || '',
        });
      });
      setUsers(tempUsers);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to users collection:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => {
      unsubShops();
      unsubUsers();
    };
  }, []);

  const changeUserPlan = async (userId: string, planName: 'free' | 'basic' | 'standard' | 'premium') => {
    try {
      const config = PLANS[planName];
      if (!config) throw new Error(`Invalid plan: ${planName}`);

      const payload = {
        plan: planName,
        subscriptionPlan: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
        planPrice: config.price,
        planLimits: config.limits,
        features: config.features,
        planActivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await Promise.allSettled([
        setDoc(doc(db, 'users', userId), payload, { merge: true }),
        setDoc(doc(db, 'settings', userId), payload, { merge: true })
      ]);
      toast.success(`Plan updated to ${config.name}!`);
    } catch (err: any) {
      console.error('Error changing user plan:', err);
      toast.error('Failed to change plan: ' + err.message);
    }
  };

  const toggleUserFeature = async (userId: string, featureName: keyof UserFeatures, value: boolean) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const existingData = userDoc.exists() ? userDoc.data() : {};
      const existingFeatures = existingData.features || {
        canDownloadInvoice: true,
        canUploadImages: true,
        canUseWhatsApp: false,
        canUsePayroll: false,
        canViewAnalytics: false,
        canCustomBranding: false,
        canManageWorkers: true,
      };

      const updatedFeatures = { ...existingFeatures, [featureName]: value };

      const payload = {
        features: updatedFeatures,
        [`features.${featureName}`]: value,
        updatedAt: serverTimestamp()
      };

      await Promise.allSettled([
        setDoc(doc(db, 'users', userId), payload, { merge: true }),
        setDoc(doc(db, 'settings', userId), payload, { merge: true })
      ]);

      toast.success(`Feature '${featureName}' ${value ? 'enabled' : 'disabled'}!`);
    } catch (err: any) {
      console.error('Error toggling feature:', err);
      toast.error('Failed to save feature toggle');
    }
  };

  const saveOrderLimit = async (userId: string, newLimit: number) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const existingLimits = userDoc.exists() ? (userDoc.data().planLimits || {}) : {};
      const updatedLimits = { ...existingLimits, ordersPerMonth: newLimit };

      const payload = {
        planLimits: updatedLimits,
        'planLimits.ordersPerMonth': newLimit,
        updatedAt: serverTimestamp()
      };

      await Promise.allSettled([
        setDoc(doc(db, 'users', userId), payload, { merge: true }),
        setDoc(doc(db, 'settings', userId), payload, { merge: true })
      ]);
      toast.success('Order limit updated instantly!');
    } catch (err: any) {
      console.error('Error updating order limit:', err);
      toast.error('Failed to save limit: ' + err.message);
    }
  };

  const saveCustomerLimit = async (userId: string, newLimit: number) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const existingLimits = userDoc.exists() ? (userDoc.data().planLimits || {}) : {};
      const updatedLimits = { ...existingLimits, customers: newLimit };

      const payload = {
        planLimits: updatedLimits,
        'planLimits.customers': newLimit,
        updatedAt: serverTimestamp()
      };

      await Promise.allSettled([
        setDoc(doc(db, 'users', userId), payload, { merge: true }),
        setDoc(doc(db, 'settings', userId), payload, { merge: true })
      ]);
      toast.success('Customer limit updated instantly!');
    } catch (err: any) {
      console.error('Error updating customer limit:', err);
      toast.error('Failed to save customer limit');
    }
  };

  const saveWorkerLimit = async (userId: string, newLimit: number) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const existingLimits = userDoc.exists() ? (userDoc.data().planLimits || {}) : {};
      const updatedLimits = { ...existingLimits, workers: newLimit };

      const payload = {
        planLimits: updatedLimits,
        'planLimits.workers': newLimit,
        updatedAt: serverTimestamp()
      };

      await Promise.allSettled([
        setDoc(doc(db, 'users', userId), payload, { merge: true }),
        setDoc(doc(db, 'settings', userId), payload, { merge: true })
      ]);
      toast.success('Worker limit updated instantly!');
    } catch (err: any) {
      console.error('Error updating worker limit:', err);
      toast.error('Failed to save worker limit');
    }
  };

  const resetUsageCounter = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'currentUsage.ordersThisMonth': 0,
        'currentUsage.lastResetDate': serverTimestamp(),
      });
      toast.success('Counter reset!');
    } catch (err: any) {
      console.error('Error resetting orders count:', err);
      toast.error('Failed to reset orders counter');
    }
  };

  const blockUser = async (userId: string, reason: string, note?: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: true,
        blockedAt: serverTimestamp(),
        blockedReason: reason + (note ? `: ${note}` : ''),
        blockedBy: 'admin',
      });
      toast.success('User has been blocked!');
    } catch (err: any) {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user: ' + err.message);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isBlocked: false,
        blockedAt: null,
        blockedReason: '',
        blockedBy: '',
      });
      toast.success('User has been unblocked!');
    } catch (err: any) {
      console.error('Error unblocking user:', err);
      toast.error('Failed to unblock user: ' + err.message);
    }
  };

  const deleteUserAccount = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await deleteDoc(doc(db, 'shops', userId)).catch(() => {});
      toast.success('User account deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting user account:', err);
      toast.error('Failed to delete user account');
    }
  };

  return {
    users,
    loading,
    error,
    changeUserPlan,
    toggleUserFeature,
    saveOrderLimit,
    saveCustomerLimit,
    saveWorkerLimit,
    resetUsageCounter,
    blockUser,
    unblockUser,
    deleteUserAccount,
  };
}
