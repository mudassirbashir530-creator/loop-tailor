import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeSessionGetItem, safeSessionSetItem } from '../utils/storage';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    // 2. Check if user already dismissed it this session
    const hasDismissed = safeSessionGetItem('installPromptDismissed') === 'true';

    if (isStandalone || hasDismissed) {
      return;
    }

    // 3. Detect iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Handle Android (Chrome) beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Show prompt after 3 seconds delay
    const timer = setTimeout(() => {
      // Show if it's iOS OR if we caught the Android prompt
      // (Note: Android prompt might fire after 3s, so we rely on the state update below if needed,
      // but typically it fires very quickly on load)
      setIsVisible(true); 
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  // If it's Android but we haven't received the prompt event yet, don't show just yet
  // (unless we are just waiting for the 3s timer)
  useEffect(() => {
    if (isVisible && !isIOS && !deferredPrompt) {
      // On Android, if we don't have the prompt, we can't install. 
      // It might be already installed or not supported.
      setIsVisible(false);
    }
  }, [isVisible, isIOS, deferredPrompt]);

  const handleDismiss = () => {
    setIsVisible(false);
    safeSessionSetItem('installPromptDismissed', 'true');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <img src="/icon-192x192.svg" alt="Loop Tailor Logo" className="w-14 h-14 rounded-xl shadow-sm" />
            
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg">Loop Tailor</h3>
              
              {isIOS ? (
                <div className="mt-1 text-sm text-slate-600 space-y-2">
                  <p>Install this app on your iPhone for quick access:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Tap the <Share className="inline w-4 h-4 mx-1" /> Share button below</li>
                    <li>Select <strong>Add to Home Screen</strong> <PlusSquare className="inline w-4 h-4 mx-1" /></li>
                  </ol>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mt-1">
                    Install our app for a faster, better experience!
                  </p>
                  <Button 
                    onClick={handleInstall} 
                    className="w-full mt-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl"
                  >
                    Install App
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
