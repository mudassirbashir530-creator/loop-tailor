import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Bell } from 'lucide-react';

interface ToastNotification {
  id: string;
  senderName: string;
  text: string;
  channelId: string;
}

interface NotificationContextType {
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
  showManualNotification: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  activeChannelId: null,
  setActiveChannelId: () => {},
  showManualNotification: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

// Purified audio tone synthesizer using Web Audio API to bypass asset file fetching failures
const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play first warm chime node (C5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.3);

    // Play second warm chime node (E5 chord accent)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 80);
  } catch (error) {
    console.debug('Audio context autoplay rule blocked feedback chime:', error);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Keep track of the initial mount timestamp to ignore old historical messages
  const mountedAt = useRef<number>(Date.now());
  const previousChannelStates = useRef<Record<string, { lastMessageTime: number; unreadCount: number }>>({});

  useEffect(() => {
    if (!user) {
      previousChannelStates.current = {};
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('shopId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const docId = change.doc.id;

        if (!data) return;

        const lastMessageTime = data.lastMessageTime || 0;
        const lastMessageText = data.lastMessageText || '';
        const unreadCount = data.unreadCount || 0;
        const customerName = data.customerName || 'Customer';

        const lastKnown = previousChannelStates.current[docId];

        // Ensure we only notify for:
        // 1. Messages received AFTER the provider has successfully mounted.
        // 2. Unread count has increased OR lastMessageTime is newer than what we knew.
        // 3. The current route path is NOT already that active chat room.
        // 4. We suppress notifications for messages that are sent by the tailor themselves (shopId of tailor matches creator, but we verify active role).
        // Since we only trigger unreadCount increments for customer messages, a positive unreadCount is the key.
        const pathMatchesActiveChat = location.pathname === `/app/chat/${docId}` || activeChannelId === docId;

        if (
          lastMessageTime > mountedAt.current &&
          (!lastKnown || lastMessageTime > lastKnown.lastMessageTime) &&
          unreadCount > (lastKnown?.unreadCount || 0) &&
          unreadCount > 0
        ) {
          if (!pathMatchesActiveChat) {
            // Trigger beautiful customized toast
            const toastId = `${docId}_${lastMessageTime}`;
            
            setToasts((prev) => [
              ...prev.filter(t => t.channelId !== docId), // avoid duplicates of same channel
              {
                id: toastId,
                senderName: customerName,
                text: lastMessageText,
                channelId: docId,
              }
            ]);

            // Sounds & HTML5 alerts
            playChime();

            // Background Tab visibility triggers
            if (document.hidden) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${customerName}`, {
                  body: lastMessageText,
                  icon: '/icon.png'
                });
              }
            }

            // Timeout to auto-remove toast after 5 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 6000);
          } else {
            // Suppressed toast because user is actively chatting, just play a subtle click of incoming text
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.08);
            } catch (e) {}
          }
        }

        // Cache the latest values
        previousChannelStates.current[docId] = {
          lastMessageTime,
          unreadCount,
        };
      });
    }, (error) => {
      console.warn("Notification listener blocked or errored:", error);
    });

    return () => unsubscribe();
  }, [user, location.pathname, activeChannelId]);

  // Request browser permission for system native fallback notifications when tab is hidden
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const showManualNotification = (title: string, message: string) => {
    // Allows other parts of application to throw premium alert updates
    const toastId = `manual_${Date.now()}`;
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        senderName: title,
        text: message,
        channelId: '',
      }
    ]);
    playChime();
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ activeChannelId, setActiveChannelId, showManualNotification }}>
      {children}

      {/* Floating Dynamic Stack of Toast notifications */}
      <div className="fixed z-[100] top-4 left-4 right-4 md:right-4 md:left-auto md:w-[380px] pointer-events-none flex flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full bg-slate-900 border border-slate-800 text-white shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-2xl p-4 flex gap-3 pointer-events-auto cursor-pointer select-none hover:bg-slate-800 transition-colors"
              onClick={() => {
                if (toast.channelId) {
                  navigate(`/app/chat/${toast.channelId}`);
                }
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
            >
              <div className="bg-primary/20 text-accent h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-accent/10">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-tight text-slate-100">{toast.senderName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 pr-2 leading-relaxed">
                  {toast.text}
                </p>
                <div className="pt-1 flex items-center gap-1">
                  <span className="text-[10px] font-medium text-emerald-400">Tap to answer</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
