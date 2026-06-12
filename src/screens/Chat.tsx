import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, MessageSquare, Search, Plus, X, Clock, Ruler, 
  Send, Info, FileText, CheckCircle, ArrowLeft, RefreshCw, 
  MessageCircle, Copy, Check, Scissors, CreditCard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomers } from '../hooks/useCustomers';
import { useOrders } from '../hooks/useOrders';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { openWhatsApp } from '../lib/whatsapp';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function Chat() {
  const { customerId: routeCustomerId } = useParams<{ customerId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { customers, loading: customersLoading } = useCustomers();
  const { orders } = useOrders();

  // Active Customer state
  const activeCustomerId = routeCustomerId || '';
  
  // Searching & Filtering left column
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'activeOrders' | 'noPhone'>('all');

  // Measurements state
  const [measurements, setMeasurements] = useState<any | null>(null);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);

  // Selected order for populating templates
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);

  // Live draft message state
  const [draftMessage, setDraftMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Quick template lists
  const templates = useMemo(() => [
    {
      id: 'measurements',
      label: '📏 Size Request',
      description: 'Request sizing details from customer',
      text: (cust: any) => `Slam ${cust.name}, hope you are doing well!\n\nCould you please send us your latest Shalwar Kameez or suit measurements so we can lock in your tailoring details? JazakAllah!`
    },
    {
      id: 'confirmation',
      label: '📦 Order Confirmation',
      description: 'Send confirmation summary',
      text: (cust: any, order?: any) => {
        if (order) {
          return `Dear ${cust.name},\n\nYour tailoring order for ${order.clothingType || 'Suit'} is confirmed! ✅\n\n• Order ID: ${order.id?.substring(0, 6) || 'Draft'}\n• Price: Rs. ${order.price}\n• Advance: Rs. ${order.advancePayment || 0}\n• Due Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}\n\nThank you for choosing Loop Tailor!`;
        }
        return `Dear ${cust.name},\n\nYour tailoring order is confirmed! ✅\n\nThank you for choosing Loop Tailor!`;
      }
    },
    {
      id: 'fitting',
      label: '📍 Fitting Trial',
      description: 'Invite client for trial/fitting',
      text: (cust: any, order?: any) => {
        const type = order ? order.clothingType : 'Suit';
        return `Slam ${cust.name}!\n\nYour ${type} baseline cut and baseline alignments are ready for fitting trial. 📍\n\nPlease visit our shop at your earliest convenience so we can verify the sizing of your outfit.`;
      }
    },
    {
      id: 'completed',
      label: '🎉 Ready for Pickup',
      description: 'Alert client of completion',
      text: (cust: any, order?: any) => {
        if (order) {
          const balance = order.price - (order.advancePayment || 0);
          return `Slam ${cust.name}!\n\nGreat news! Your ${order.clothingType || 'Suit'} tailoring order is completely stitched and ready for collection! 🎉\n\n• Price: Rs. ${order.price}\n• Paid: Rs. ${order.advancePayment || 0}\n• Balance Due: Rs. ${balance}\n\nPlease visit the shop to collect your dress. Thank you!`;
        }
        return `Slam ${cust.name}!\n\nGreat news! Your tailoring order is completed and ready for collection! 🎉\n\nPlease visit the shop to collect your dress. Thank you!`;
      }
    },
    {
      id: 'reminder',
      label: '💰 Deposit Reminder',
      description: 'Polite reminder for balance due',
      text: (cust: any, order?: any) => {
        if (order) {
          const balance = order.price - (order.advancePayment || 0);
          return `Slam ${cust.name},\n\nThis is a friendly reminder regarding your active order for ${order.clothingType || 'Suit'}.\n\n• Price: Rs. ${order.price}\n• Present Balance due: Rs. ${balance}\n\nPlease submit or clear the deposit so we can prioritize finishing your dress. JazakAllah!`;
        }
        return `Slam ${cust.name},\n\nThis is a polite reminder to please clear the remaining balance due on your tailoring order. JazakAllah!`;
      }
    }
  ], []);

  // Sync selected customer meta
  const currentCustomerMeta = useMemo(() => {
    return customers.find(c => c.id === activeCustomerId);
  }, [customers, activeCustomerId]);

  // Sync customer active orders
  const currentCustomerOrders = useMemo(() => {
    if (!activeCustomerId) return [];
    return orders.filter(o => 
      o.customerId === activeCustomerId && 
      o.status !== 'delivered' && 
      o.status !== 'cancelled'
    );
  }, [orders, activeCustomerId]);

  // Select active order
  const activeOrder = useMemo(() => {
    if (currentCustomerOrders.length === 0) return undefined;
    if (selectedOrderIndex >= currentCustomerOrders.length) return currentCustomerOrders[0];
    return currentCustomerOrders[selectedOrderIndex];
  }, [currentCustomerOrders, selectedOrderIndex]);

  // Reset order index when customer shifts
  useEffect(() => {
    setSelectedOrderIndex(0);
    if (currentCustomerMeta) {
      // Load initial welcome measurement request first
      setDraftMessage(templates[0].text(currentCustomerMeta));
    } else {
      setDraftMessage('');
    }
  }, [activeCustomerId, currentCustomerMeta, templates]);

  // Get measurements from Firestore if customer shifts
  useEffect(() => {
    if (!activeCustomerId) {
      setMeasurements(null);
      return;
    }

    const fetchMeasurements = async () => {
      setMeasurementsLoading(true);
      try {
        const docRef = doc(db, 'measurements', activeCustomerId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setMeasurements(snap.data());
        } else {
          setMeasurements(null);
        }
      } catch (e) {
        console.warn("Failed to load measurements:", e);
      } finally {
        setMeasurementsLoading(false);
      }
    };

    fetchMeasurements();
  }, [activeCustomerId]);

  // Left Column list filters
  const processedCustomers = useMemo(() => {
    let list = [...customers];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.phone.toLowerCase().includes(query)
      );
    }

    // Tab Type filters
    if (filterType === 'activeOrders') {
      list = list.filter(c => 
        orders.some(o => o.customerId === c.id && o.status !== 'delivered' && o.status !== 'cancelled')
      );
    } else if (filterType === 'noPhone') {
      list = list.filter(c => !c.phone || c.phone === 'No phone' || c.phone.trim() === '');
    }

    return list;
  }, [customers, orders, searchQuery, filterType]);

  // Handle template selection
  const handleSelectTemplate = (templateFunc: any) => {
    if (!currentCustomerMeta) return;
    const computed = templateFunc(currentCustomerMeta, activeOrder);
    setDraftMessage(computed);
    toast.success("Applied preselected template details!");
  };

  // WhatsApp sender
  const handleSendMessage = () => {
    if (!currentCustomerMeta) return;
    const phoneNum = currentCustomerMeta.whatsappPhone || currentCustomerMeta.phone;
    
    if (!phoneNum || phoneNum === 'No phone' || phoneNum.trim() === '') {
      toast.error("This customer does not have a valid WhatsApp or phone number registered.");
      return;
    }

    toast.success(`Opening WhatsApp Chat with ${currentCustomerMeta.name}...`);
    openWhatsApp(phoneNum, draftMessage, currentCustomerMeta.countryCode || '+92');
  };

  // Copy customized draft to clipboard
  const handleCopyClipboard = () => {
    if (!draftMessage) return;
    navigator.clipboard.writeText(draftMessage);
    setIsCopied(true);
    toast.success("Draft copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-72px)] lg:h-screen flex bg-[#F8F7F4] overflow-hidden">
      
      {/* 1. SIDEBAR: CUSTOMER SELECTION DIRECTORY (Hidden on mobile if a workspace is active) */}
      <div className={`w-full lg:w-[380px] border-r border-[#EBE9E2] flex flex-col bg-white shrink-0 ${activeCustomerId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[#EBE9E2] space-y-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600/10" />
              WhatsApp Messaging
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Draft templates and message tailoring clients via WhatsApp</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search customer directory..."
              className="pl-9 h-[40px] bg-[#F8F7F4] border-none rounded-xl focus:ring-1 focus:ring-slate-300 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 pt-1 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${filterType === 'all' ? 'bg-[#0D3D33] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All Clients
            </button>
            <button
              onClick={() => setFilterType('activeOrders')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${filterType === 'activeOrders' ? 'bg-[#0D3D33] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setFilterType('noPhone')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${filterType === 'noPhone' ? 'bg-[#0D3D33] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              No Phone List
            </button>
          </div>
        </div>

        {/* List scrollbox */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F1EFEB]">
          {customersLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-400 h-[200px]">
              <Clock className="h-6 w-6 animate-spin text-[#0D3D33]" />
              <span className="text-xs font-bold uppercase tracking-wide">Loading directory...</span>
            </div>
          ) : processedCustomers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#FAF9F6] flex items-center justify-center text-slate-300">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No customers found</p>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto">Try typing another selector name or add new clients in Clients directory.</p>
            </div>
          ) : (
            processedCustomers.map((cust) => {
              const active = cust.id === activeCustomerId;
              const hasNotes = cust.notes && cust.notes.trim() !== '';
              const clientOrders = orders.filter(o => o.customerId === cust.id && o.status !== 'delivered' && o.status !== 'cancelled');

              return (
                <div
                  key={cust.id}
                  onClick={() => navigate(`/app/chat/${cust.id}`)}
                  className={`p-4 flex gap-3 cursor-pointer transition-all relative border-l-4 ${active ? 'bg-slate-50 border-emerald-600' : 'border-transparent hover:bg-slate-500/5'}`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-[#0D3D33] flex items-center justify-center shrink-0 font-bold font-sans uppercase border border-slate-500/10">
                    {cust.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800 truncate leading-tight">{cust.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{cust.countryCode} {cust.phone}</span>
                    </div>
                    
                    <div className="flex gap-1.5 items-center mt-2.5">
                      {clientOrders.length > 0 ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 uppercase font-mono">
                          {clientOrders.length} Pending
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 uppercase font-bold">
                          No Active Orders
                        </span>
                      )}
                      
                      {cust.gender && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase font-bold">
                          {cust.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CHAT WORKSPACE (Takes full screen on mobile when active) */}
      <div className={`flex-1 flex flex-col bg-[#F3F1EC] relative ${!activeCustomerId ? 'hidden lg:flex justify-center items-center p-12 text-center' : 'flex'}`}>
        {activeCustomerId && currentCustomerMeta ? (
          <>
            {/* Header top bar */}
            <div className="h-[64px] shrink-0 bg-white border-b border-[#EBE9E2] flex items-center justify-between px-4 z-10 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => navigate('/app/chat')}
                  className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm uppercase border border-emerald-100">
                  {currentCustomerMeta.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-bold text-sm text-slate-800 leading-tight truncate">{currentCustomerMeta.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate font-semibold">
                    <Phone className="h-3 w-3 text-slate-300" />
                    <span>{currentCustomerMeta.phone || 'No active phone'}</span>
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-[36px] rounded-xl border-[#EBE9E2] bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-xs gap-1 px-3 cursor-pointer select-none"
                  onClick={() => openWhatsApp(currentCustomerMeta.whatsappPhone || currentCustomerMeta.phone, '', currentCustomerMeta.countryCode || '+92')}
                >
                  <MessageCircle className="w-4 h-4 fill-emerald-600/10 text-emerald-600" />
                  <span>Open WhatsApp Directly</span>
                </Button>
              </div>
            </div>

            {/* Workplace Content (two-column dashboard format on desktop) */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Outreaching column (Left 7-grids) */}
                <div className="xl:col-span-7 space-y-6">
                  
                  {/* Outreach Alerts Templates Grid */}
                  <div className="bg-white border border-[#EBE9E2] rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#0D3D33]" />
                        Select Template Pre-fill Alert
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Click on any template to fill the drafts editor below with verified tailoring codes.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => handleSelectTemplate(tpl.text)}
                          className="p-3 bg-slate-50 border border-slate-100 hover:border-emerald-600/30 hover:bg-emerald-500/5 rounded-xl cursor-pointer transition-all active:scale-98 relative group"
                        >
                          <span className="block font-bold text-xs text-slate-800 mb-1">{tpl.label}</span>
                          <span className="block text-[10px] text-slate-400 leading-relaxed">{tpl.description}</span>
                          <span className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-bold text-emerald-600">Apply</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drafting Canvas / Live View Editor */}
                  <div className="bg-[#FAF9F6] border border-[#EBE9E2] rounded-2xl p-5 shadow-md space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Live WhatsApp Message Draft</span>
                        <h3 className="font-bold text-slate-800 text-sm mt-0.5">Customize Outreach Text</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyClipboard}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all active:scale-95"
                          title="Copy message to clipboard"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={draftMessage}
                      onChange={(e) => setDraftMessage(e.target.value)}
                      rows={7}
                      className="w-full bg-white border border-[#EBE9E2] rounded-2xl p-4 text-sm font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all resize-none shadow-inner"
                      placeholder="Write custom instructions or leave templates alerts text content..."
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-400 leading-normal font-medium max-w-[320px]">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-300" />
                        <span>This message will pre-fill on WhatsApp. You can review or tweak it before hitting send.</span>
                      </div>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!draftMessage.trim()}
                        className="w-full sm:w-auto px-5 py-4 h-[44px] bg-[#25D366] text-white hover:bg-[#128C7E] border-none rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-xl active:scale-98 transition-all disabled:opacity-50"
                      >
                        <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                        Message Customer via WhatsApp
                      </Button>
                    </div>
                  </div>

                </div>

                {/* Right Context column containing Client active measurements and orders references (Right 5-grids) */}
                <div className="xl:col-span-5 space-y-6">
                  
                  {/* Multi active orders selector card */}
                  <div className="bg-white border border-[#EBE9E2] rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0D3D33]" />
                        Apply Order Details
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Select an active order to link pricing & dates variables automatically to variables.</p>
                    </div>

                    {currentCustomerOrders.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-[#FAF9F6] text-center">
                        <p className="text-xs text-slate-400 italic">No pending tailoring orders currently active for {currentCustomerMeta.name}.</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3 text-[#0D3D33] border-[#0D3D33]/10 h-[32px] rounded-lg font-bold text-[10px]"
                          onClick={() => navigate('/app/new-order')}
                        >
                          Book Custom Order Draft
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {currentCustomerOrders.map((order, index) => {
                          const isSelected = selectedOrderIndex === index;
                          const balance = order.price - (order.advancePayment || 0);
                          return (
                            <div
                              key={order.id}
                              onClick={() => setSelectedOrderIndex(index)}
                              className={`p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-emerald-600 bg-emerald-500/5' : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-700">{order.clothingType || 'Suit Details'}</span>
                                <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-1.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                                  {order.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-slate-400 font-medium">
                                <span>Total Price: <strong className="text-slate-700">Rs {order.price}</strong></span>
                                <span>Due: <strong className="text-slate-700">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}</strong></span>
                                <span>Advance: <strong className="text-slate-700">Rs {order.advancePayment || 0}</strong></span>
                                <span>Balance: <strong className="text-emerald-700">Rs {balance}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Size Card / Active measurements preview */}
                  <div className="bg-white border border-[#EBE9E2] rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-[#0D3D33]" />
                        Stored Client Sizing Details
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] text-slate-400 font-bold hover:text-slate-700"
                        onClick={() => navigate(`/app/clients?edit=${activeCustomerId}`)}
                      >
                        Edit Sizes
                      </Button>
                    </div>

                    {measurementsLoading ? (
                      <div className="p-8 text-center"><Clock className="h-5 w-5 animate-spin mx-auto text-slate-300" /></div>
                    ) : measurements ? (
                      <div className="space-y-3">
                        <div className="bg-[#FAF9F6] border border-slate-100 p-3 rounded-xl max-h-[300px] overflow-y-auto pr-1">
                          <span className="text-[9px] font-bold text-[#0D3D33] uppercase">Shalwar Kameez measurements</span>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-xs text-slate-600 font-sans">
                            {Object.entries(measurements).map(([key, val]) => {
                              if (key === 'shopId' || key === 'customerId' || key === 'updatedAt' || typeof val !== 'number') return null;
                              const label = key.replace('kameez', 'Kameez ').replace('shalwar', 'Shalwar ').replace(/([A-Z])/g, ' $1').trim();
                              return (
                                <div key={key} className="flex justify-between border-b border-slate-100 pb-1">
                                  <span className="text-slate-400 capitalize">{label}:</span>
                                  <span className="font-bold text-slate-800 font-mono">{val}"</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-[10px] font-bold h-[32px] rounded-lg border-slate-200 hover:bg-slate-50 gap-1 cursor-pointer"
                          onClick={() => {
                            let notesStr = `Measurements of ${currentCustomerMeta.name}:\n`;
                            Object.entries(measurements).forEach(([key, val]) => {
                              if (key === 'shopId' || key === 'customerId' || key === 'updatedAt' || typeof val !== 'number') return;
                              const label = key.replace('kameez', 'Kameez ').replace('shalwar', 'Shalwar ').replace(/([A-Z])/g, ' $1').trim();
                              notesStr += `• ${label}: ${val}"\n`;
                            });
                            navigator.clipboard.writeText(notesStr);
                            toast.success("Measurements formatted & copied!");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                          Copy Formatted Measurements
                        </Button>
                      </div>
                    ) : (
                      <div className="p-5 text-center border-2 border-dashed border-slate-100 rounded-xl space-y-2">
                        <Ruler className="h-6 w-6 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-500">No dimensions registered</p>
                        <p className="text-[10px] text-slate-400">Measurements must be configured for this customer in Clients profiles catalog.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-[28px] text-[10px] font-bold text-[#0D3D33] border-[#0D3D33]/15 mt-1"
                          onClick={() => navigate(`/app/clients?edit=${activeCustomerId}`)}
                        >
                          Configure Sizing Card
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center max-w-[340px] mx-auto select-none gap-3.5 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-white text-[#25D366] flex items-center justify-center border border-[#EBE9E2] shadow-sm">
              <MessageSquare className="h-8 w-8 text-emerald-500 fill-emerald-500/10" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-700 text-sm leading-tight">Start Direct Outreach</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Select a tailoring customer from your directory list on the left to start sending WhatsApp alerts, size requests, and deposit confirmations.</p>
            </div>
            <div className="w-full pt-1.5 pointer-events-none opacity-40">
              <div className="h-[1px] bg-slate-200 w-full" />
              <p className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest mt-2">{customers.length} Clients Registered</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
