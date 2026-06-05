import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Check, CheckCheck, Ruler, Scissors, Phone, MessageSquare, 
  ChevronLeft, ArrowLeft, Search, Plus, User, Info, FileText, Bot, Sparkles, X, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { useCustomers } from '../hooks/useCustomers';
import { useOrders } from '../hooks/useOrders';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNotifications } from '../components/NotificationProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export default function Chat() {
  const { customerId: routeCustomerId } = useParams<{ customerId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { setActiveChannelId } = useNotifications();
  const { customers, loading: customersLoading } = useCustomers();
  const { orders } = useOrders();

  // Selected channel / customer ID
  const activeCustomerId = routeCustomerId || '';
  
  // Initialize useChat hooks
  const { 
    channels, 
    channelsLoading, 
    messages, 
    messagesLoading, 
    sendMessage, 
    markAsRead, 
    getOrCreateChannel,
    simulateCustomerResponse 
  } = useChat(activeCustomerId);

  // Filter/search active channels list
  const [channelsSearch, setChannelsSearch] = useState('');
  
  // Measurement drawer toggle
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [customerMeasurements, setCustomerMeasurements] = useState<any | null>(null);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  // New Chat modal toggle
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState<string | null>(null);

  // Input states
  const [inputText, setInputText] = useState('');
  const [simulatedInputText, setSimulatedInputText] = useState('');
  const [isSimulatingReply, setIsSimulatingReply] = useState(false);

  // Auto Scroll references
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Set active channel in context for toast suppression
  useEffect(() => {
    setActiveChannelId(activeCustomerId || null);
    if (activeCustomerId) {
      markAsRead(activeCustomerId);
    }
    return () => setActiveChannelId(null);
  }, [activeCustomerId, setActiveChannelId, markAsRead]);

  // Fetch measurements for the selected customer
  useEffect(() => {
    if (!activeCustomerId) {
      setCustomerMeasurements(null);
      return;
    }

    const fetchMeasurements = async () => {
      setMeasurementsLoading(true);
      try {
        const docRef = doc(db, 'measurements', activeCustomerId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCustomerMeasurements(snap.data());
        } else {
          setCustomerMeasurements(null);
        }
      } catch (e) {
        console.warn("Failed to load customer measurements:", e);
      } finally {
        setMeasurementsLoading(false);
      }
    };

    fetchMeasurements();
  }, [activeCustomerId]);

  // Auto Scroll to bottom of message thread
  useEffect(() => {
    if (threadScrollRef.current) {
      threadScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesLoading]);

  // Handle typing height expand
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Pre-coded contextual templates to speed up operations
  const quickTemplates = [
    { label: '📏 Request Sizes', text: 'Slam, hope you are doing well! Could you please provide your latest Shalwar Kameez measurements so we can proceed with your design?' },
    { label: '📍 Ready for Fitting', text: 'Your dress fits and baseline cutting are ready! Please visit the shop for a quick fitting trial.' },
    { label: '🎉 Order Completed', text: 'Great news! Your tailored outfit (Suit) is ready for pickup. Please collect it at your earliest convenience. Thank you!' },
    { label: '💰 Advance Payment', text: 'Requesting a quick update: Please submit an advance deposit for your active tailoring order.' }
  ];

  // Helper to append templates
  const handleApplyTemplate = (text: string) => {
    setInputText(text);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  // Sending the message
  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  // Active customer search
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => 
      ch.customerName.toLowerCase().includes(channelsSearch.toLowerCase())
    );
  }, [channels, channelsSearch]);

  // Customers for new chats
  const filteredNewChatCustomers = useMemo(() => {
    return customers.filter(cust => 
      cust.name.toLowerCase().includes(newChatSearch.toLowerCase()) &&
      !channels.some(ch => ch.id === cust.id)
    );
  }, [customers, channels, newChatSearch]);

  // Selected customer profile metadata
  const currentCustomerMeta = useMemo(() => {
    return customers.find(c => c.id === activeCustomerId);
  }, [customers, activeCustomerId]);

  // Selected customer active orders
  const currentCustomerOrders = useMemo(() => {
    return orders.filter(o => o.customerId === activeCustomerId && o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders, activeCustomerId]);

  // Handle trigger new chat
  const handleStartNewChat = async (cust: any) => {
    if (isCreatingChat) return;
    setIsCreatingChat(cust.id);
    const toastId = toast.loading(`Starting chat with ${cust.name}...`);
    try {
      const cid = await getOrCreateChannel(cust);
      if (cid) {
        setIsNewChatOpen(false);
        setNewChatSearch('');
        toast.success(`Chat started with ${cust.name}!`, { id: toastId });
        navigate(`/app/chat/${cid}`);
      } else {
        toast.error(`Could not start chat`, { id: toastId });
      }
    } catch (err) {
      console.error("Error creating chat channel:", err);
      toast.error(`Error starting chat: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      setIsCreatingChat(null);
    }
  };

  // Trigger simulated client response
  const triggerSimulatedReply = () => {
    if (!simulatedInputText.trim()) return;
    setIsSimulatingReply(true);
    
    const replyMsg = simulatedInputText.trim();
    setSimulatedInputText('');

    toast.promise(
      new Promise<void>((resolve) => {
        setTimeout(async () => {
          await simulateCustomerResponse(replyMsg);
          setIsSimulatingReply(false);
          resolve();
        }, 1500);
      }),
      {
        loading: 'Customer is typing...',
        success: 'Message received!',
        error: 'Failed to simulate respond',
      }
    );
  };

  // Convert millis to readable hour
  const formatTime = (timeMs: number) => {
    return new Date(timeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-72px)] lg:h-screen flex bg-[#F8F7F4] overflow-hidden">
      
      {/* 1. SIDEBAR: Channels List (Hidden on mobile when chat is active) */}
      <div className={`w-full lg:w-[360px] border-r border-[#EBE9E2] flex flex-col bg-white shrink-0 ${activeCustomerId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#EBE9E2] space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Active Chats</h1>
            <Button 
              size="sm" 
              className="rounded-full bg-slate-900 border-none text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer font-bold px-3 py-1.5 text-xs h-[36px]"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="h-4 w-4" /> Client Chat
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              className="pl-9 h-[40px] bg-[#F8F7F4] border-none rounded-xl focus:ring-1 focus:ring-slate-300 text-sm"
              value={channelsSearch}
              onChange={(e) => setChannelsSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Channels Inner List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F1EFEB]">
          {channelsLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Clock className="h-8 w-8 animate-spin text-slate-300" />
              <span className="text-xs">Loading conversations...</span>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#F5F2EC] flex items-center justify-center text-slate-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No active chats yet</p>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto">Click &apos;Client Chat&apos; above to start a conversation with any registered vendor or customer.</p>
            </div>
          ) : (
            filteredChannels.map((chan) => {
              const active = chan.id === activeCustomerId;
              return (
                <div
                  key={chan.id}
                  onClick={() => navigate(`/app/chat/${chan.id}`)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors relative hover:bg-[#FAF9F6] ${active ? 'bg-slate-50 border-l-4 border-slate-950' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 font-bold font-sans uppercase">
                    {chan.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800 truncate leading-tight">{chan.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{formatTime(chan.lastMessageTime)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1">{chan.lastMessageText}</p>
                  </div>
                  {/* Unread badge */}
                  {chan.unreadCount > 0 && (
                    <span className="absolute right-4 bottom-4 h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
                      {chan.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CHAT WORKSPACE (Takes full screen on mobile when active) */}
      <div className={`flex-1 flex flex-col bg-[#F3F1EC] relative ${!activeCustomerId ? 'hidden lg:flex justify-center items-center p-12 text-center' : 'flex'}`}>
        {activeCustomerId ? (
          <>
            {/* Header */}
            <div className="h-[64px] shrink-0 bg-white border-b border-[#EBE9E2] flex items-center justify-between px-4 z-10 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => navigate('/app/chat')}
                  className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-sm uppercase">
                  {currentCustomerMeta?.name?.charAt(0) || '?'}
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-bold text-sm text-slate-800 leading-tight truncate">{currentCustomerMeta?.name || 'Loading customer...'}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate font-medium">
                    <Phone className="h-3 w-3" />
                    <span>{currentCustomerMeta?.phone || 'No phone'}</span>
                    {currentCustomerOrders.length > 0 && (
                      <span className="ml-[6px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-[9px] uppercase tracking-wide shrink-0">
                        Active tailoring order
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons on Header */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-[36px] rounded-xl border-[#EBE9E2] text-slate-700 hover:bg-slate-50 flex items-center gap-1 px-3 py-1 cursor-pointer font-semibold text-xs"
                  onClick={() => setIsMeasurementOpen(!isMeasurementOpen)}
                >
                  <Ruler className="h-4 w-4 text-[#0D3D33]" />
                  <span className="hidden sm:inline">Sizes (Measurements)</span>
                </Button>
              </div>
            </div>

            {/* Main Chat Core Flex Area (contains messages thread & sidebar drawer) */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Messages viewport */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-2.5 pb-[44px]">
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Clock className="animate-spin text-slate-300 h-8 w-8" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-2">
                    <MessageSquare className="h-6 w-6 text-slate-400" />
                    <span className="text-xs">No messages yet. Send a size request or welcome message to prompt a client response!</span>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                      const isTailor = msg.senderRole === 'tailor';
                      const isOptimistic = msg.metadata?.delivered === false;
                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          className={`flex ${isTailor ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative ${
                              isTailor 
                                ? 'bg-slate-900 border border-slate-800 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-800 rounded-tl-sm border border-[#EBE9E2]'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            
                            <div className="mt-1.5 flex items-center justify-end gap-1 font-mono text-[9px] text-slate-400 select-none">
                              <span>{formatTime(msg.createdAt)}</span>
                              {isTailor && (
                                <>
                                  {isOptimistic ? (
                                    <Check className="h-3.5 w-3.5 text-slate-500 stroke-[1.5]" />
                                  ) : msg.read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400 stroke-[2]" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400 stroke-[1.5]" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={threadScrollRef} />
              </div>

              {/* Sidebar context drawer (Sizes inspection panel) */}
              <AnimatePresence>
                {isMeasurementOpen && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="absolute right-0 top-0 bottom-0 w-full sm:w-[320px] bg-white border-l border-[#EBE9E2] z-20 shadow-xl flex flex-col overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#EBE9E2] flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-1.5 font-bold font-sans text-sm text-slate-800">
                        <Ruler className="h-4 w-4 text-[#0D3D33]" />
                        <span>Client Size Card</span>
                      </div>
                      <button 
                        onClick={() => setIsMeasurementOpen(false)}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {measurementsLoading ? (
                        <div className="flex justify-center p-8"><Clock className="h-6 w-6 animate-spin text-slate-300" /></div>
                      ) : customerMeasurements ? (
                        <div className="space-y-4">
                          <div className="bg-[#FAF9F6] border border-[#EBE9E2] rounded-xl p-3.5">
                            <span className="text-[10px] font-bold text-[#0D3D33] uppercase spacing-wide">Shalwar Kameez Measurements</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-3 text-xs text-slate-600 font-sans">
                              {Object.entries(customerMeasurements).map(([key, val]) => {
                                if (key === 'shopId' || key === 'customerId' || key === 'updatedAt' || typeof val !== 'number') return null;
                                // Decode label formatting
                                const label = key.replace('kameez', 'Kameez ').replace('shalwar', 'Shalwar ').replace(/([A-Z])/g, ' $1').trim();
                                return (
                                  <div key={key} className="flex justify-between border-b border-slate-100 pb-1">
                                    <span className="text-slate-400">{label}:</span>
                                    <span className="font-bold text-slate-800">{val}&quot;</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="bg-[#F4F6F5] border border-emerald-100 rounded-xl p-3 text-xs text-[#0D3D33] flex items-start gap-2.5">
                            <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                            <div className="space-y-1">
                              <p className="font-bold">Auto-Apply to Order</p>
                              <p className="leading-relaxed text-emerald-700">These measurements are synchronized with active tailoring drafts. Copy-paste values direct to orders anytime.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center border-2 border-dashed border-[#EBE9E2] rounded-2xl flex flex-col items-center justify-center gap-2">
                          <Ruler className="h-8 w-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-600">No sizing records</p>
                          <p className="text-[11px] text-slate-400">Measurements haven&apos;t been locked for this customer yet.</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2 text-[#0D3D33] border-[#0D3D33]/20 hover:bg-slate-50 cursor-pointer h-[32px] px-2.5 text-[10px]"
                            onClick={() => {
                              setIsMeasurementOpen(false);
                              navigate(`/app/clients?edit=${activeCustomerId}`);
                            }}
                          >
                            Set Sizes now
                          </Button>
                        </div>
                      )}

                      {/* Orders under customer */}
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Client Active Orders</span>
                        {currentCustomerOrders.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No pending orders.</p>
                        ) : (
                          currentCustomerOrders.map((order) => (
                            <Link 
                              to={`/app/orders/${order.id}`}
                              key={order.id} 
                              className="block p-3 border border-slate-100 rounded-xl bg-[#FAF9F6] hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#0D3D33] tracking-wide h-dvh">{order.clothingType || 'Suit Draft'}</span>
                                <span className="px-1.5 py-0.5 font-bold text-[9px] rounded bg-amber-50 text-amber-600 uppercase border border-amber-100 font-mono">
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                                <span>Due: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                                <span className="text-slate-700 font-bold">Rs. {order.price}</span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Container: templates drawer & standard input bar */}
            <div className="shrink-0 bg-white border-t border-[#EBE9E2] p-3 pb-safe z-10 flex flex-col gap-3">
              
              {/* Templates Drawer Accordion Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Shortcuts:</span>
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyTemplate(tpl.text)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-100 bg-[#FAF9F6] text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium shrink-0 active:scale-95 transition-all outline-none"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              {/* Text Input Row */}
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 min-h-[44px] max-h-[120px] bg-[#F8F7F4] border-none rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 font-sans resize-none transition-all leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="h-[44px] w-[44px] p-0 rounded-2xl bg-slate-900 border-none text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors active:scale-95"
                >
                  <Send className="h-4.5 w-4.5" />
                </Button>
              </div>

              {/* sandbox simulator control block */}
              <div className="bg-[#FAF9F6] border border-[#EBE9E2] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      Client Sandbox Simulator
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 select-none">TDD tool</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Trigger simulated incoming messages from the customer to test local state & sound chimes.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <Input
                    type="text"
                    placeholder="Type client response text..."
                    value={simulatedInputText}
                    onChange={(e) => setSimulatedInputText(e.target.value)}
                    className="h-[36px] min-w-[200px] bg-white border-[#EBE9E2] rounded-lg text-xs"
                    disabled={isSimulatingReply}
                  />
                  <Button
                    size="sm"
                    className="h-[36px] rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500 hover:scale-102 flex items-center gap-1.5 text-xs font-bold"
                    onClick={triggerSimulatedReply}
                    disabled={!simulatedInputText.trim() || isSimulatingReply}
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Simulate Reply
                  </Button>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center max-w-[320px] mx-auto select-none gap-3.5">
            <div className="h-16 w-16 rounded-full bg-[#FAF9F6] text-slate-300 flex items-center justify-center border border-[#EBE9E2] shadow-sm animate-pulse">
              <MessageSquare className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-700 leading-tight">Secure Customer Inbox</p>
              <p className="text-xs text-slate-400 leading-relaxed">Choose a thread on the left side, or check client details under the Client tab to launch instant secure messaging.</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl px-4 py-2 text-xs bg-slate-900 text-white hover:bg-slate-800 cursor-pointer h-[38px] font-bold flex items-center gap-1.5 mt-2"
              onClick={() => setIsNewChatOpen(true)}
            >
              <Plus className="h-4 w-4" /> Start Client Conversation
            </Button>
          </div>
        )}
      </div>

      {/* 3. MODAL DIALOG: Starting a new chat with an existing client */}
      <AnimatePresence>
        {isNewChatOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-2xl w-full max-w-[420px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EBE9E2] flex flex-col overflow-hidden max-h-[85vh]"
            >
              <div className="p-4 border-b border-[#EBE9E2] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">Start Conversation</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Select any registered client to open/generate a real-time secure thread.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsNewChatOpen(false);
                    setNewChatSearch('');
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search clients */}
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search customer catalog..."
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    className="pl-9 h-[36px] bg-white border-[#EBE9E2] rounded-lg text-xs focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* List of scrollable customers */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[300px]">
                {customersLoading ? (
                  <div className="p-4 text-center"><Clock className="h-5 w-5 animate-spin mx-auto text-slate-300" /></div>
                ) : filteredNewChatCustomers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">No clients matching search filter</p>
                    <p className="text-[10px] text-slate-400 mt-1">Make sure the customer exists in your central Clients directory, or adjust your search filter.</p>
                  </div>
                ) : (
                  filteredNewChatCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => !isCreatingChat && handleStartNewChat(cust)}
                      className={`p-3 flex items-center justify-between hover:bg-[#FAF9F6] cursor-pointer transition-colors ${isCreatingChat ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-800">{cust.name}</p>
                          <p className="text-[10px] text-slate-400">{cust.phone}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isCreatingChat !== null}
                        className="h-[28px] rounded px-3 text-[10px] bg-[#0D3D33] text-white hover:bg-[#1a5c4e] cursor-pointer flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartNewChat(cust);
                        }}
                      >
                        {isCreatingChat === cust.id ? (
                          <>
                            <Clock className="w-3 h-3 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          'Open Chat'
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
