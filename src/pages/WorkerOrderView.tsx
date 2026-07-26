import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatWhatsAppNumber, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Scissors, CheckCircle2, Clock, Shirt, MessageSquare, AlertCircle, Sparkles, Check, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkerOrderView() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    let activeUnsubscribers: (() => void)[] = [];

    // Instant query parameter decoding backup strategy
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('t');
    const customerParam = urlParams.get('c');
    const dressParam = urlParams.get('d');
    const deliveryParam = urlParams.get('del');
    const rackParam = urlParams.get('r');
    const notesParam = urlParams.get('n');
    const shopParam = urlParams.get('s');
    const phoneParam = urlParams.get('sp');
    const measParam = urlParams.get('m');

    if (tokenParam || customerParam || dressParam || measParam) {
      let parsedMeas = {};
      try {
        if (measParam) parsedMeas = JSON.parse(measParam);
      } catch (e) {}

      const fallbackOrder = {
        id: id || 'order',
        tokenId: tokenParam || (id ? id.substring(0, 8).toUpperCase() : 'TOKEN'),
        customerName: customerParam || 'Valued Customer',
        clothingType: dressParam || 'Custom Suit',
        deliveryDate: deliveryParam || null,
        rackLocation: rackParam || '',
        designNotes: notesParam || '',
        status: 'stitching',
        measurements: parsedMeas
      };

      setOrder(fallbackOrder);
      if (shopParam || phoneParam) {
        setShop({ name: shopParam || 'Loop Tailor Shop', shopName: shopParam || 'Loop Tailor Shop', phone: phoneParam || '', shopPhone: phoneParam || '' });
      }
      setLoading(false);
    } else {
      setLoading(true);
    }

    const cleanupListeners = () => {
      activeUnsubscribers.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
      activeUnsubscribers = [];
    };

    // Helper to fetch and subscribe to shop details
    const fetchShopInfo = (userId: string) => {
      if (!userId || !isMounted) return;
      try {
        const unsubShop = onSnapshot(doc(db, 'shops', userId), (shopSnap) => {
          if (shopSnap.exists() && isMounted) {
            setShop(shopSnap.data());
          } else if (isMounted) {
            const unsubSettings = onSnapshot(doc(db, 'settings', userId), (settingsSnap) => {
              if (settingsSnap.exists() && isMounted) setShop(settingsSnap.data());
            }, () => {});
            activeUnsubscribers.push(unsubSettings);
          }
        }, () => {});
        activeUnsubscribers.push(unsubShop);
      } catch (e) {}
    };

    // Helper to process matched order data
    const handleFoundOrder = (docId: string, orderData: any, sourceCollection: 'publicOrders' | 'orders') => {
      if (!isMounted) return;
      const fullOrder = { id: docId, ...orderData };
      setOrder(fullOrder);
      setLoading(false);

      if (orderData.shop) {
        setShop(orderData.shop);
      } else if (orderData.userId) {
        fetchShopInfo(orderData.userId);
      }

      // Auto-sync document to publicOrders under docId and order.id and order.tokenId
      const syncTargets = Array.from(new Set([docId, orderData.id, orderData.tokenId].filter(Boolean)));
      syncTargets.forEach(targetId => {
        if (typeof targetId === 'string') {
          setDoc(doc(db, 'publicOrders', targetId), fullOrder, { merge: true }).catch(() => {});
        }
      });

      // Subscribe to real-time updates on matched document
      try {
        const unsubRealtime = onSnapshot(doc(db, sourceCollection, docId), (snap) => {
          if (snap.exists() && isMounted) {
            const updated = { id: snap.id, ...snap.data() };
            setOrder(updated);
          }
        }, () => {});
        activeUnsubscribers.push(unsubRealtime);
      } catch (e) {}
    };

    // 5-Layer Bulletproof Data Fetcher Strategy
    const loadOrderData = async () => {
      // Strategy 1: Public REST API (Fastest & Universal for All Browsers / Non-Auth Sessions)
      try {
        const apiRes = await fetch(`/api/public/worker-order/${id}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData?.order && isMounted) {
            setOrder(apiData.order);
            if (apiData.shop) setShop(apiData.shop);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Public API fetch note:", e);
      }

      // Strategy 2: Firestore publicOrders Direct Doc Key
      try {
        const publicSnap = await getDoc(doc(db, 'publicOrders', id));
        if (publicSnap.exists() && isMounted) {
          handleFoundOrder(publicSnap.id, publicSnap.data(), 'publicOrders');
          return;
        }
      } catch (e) {}

      // Strategy 3: Firestore orders Direct Doc Key
      try {
        const orderSnap = await getDoc(doc(db, 'orders', id));
        if (orderSnap.exists() && isMounted) {
          handleFoundOrder(orderSnap.id, orderSnap.data(), 'orders');
          return;
        }
      } catch (e) {}

      // Strategy 4: Firestore Query orders by `id` or `tokenId` field variations
      try {
        const tokenFormatted = id.toUpperCase().startsWith('T-') ? id.toUpperCase() : `T-${id.toUpperCase()}`;
        
        const qById = query(collection(db, 'orders'), where('id', '==', id));
        const snapById = await getDocs(qById);
        if (!snapById.empty && isMounted) {
          const matchedDoc = snapById.docs[0];
          handleFoundOrder(matchedDoc.id, matchedDoc.data(), 'orders');
          return;
        }

        const qByToken = query(collection(db, 'orders'), where('tokenId', '==', tokenFormatted));
        const snapByToken = await getDocs(qByToken);
        if (!snapByToken.empty && isMounted) {
          const matchedDoc = snapByToken.docs[0];
          handleFoundOrder(matchedDoc.id, matchedDoc.data(), 'orders');
          return;
        }
      } catch (e) {}

      // Strategy 5: Firestore Query publicOrders by `id` or `tokenId` field variations
      try {
        const tokenFormatted = id.toUpperCase().startsWith('T-') ? id.toUpperCase() : `T-${id.toUpperCase()}`;

        const qPubById = query(collection(db, 'publicOrders'), where('id', '==', id));
        const snapPubById = await getDocs(qPubById);
        if (!snapPubById.empty && isMounted) {
          const matchedDoc = snapPubById.docs[0];
          handleFoundOrder(matchedDoc.id, matchedDoc.data(), 'publicOrders');
          return;
        }

        const qPubByToken = query(collection(db, 'publicOrders'), where('tokenId', '==', tokenFormatted));
        const snapPubByToken = await getDocs(qPubByToken);
        if (!snapPubByToken.empty && isMounted) {
          const matchedDoc = snapPubByToken.docs[0];
          handleFoundOrder(matchedDoc.id, matchedDoc.data(), 'publicOrders');
          return;
        }
      } catch (e) {}

      // Final Check: If no order matched from DB, preserve URL query fallback order if present!
      if (isMounted) {
        setOrder(prev => prev || null);
        setLoading(false);
      }
    };

    loadOrderData();

    return () => {
      isMounted = false;
      cleanupListeners();
    };
  }, [id]);

  const handleUpdateStatus = async (newStatus: 'stitching' | 'ready') => {
    if (!id || !order) return;
    setUpdating(true);
    try {
      const orderDocId = order.id || id;

      // Update via REST API
      await fetch(`/api/public/worker-order/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});

      // Update Firestore in parallel across all keys
      await Promise.allSettled([
        updateDoc(doc(db, 'orders', orderDocId), {
          status: newStatus,
          updatedAt: serverTimestamp()
        }),
        setDoc(doc(db, 'publicOrders', id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        }, { merge: true }),
        setDoc(doc(db, 'publicOrders', orderDocId), {
          status: newStatus,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]);

      setOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      toast.success(newStatus === 'ready' ? '🎉 Suit stitching marked complete & ready!' : '✂️ Suit stitching started!');
    } catch (err: any) {
      console.error("Failed status update:", err);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleNotifyOwner = () => {
    const phone = shop?.shopPhone || shop?.phone || '';
    const formatted = formatWhatsAppNumber(phone);
    const token = order.tokenId || order.id?.substring(0, 8).toUpperCase();

    const msg = `✂️ *WORKER STATUS UPDATE — ${shop?.name || shop?.shopName || 'LOOP TAILOR'}*
----------------------------------------
📋 *Order Token #*: #${token}
👤 *Customer*: ${order.customerName || 'Customer'}
👗 *Dress*: ${order.clothingType || 'Custom Suit'}
📌 *Status*: *${(order.status || 'STITCHING').toUpperCase()}*

Assalam-o-Alaikum! Suit stitching for order #${token} is ${order.status === 'ready' ? '✅ COMPLETED & READY!' : '✂️ CURRENTLY IN PROGRESS.'}`;

    const encoded = encodeURIComponent(msg);
    const url = formatted 
      ? `https://wa.me/${formatted}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center space-y-4 max-w-sm w-full border border-slate-100">
          <div className="w-14 h-14 bg-[#0D3D33]/10 text-[#0D3D33] rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Scissors className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">Opening Tailor Worksheet...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-xl border border-slate-100">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Worksheet Not Found</h2>
          <p className="text-xs text-slate-500">This order worksheet link may be invalid or deleted by the shop owner.</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="rounded-xl font-bold border-slate-300 text-slate-700"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const tokenNumber = order.tokenId || order.id?.substring(0, 8).toUpperCase();
  const measurements = order.measurements || {};
  const hasMeasurements = Object.keys(measurements).length > 0 && Object.values(measurements).some(v => v !== null && v !== undefined && v !== '');

  const isStitching = order.status === 'stitching';
  const isReady = order.status === 'ready' || order.status === 'delivered';

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-slate-900 font-sans p-3 sm:p-6 max-w-xl mx-auto space-y-4">
      {/* Brand Header */}
      <div className="bg-[#0D3D33] text-white p-5 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scissors className="w-36 h-36" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#0D3D33] flex items-center justify-center font-black text-xl shadow-md shrink-0">
              ✂️
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2ECC71] block">TAILOR WORKSHEET</span>
              <h1 className="text-2xl font-mono font-black text-white">#{tokenNumber}</h1>
            </div>
          </div>

          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${
              isReady 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : isStitching 
                ? 'bg-amber-400 text-slate-950 border-amber-500' 
                : 'bg-white/20 text-white border-white/30'
            }`}>
              {isReady ? '✨ Ready' : isStitching ? '✂️ Stitching' : '⏳ Pending'}
            </span>
            <p className="text-[11px] text-white/80 mt-1 font-bold">Delivery: {formatDate(order.deliveryDate)}</p>
          </div>
        </div>

        {(shop?.name || shop?.shopName) && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
            <span className="font-semibold">🏪 {shop.shopName || shop.name}</span>
            {(shop.shopPhone || shop.phone) && <span>📞 {shop.shopPhone || shop.phone}</span>}
          </div>
        )}
      </div>

      {/* Customer & Garment Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Shirt className="w-4 h-4 text-[#0D3D33]" /> Suit & Order Information
        </h2>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Customer</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block truncate">{order.customerName || 'Valued Customer'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Clothing Type</span>
            <span className="font-black text-[#0D3D33] text-sm mt-0.5 block truncate">{order.clothingType || 'Custom Suit'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Category</span>
            <span className="font-bold text-slate-700 mt-0.5 block">{order.serviceCategory || 'Bespoke'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Rack Storage</span>
            <span className="font-bold text-amber-600 mt-0.5 block">{order.rackLocation || 'Assigned'}</span>
          </div>
        </div>

        {/* Special Instructions / Notes */}
        {(order.designNotes || order.notes) && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-amber-900 font-black text-xs uppercase tracking-wider block flex items-center gap-1.5">
              ⚠️ STITCHING INSTRUCTIONS & NOTES
            </span>
            <p className="text-slate-800 text-sm font-semibold leading-relaxed">{order.designNotes || order.notes}</p>
          </div>
        )}
      </div>

      {/* Sizing & Measurements Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          📐 EXACT TAILOR MEASUREMENTS (SIZES)
        </h2>

        {hasMeasurements ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(measurements).map(([key, value]) => {
              if (value === null || value === undefined || value === '') return null;
              const friendlyLabel = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              return (
                <div key={key} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-center space-y-1">
                  <span className="text-slate-400 font-extrabold text-[10px] uppercase block tracking-wider truncate">{friendlyLabel}</span>
                  <span className="font-black text-[#0D3D33] text-2xl block">{String(value)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
            Standard sizing template applied for this garment.
          </div>
        )}
      </div>

      {/* Worker Interactive Action Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          ⚡ WORKER STITCHING CONTROLS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => handleUpdateStatus('stitching')}
            disabled={updating || isStitching}
            className={`rounded-2xl h-14 text-sm font-black gap-2 transition-all ${
              isStitching 
                ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 cursor-default opacity-90' 
                : 'bg-[#0D3D33] hover:bg-[#092B24] text-white shadow-md active:scale-95'
            }`}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {isStitching ? '✂️ Stitching In Progress' : '✂️ Start Stitching'}
          </Button>

          <Button
            onClick={() => handleUpdateStatus('ready')}
            disabled={updating || isReady}
            className={`rounded-2xl h-14 text-sm font-black gap-2 transition-all ${
              isReady 
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 cursor-default opacity-90' 
                : 'bg-[#2ECC71] hover:bg-[#27ae60] text-white shadow-md active:scale-95'
            }`}
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {isReady ? '✨ Stitching Complete' : '✨ Mark Complete (Ready)'}
          </Button>
        </div>

        {shop && (
          <Button
            variant="outline"
            onClick={handleNotifyOwner}
            className="w-full bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#0D3D33] font-extrabold rounded-2xl h-12 text-xs gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" /> 💬 Send Status Update to Owner on WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
