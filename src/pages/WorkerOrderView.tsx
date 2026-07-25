import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatWhatsAppNumber, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Scissors, CheckCircle, Clock, Shirt, MessageSquare, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
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
      toast.success(`Order status updated to ${newStatus.toUpperCase()}!`);
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

    const msg = `✂️ *WORKER STATUS UPDATE* ✂️
Order Token: #${token}
Customer: ${order.customerName}
Dress: ${order.clothingType}
Status: *${(order.status || 'STITCHING').toUpperCase()}*

Hello Boss! Suit stitching for order #${token} is ${order.status === 'ready' ? 'COMPLETE & READY!' : 'IN PROGRESS.'}`;

    const encoded = encodeURIComponent(msg);
    const url = formatted 
      ? `https://wa.me/${formatted}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Scissors className="w-10 h-10 animate-bounce mx-auto text-emerald-400" />
          <p className="text-sm font-bold text-slate-300">Loading Order Worksheet...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-slate-700">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Order Not Found</h2>
          <p className="text-xs text-slate-400">This order worksheet link may be invalid or deleted.</p>
        </div>
      </div>
    );
  }

  const tokenNumber = order.tokenId || order.id?.substring(0, 8).toUpperCase();
  const measurements = order.measurements || {};
  const hasMeasurements = Object.keys(measurements).length > 0 && Object.values(measurements).some(v => v !== null && v !== undefined && v !== '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-[#0D3D33] to-[#082620] p-5 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-xl border border-emerald-500/40">
              ✂️
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">TAILOR WORKSHEET</span>
              <h1 className="text-2xl font-mono font-black text-white">#{tokenNumber}</h1>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              order.status === 'ready' 
                ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' 
                : order.status === 'stitching' 
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
            }`}>
              {order.status || 'PENDING'}
            </span>
            <p className="text-[11px] text-slate-300 mt-1 font-semibold">Delivery: {formatDate(order.deliveryDate)}</p>
          </div>
        </div>
      </div>

      {/* Customer & Garment Details */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Shirt className="w-4 h-4 text-emerald-400" /> Garment & Customer Specs
        </h2>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Customer Name</span>
            <span className="font-extrabold text-white text-sm mt-0.5 block">{order.customerName || 'Customer'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Clothing Type</span>
            <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">{order.clothingType || 'Custom Suit'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Service Category</span>
            <span className="font-bold text-slate-200 mt-0.5 block">{order.serviceCategory || 'Bespoke'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Rack Location</span>
            <span className="font-bold text-amber-400 mt-0.5 block">{order.rackLocation || 'Assigned'}</span>
          </div>
        </div>

        {/* Special Stitching Notes */}
        {order.designNotes && (
          <div className="bg-amber-950/40 p-4 rounded-2xl border border-amber-500/40 space-y-1">
            <span className="text-amber-400 font-black text-xs uppercase tracking-wider block flex items-center gap-1.5">
              ⚠️ STITCHING INSTRUCTIONS & NOTES
            </span>
            <p className="text-slate-100 text-sm font-semibold leading-relaxed">{order.designNotes}</p>
          </div>
        )}
      </div>

      {/* Large Measurement Grid for Stitching Machine Reading */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          📐 EXACT MEASUREMENTS CARD (SIZES)
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
                <div key={key} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-slate-400 font-extrabold text-[10px] uppercase block tracking-wider">{friendlyLabel}</span>
                  <span className="font-black text-emerald-400 text-2xl block">{String(value)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
            No specific measurements entered for this suit.
          </div>
        )}
      </div>

      {/* Worker One-Click Actions */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          ⚡ WORKER LIVE ACTIONS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => handleUpdateStatus('stitching')}
            disabled={updating || order.status === 'stitching'}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl h-14 text-sm gap-2"
          >
            <Scissors className="w-5 h-5" /> ✂️ Start Stitching
          </Button>

          <Button
            onClick={() => handleUpdateStatus('ready')}
            disabled={updating || order.status === 'ready'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-14 text-sm gap-2"
          >
            <CheckCircle className="w-5 h-5" /> ✨ Stitching Complete (Ready)
          </Button>
        </div>

        {shop && (
          <Button
            variant="outline"
            onClick={handleNotifyOwner}
            className="w-full bg-slate-950 hover:bg-slate-800 border-slate-700 text-emerald-400 font-bold rounded-2xl h-12 text-xs gap-2 mt-2"
          >
            <MessageSquare className="w-4 h-4" /> 💬 Notify Shop Owner on WhatsApp
          </Button>
        )}
      </div>
    </div>
  );
}
