import React, { useState, useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { Bell, CheckCircle2, Clock, FileText, Trash2, CheckCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Notifications() {
  const { notifications, markAsRead, markAllRead, deleteNotification } = useNotifications();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Read' | 'Unread'>('All');

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
        return <FileText className="h-5 w-5 text-[#22C55E]" />;
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

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.orderId) {
      navigate(`/app/orders/${notification.orderId}`);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || n.message?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' ? true : filter === 'Read' ? n.read : !n.read;
      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchTerm, filter]);

  const grouped = useMemo(() => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const older: any[] = [];

    filteredNotifications.forEach(n => {
      const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
      if (isToday(date)) today.push(n);
      else if (isYesterday(date)) yesterday.push(n);
      else older.push(n);
    });

    return { today, yesterday, older };
  }, [filteredNotifications]);

  const renderGroup = (label: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-4">{label}</h3>
        <div className="space-y-0 relative">
          {items.map((notification, index) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "relative flex items-center gap-3 p-4 bg-white hover:bg-[#F5F7FA] transition-colors cursor-pointer border-b border-[#F8FAFC]",
                !notification.read ? "bg-[#F5F7FA]/40" : ""
              )}
            >
              {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#22C55E]" />}
              
              <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[14px] font-semibold text-[#0F172A] line-clamp-1">{notification.title}</div>
                <div className="text-[14px] font-semibold text-[#0F172A] line-clamp-1 mt-0.5">{notification.message.substring(0, Math.max(0, notification.message.indexOf(' - ') > -1 ? notification.message.indexOf(' - ') : 40))}</div>
                <div className="text-[14px] text-[#64748B] line-clamp-1 mt-0.5">{notification.message}</div>
              </div>
              
              <div className="text-[11px] text-[#64748B] whitespace-nowrap self-start mt-1">
                {formatTime(notification.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F5F7FA]">
        <button onClick={() => navigate(-1)} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Notifications</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-3 relative h-[44px] bg-[#F1F5F9] rounded-[12px] px-3">
          <Search className="h-5 w-5 text-[#64748B]" />
          <input 
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none shadow-none p-0 focus:ring-0 text-[#0F172A] text-[14px]"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-4 mb-6">
        {['All', 'Read', 'Unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
              filter === f ? "bg-[#22C55E] text-white" : "bg-white border text-[#64748B] border-[#E2E8F0]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-[#E2E8F0] mb-4" />
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">No notifications</h3>
          </div>
        ) : (
          <div className="bg-white py-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)] min-h-[50vh]">
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Older', grouped.older)}
          </div>
        )}
      </div>
    </div>
  );
}
