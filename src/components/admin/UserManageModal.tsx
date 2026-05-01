import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { doc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

export default function UserManageModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan: user.plan || 'Basic',
    trialActive: user.trialActive || false,
    paymentStatus: user.paymentStatus || 'unpaid',
    features: {
      cms: user.features?.cms ?? false,
      workerAssign: user.features?.workerAssign ?? false,
      whatsapp: user.features?.whatsapp ?? false,
      invoice: user.features?.invoice ?? false,
      imageUpload: user.features?.imageUpload ?? false,
      aiSuggestions: user.features?.aiSuggestions ?? false,
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...formData
      });

      await setDoc(doc(collection(db, 'adminLogs')), {
        action: 'Updated User',
        targetUser: user.name || user.email,
        targetUserId: user.id,
        performedBy: 'admin',
        timestamp: serverTimestamp(),
        details: `Updated plan: ${formData.plan}, Payment: ${formData.paymentStatus}`
      });

      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = () => {
    setFormData(prev => ({ ...prev, trialActive: true }));
    toast.success('Trial set to active (pending save)');
  };

  const handleEndTrial = () => {
    setFormData(prev => ({ ...prev, trialActive: false }));
    toast.success('Trial set to inactive (pending save)');
  };

  const toggleFeature = (key: keyof typeof formData.features) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key]
      }
    }));
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col pt-6"
      >
        <div className="px-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-bold text-slate-900">Manage User</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div>
            <p className="text-slate-500 text-sm">Name</p>
            <p className="font-medium text-slate-900">{user.name || 'No name'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Email</p>
            <p className="font-medium text-slate-900">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Joined</p>
            <p className="font-medium text-slate-900">{formatDate(user.createdAt)}</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-slate-900 mb-2">PLAN</h3>
            <select 
              value={formData.plan} 
              onChange={e => setFormData({...formData, plan: e.target.value})}
              className="w-full p-2 border rounded-md"
            >
              <option value="Basic">Basic - Rs.500</option>
              <option value="Standard">Standard - Rs.1000</option>
              <option value="Premium">Premium - Rs.2000</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-slate-900 mb-2">TRIAL & PAYMENT</h3>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-sm text-slate-500">Trial</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={handleExtendTrial} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">+30 Days</button>
                  <button onClick={handleEndTrial} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">End Trial</button>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 block mb-1">Payment Status</p>
              <select 
                value={formData.paymentStatus} 
                onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="unpaid">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4 pb-12">
            <h3 className="font-bold text-slate-900 mb-2">FEATURE ACCESS</h3>
            <div className="space-y-3">
               {Object.entries(formData.features).map(([key, val]) => (
                 <div key={key} className="flex items-center justify-between border p-2 rounded">
                    <span className="capitalize text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <button 
                      onClick={() => toggleFeature(key as any)}
                      className={`px-3 py-1 text-xs font-bold rounded ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {val ? 'ON ✅' : 'OFF ❌'}
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl font-bold flex justify-center items-center"
          >
            {loading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
