import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatWhatsAppNumber, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Scissors, CheckCircle2, Clock, Shirt, MessageSquare, AlertCircle, Sparkles, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkerOrderView() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsubOrder = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        const oData: any = { id: docSnap.id, ...docSnap.data() };
        setOrder(oData);

        if (oData.userId) {
          onSnapshot(doc(db, 'shops', oData.userId), (shopSnap) => {
            if (shopSnap.exists()) {
              setShop(shopSnap.data());
            }
          });
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Worker order fetch error:", err);
      setLoading(false);
    });

    return () => unsubOrder();
  }, [id]);

  const handleUpdateStatus = async (newStatus: 'stitching' | 'ready') => {
    if (!id || !order) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
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

    const msg = `✂️ *WORKER STATUS UPDATE — ${shop?.name || 'LOOP TAILOR'}*
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

        {shop?.name && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
            <span className="font-semibold">🏪 {shop.name}</span>
            {shop.phone && <span>📞 {shop.phone}</span>}
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
        {order.designNotes && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-amber-900 font-black text-xs uppercase tracking-wider block flex items-center gap-1.5">
              ⚠️ STITCHING INSTRUCTIONS & NOTES
            </span>
            <p className="text-slate-800 text-sm font-semibold leading-relaxed">{order.designNotes}</p>
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
            <Scissors className="w-5 h-5" /> 
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
            <CheckCircle2 className="w-5 h-5" /> 
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
