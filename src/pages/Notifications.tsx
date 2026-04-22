import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, CheckCircle2, Clock, FileText, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Notifications() {
  const { notifications, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_overdue':
      case 'payment_pending':
        return <Clock className="h-5 w-5 text-rose-500" />;
      case 'order_ready':
      case 'order_delivered':
        return <CheckCircle2 className="h-5 w-5 text-[#25D366]" />;
      case 'new_order':
      case 'order_started':
      default:
        return <FileText className="h-5 w-5 text-brand-primary" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy • hh:mm a');
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.orderId) {
      navigate(`/dashboard/orders/${notification.orderId}`);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">Notification Center</h1>
          <p className="text-slate-500 mt-2 font-medium">Activity timeline and recent alerts</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => markAllRead()}
            variant="ghost"
            className="bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm rounded-xl h-11 px-5 border-none font-bold text-emerald-600"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-neu bg-gray-100 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-4 sm:p-8 space-y-4">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <div className="h-20 w-20 rounded-full bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center mx-auto mb-6">
                  <Bell className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
                <p className="text-slate-500 font-medium">No new notifications to display right now.</p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex flex-col sm:flex-row gap-4 p-5 rounded-2xl cursor-pointer transition-all border-none relative group",
                    !notification.read ? "bg-white shadow-neu-sm" : "bg-gray-100 hover:shadow-neu-sm"
                  )}
                >
                  <div className="flex items-start gap-4 flex-1">
                    {!notification.read && (
                      <div className={cn("absolute top-7 h-2.5 w-2.5 rounded-full bg-brand-primary", isRTL ? "right-2" : "left-2")} />
                    )}
                    <div className={cn(
                      "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center bg-gray-100 shadow-neu-sm",
                      !notification.read ? "ml-3" : ""
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-base font-bold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-bold text-slate-400">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.read && (
                          <span className="text-[10px] uppercase tracking-widest font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 mt-4 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-10 w-10 p-0 rounded-xl bg-gray-100 shadow-neu-sm border-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
