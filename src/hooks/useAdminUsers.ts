import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
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
      
      // Force trigger users remap if we already have users
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
          plan: udata.plan || 'basic',
          planPrice: udata.planPrice || 500,
          planActivatedAt: udata.planActivatedAt || null,
          planLimits: udata.planLimits || { customers: 50, ordersPerMonth: 60, workers: 3 },
          currentUsage: udata.currentUsage || { customers: 0, ordersThisMonth: 0, workers: 0, lastResetDate: null },
          features: udata.features || {
            canDownloadInvoice: false,
            canUploadImages: false,
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

  const changeUserPlan = async (userId: string, planName: 'basic' | 'standard' | 'premium') => {
    try {
      const config = PLANS[planName];
      if (!config) throw new Error(`Invalid plan: ${planName}`);

      await updateDoc(doc(db, 'users', userId), {
        plan: planName,
        planPrice: config.price,
        planLimits: config.limits,
        features: config.features,
        planActivatedAt: serverTimestamp(),
      });
      toast.success('Plan updated!');
    } catch (err: any) {
      console.error('Error changing user plan:', err);
      toast.error('Failed to change plan: ' + err.message);
    }
  };

  const toggleUserFeature = async (userId: string, featureName: keyof UserFeatures, value: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        [`features.${featureName}`]: value,
      });
      toast.success('Saved!');
    } catch (err: any) {
      console.error('Error toggling feature:', err);
      toast.error('Failed to save feature toggle');
    }
  };

  const saveOrderLimit = async (userId: string, newLimit: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        'planLimits.ordersPerMonth': newLimit,
      });
      toast.success('Limit updated!');
    } catch (err: any) {
      console.error('Error updating order limit:', err);
      toast.error('Failed to save limit: ' + err.message);
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

  return {
    users,
    loading,
    error,
    changeUserPlan,
    toggleUserFeature,
    saveOrderLimit,
    resetUsageCounter,
    blockUser,
    unblockUser,
  };
}
