import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface PlanLimits {
  customers: number;
  ordersPerMonth: number;
  workers: number;
}

export interface PlanUsage {
  customers: number;
  ordersThisMonth: number;
  workers: number;
}

export interface PlanFeatures {
  canDownloadInvoice: boolean;
  canUploadImages: boolean;
  canUseWhatsApp: boolean;
  canUsePayroll: boolean;
  canViewAnalytics: boolean;
  canCustomBranding: boolean;
  canManageWorkers: boolean;
}

export function usePlanLimits() {
  const { user, userData } = useAuth();
  
  const [usage, setUsage] = useState<PlanUsage>({
    customers: 0,
    ordersThisMonth: 0,
    workers: 0
  });

  const plan = userData?.plan || 'basic';
  
  const limits: PlanLimits = userData?.planLimits || {
    customers: 50,
    ordersPerMonth: 60,
    workers: 3
  };

  // Setup real-time listeners to dynamic collections to track usage accurately
  useEffect(() => {
    if (!user) return;

    // 1. Customer listener
    const customersQuery = query(
      collection(db, 'customers'),
      where('userId', '==', user.uid)
    );
    const unsubscribeCustomers = onSnapshot(customersQuery, (snap) => {
      setUsage(prev => ({ ...prev, customers: snap.size }));
    });

    // 2. Workers listener
    const workersQuery = query(
      collection(db, 'workers'),
      where('userId', '==', user.uid)
    );
    const unsubscribeWorkers = onSnapshot(workersQuery, (snap) => {
      setUsage(prev => ({ ...prev, workers: snap.size }));
    });

    // 3. Orders list to count monthly orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    
    // Check if within current month
    const now = new Date();
    const unsubscribeOrders = onSnapshot(ordersQuery, (snap) => {
      let monthlyCount = 0;
      snap.forEach((doc) => {
        const data = doc.data();
        let orderDate: Date | null = null;
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            orderDate = data.createdAt.toDate();
          } else if (data.createdAt && typeof data.createdAt === 'object' && 'seconds' in data.createdAt) {
            orderDate = new Date(data.createdAt.seconds * 1000);
          } else {
            orderDate = new Date(data.createdAt);
          }
        }
        if (orderDate && 
            !isNaN(orderDate.getTime()) &&
            orderDate.getMonth() === now.getMonth() && 
            orderDate.getFullYear() === now.getFullYear()) {
          monthlyCount++;
        }
      });
      setUsage(prev => ({ ...prev, ordersThisMonth: monthlyCount }));
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeWorkers();
      unsubscribeOrders();
    };
  }, [user]);

  // Synchronize dynamic counted usages back to the Firestore user profile for offline/server reference
  useEffect(() => {
    if (!user || !userData) return;
    
    const dbCustomers = userData.currentUsage?.customers ?? -1;
    const dbOrders = userData.currentUsage?.ordersThisMonth ?? -1;
    const dbWorkers = userData.currentUsage?.workers ?? -1;

    // Prevent endless state sync loops by updating only if there's a difference
    if (usage.customers !== dbCustomers || 
        usage.ordersThisMonth !== dbOrders || 
        usage.workers !== dbWorkers) {
      
      const updateProfileUsage = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            currentUsage: {
              ...userData.currentUsage,
              customers: usage.customers,
              ordersThisMonth: usage.ordersThisMonth,
              workers: usage.workers,
              lastResetDate: userData.currentUsage?.lastResetDate || new Date()
            }
          }, { merge: true });
        } catch (err) {
          console.error("Error updating user usage structure: ", err);
        }
      };

      // Slight timeout to debounce and allow collections to stabilize
      const timer = setTimeout(updateProfileUsage, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, userData, usage]);

  const canAddCustomer = limits.customers === 0 || usage.customers < limits.customers;
  
  // Monthly reset failure safety
  const now = new Date();
  let hasMonthChanged = false;
  const lr = userData?.currentUsage?.lastResetDate;
  if (lr) {
    let date: Date;
    if (typeof lr.toDate === 'function') {
      date = lr.toDate();
    } else if (lr instanceof Date) {
      date = lr;
    } else if (lr && typeof lr === 'object' && 'seconds' in lr) {
      date = new Date(lr.seconds * 1000);
    } else {
      date = new Date(lr);
    }
    
    if (!isNaN(date.getTime())) {
      hasMonthChanged = date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear();
    } else {
      hasMonthChanged = true;
    }
  }

  const effectiveOrdersCount = hasMonthChanged ? 0 : usage.ordersThisMonth;
  const canAddOrder = limits.ordersPerMonth === 0 || effectiveOrdersCount < limits.ordersPerMonth;
  const canAddWorker = limits.workers === 0 || usage.workers < limits.workers;

  const customersRemaining = limits.customers === 0 ? Infinity : Math.max(0, limits.customers - usage.customers);
  const ordersRemaining = limits.ordersPerMonth === 0 ? Infinity : Math.max(0, limits.ordersPerMonth - effectiveOrdersCount);
  const workersRemaining = limits.workers === 0 ? Infinity : Math.max(0, limits.workers - usage.workers);

  const isLimitReached = useCallback((type: 'customers' | 'orders' | 'workers') => {
    if (type === 'customers') return !canAddCustomer;
    if (type === 'orders') return !canAddOrder;
    if (type === 'workers') return !canAddWorker;
    return false;
  }, [canAddCustomer, canAddOrder, canAddWorker]);

  const refreshUsage = useCallback(() => {
    // Already synced using real-time onSnapshot listeners, but provides a placeholder method for interface compatibility
  }, []);

  const safePercent = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  };

  const usagePercent = {
    customers: safePercent(usage.customers, limits.customers),
    orders: safePercent(effectiveOrdersCount, limits.ordersPerMonth),
    workers: safePercent(usage.workers, limits.workers)
  };

  return {
    plan,
    limits,
    usage: {
      ...usage,
      ordersThisMonth: effectiveOrdersCount
    },
    usagePercent,
    canAddCustomer,
    canAddOrder,
    canAddWorker,
    customersRemaining,
    ordersRemaining,
    workersRemaining,
    isLimitReached,
    refreshUsage
  };
}
