import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeStorage } from '../lib/safeStorage';

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user has already dismissed it
      const isDismissed = safeStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check if app is already installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    safeStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 lg:bottom-8 lg:right-8 lg:left-auto lg:w-96"
      >
        <div className="bg-card border border-border shadow-2xl rounded-2xl p-4 flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-bold text-foreground">Install Loop Tailor</h3>
            <p className="text-sm text-muted-foreground leading-tight">
              Install Loop Tailor on your home screen for quick access! 📱
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="px-3">
                Dismiss
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
