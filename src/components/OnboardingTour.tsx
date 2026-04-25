import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Settings, Users, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export default function OnboardingTour() {
  const { user } = useAuth();
  const { settings } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && !userDoc.data().onboardingComplete) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    checkOnboarding();
  }, [user]);

  const handleComplete = async () => {
    setIsOpen(false);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        onboardingComplete: true
      });
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  const steps = [
    {
      title: "Welcome to Loop Tailor! 🎉",
      description: `We're thrilled to have you, ${settings.name || 'Tailor Master'}. Loop Tailor is your all-in-one app to manage your tailoring business, track orders, and keep your customers happy.`,
      icon: <span className="text-4xl text-brand-primary font-black uppercase">{settings.name?.charAt(0) || 'L'}</span>
    },
    {
      title: "Add Your Customers",
      description: "Keep all your customer's contact details and measurements in one place and access them forever.",
      icon: <Users className="h-16 w-16 text-brand-primary" />
    },
    {
      title: "Create Your First Order",
      description: "Quickly take an order with our streamlined 'Quick Order' button in the dashboard, generate tokens, and assign staff.",
      icon: <PlusCircle className="h-16 w-16 text-brand-primary" />
    },
    {
      title: "You're all set!",
      description: "Start exploring. Need help? Use the Help button at the bottom right anytime.",
      icon: <CheckCircle2 className="h-16 w-16 text-emerald-500" />
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="h-24 w-24 rounded-full bg-brand-primary/10 flex items-center justify-center mb-2">
                {steps[step].icon}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{steps[step].title}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                {steps[step].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-col gap-4">
            <div className="flex justify-center gap-2 mb-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-brand-primary' : 'w-2.5 bg-slate-200'}`} 
                />
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              {step < steps.length - 1 ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={handleComplete} 
                    className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-100 border-none"
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={() => setStep(s => s + 1)} 
                    className="flex-1 h-12 rounded-xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleComplete} 
                  className="w-full h-12 rounded-xl bg-brand-primary text-white font-black shadow-neu hover:shadow-neu-pressed transition-all"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
