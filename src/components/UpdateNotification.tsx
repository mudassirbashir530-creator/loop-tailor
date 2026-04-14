import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for messages from the service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        // Find the waiting service worker
        navigator.serviceWorker.ready.then(registration => {
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdate(true);
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
              setShowUpdate(false);
            }, 10000);
          }
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Also check on initial load if there's a waiting worker
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Send message to SW to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page once the new SW takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
    setShowUpdate(false);
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm"
        >
          <div className="bg-brand-primary text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 cursor-pointer" onClick={handleUpdate}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <RefreshCw size={20} className="animate-spin-slow" />
              </div>
              <div>
                <p className="font-semibold text-sm">New update available!</p>
                <p className="text-xs text-white/80">Tap to refresh</p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowUpdate(false);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
