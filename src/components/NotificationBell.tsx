import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, FileText, X, Trash2, Scissors, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, AppNotification } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.orderId) {
      navigate(`/dashboard/orders/${notification.orderId}`);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_overdue':
      case 'payment_pending':
      case 'payment':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'order_ready':
      case 'order_delivered':
        return <CheckCircle2 className="h-4 w-4 text-[#25D366]" />;
      case 'order_status':
      case 'new_order':
      case 'order_started':
        return <Scissors className="h-4 w-4 text-brand-primary" />;
      case 'system':
      default:
        return <Bell className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-slate-600 transition-all relative outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm border-2 border-slate-50" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute mt-4 w-80 max-sm:w-[calc(100vw-32px)] bg-gray-100 rounded-3xl shadow-neu border-none py-2 z-[60]",
              isRTL ? "left-0 max-sm:right-[-50px] max-sm:left-auto" : "right-0 max-sm:right-[-60px]"
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
              <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                  className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto px-4 py-2 space-y-2 no-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border-none relative group",
                      !notification.read ? "bg-white shadow-neu-sm" : "bg-gray-100 hover:shadow-neu-sm"
                    )}
                  >
                    {!notification.read && (
                      <div className={cn("absolute top-5 h-2 w-2 rounded-full bg-brand-primary", isRTL ? "right-2" : "left-2")} />
                    )}
                    <div className={cn(
                      "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-gray-100 shadow-neu-sm",
                      !notification.read ? "ml-2" : ""
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200/50 mt-2">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/notifications');
                }}
                className="w-full py-3 rounded-xl bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm text-sm font-bold text-brand-primary transition-all"
              >
                View full timeline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
