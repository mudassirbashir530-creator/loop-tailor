import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, limit, query, getDocs, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, ChevronRight, Settings, Users, PlusCircle, LayoutDashboard, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export default function QuickSetupChecklist() {
  const { user } = useAuth();
  const { settings } = useShop();
  const [isVisible, setIsVisible] = useState(false);
  const [hasCustomers, setHasCustomers] = useState(false);
  const [hasOrders, setHasOrders] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    const checkDismissed = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && !userDoc.data().checklistDismissed) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Error checking checklist status:", error);
      }
    };
    checkDismissed();
  }, [user]);

  useEffect(() => {
    if (!user || !isVisible) return;
    
    const custUnsub = onSnapshot(query(collection(db, 'shops', user.uid, 'customers'), limit(1)), (snap) => {
      setHasCustomers(!snap.empty);
    });

    const ordersUnsub = onSnapshot(query(collection(db, 'shops', user.uid, 'orders'), limit(1)), (snap) => {
      setHasOrders(!snap.empty);
    });

    return () => {
      custUnsub();
      ordersUnsub();
    };
  }, [user, isVisible]);

  const handleDismiss = async () => {
    setIsVisible(false);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        checklistDismissed: true
      });
    } catch (error) {
      console.error("Error saving checklist status:", error);
    }
  };

  if (!isVisible) return null;

  const steps = [
    { label: "Account created", isDone: true, icon: LayoutDashboard },
    { label: "Update shop settings", isDone: !!settings.phone, icon: Settings, link: "/dashboard/settings" },
    { label: "Add your first customer", isDone: hasCustomers, icon: Users, link: "/dashboard/customers" },
    { label: "Create your first order", isDone: hasOrders, icon: FileText, link: "/dashboard/orders/new" },
  ];

  const allDone = steps.every(s => s.isDone);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-8"
      >
        <div className="bg-gray-100 rounded-2xl shadow-neu p-6 border-none">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Setup Guide</h3>
            {!allDone && (
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-widest">
                {steps.filter(s => s.isDone).length} of {steps.length} completed
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div key={idx} className={cn("flex items-center justify-between p-4 rounded-xl transition-all duration-300", step.isDone ? "bg-white/50 border border-emerald-100" : "bg-white shadow-neu-sm")}>
                <div className="flex items-center gap-4">
                  <CheckCircle2 className={cn("h-6 w-6", step.isDone ? "text-brand-primary" : "text-slate-300")} />
                  <div>
                    <div className={cn("font-bold", step.isDone ? "text-slate-500 line-through decoration-slate-300 decoration-2" : "text-slate-900")}>
                      {step.label}
                    </div>
                  </div>
                </div>
                {!step.isDone && step.link && (
                  <Link to={step.link} className="text-brand-primary bg-brand-primary/10 p-2 rounded-lg hover:bg-brand-primary/20 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {allDone && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center"
            >
              <Button 
                onClick={handleDismiss} 
                className="h-12 px-8 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
              >
                🎉 You're all set! Hide this checklist
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
