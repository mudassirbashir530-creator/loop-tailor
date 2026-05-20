import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { doc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

export default function UserManageModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan: user.plan || user.subscriptionPlan || 'Free',
    paymentNote: user.subscription?.paymentNote || '',
    planStartDate: user.subscription?.startDate ? new Date(user.subscription.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    planExpiryDate: user.subscription?.expiryDate ? new Date(user.subscription.expiryDate).toISOString().slice(0, 10) : new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
    isBlocked: user.isBlocked ?? false,
    features: {
      whatsapp: user.permissions?.whatsapp ?? (user.features?.whatsapp || false),
      invoice: user.permissions?.invoice ?? (user.features?.invoice || false),
      imageUpload: user.permissions?.imageUpload ?? (user.features?.imageUpload || false),
      staffManagement: user.permissions?.staffManagement ?? (user.features?.workerAssign || false),
      customerLimit: user.permissions?.customerLimit ?? (user.features?.customerLimit || 10),
      orderLimit: user.permissions?.orderLimit ?? (user.features?.orderLimit || 20),
    }
  });

  const handlePlanChange = (newPlan: string) => {
    let updates = { plan: newPlan, features: { ...formData.features } };
    
    if (newPlan === 'Free') {
      updates.features = {
        ...updates.features,
        whatsapp: false,
        imageUpload: false,
        invoice: false,
        staffManagement: false,
        customerLimit: 10,
        orderLimit: 20
      };
    } else if (newPlan === 'Premium') {
      updates.features = {
        ...updates.features,
        whatsapp: true,
        imageUpload: true,
        invoice: true,
        staffManagement: false,
        customerLimit: 1000,
        orderLimit: 1000
      };
    } else if (newPlan === 'Enterprise') {
      updates.features = {
        ...updates.features,
        whatsapp: true,
        imageUpload: true,
        invoice: true,
        staffManagement: true,
        customerLimit: 99999,
        orderLimit: 99999
      };
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        plan: formData.plan,
        subscriptionPlan: formData.plan,
        isBlocked: formData.isBlocked,
        subscription: {
          startDate: formData.planStartDate,
          expiryDate: formData.planExpiryDate,
          paymentNote: formData.paymentNote,
        },
        permissions: {
          whatsapp: formData.features.whatsapp,
          invoice: formData.features.invoice,
          imageUpload: formData.features.imageUpload,
          staffManagement: formData.features.staffManagement,
          customerLimit: formData.features.customerLimit,
          orderLimit: formData.features.orderLimit,
        },
        features: {
          whatsapp: formData.features.whatsapp,
          invoice: formData.features.invoice,
          imageUpload: formData.features.imageUpload,
          workerAssign: formData.features.staffManagement,
          customerLimit: formData.features.customerLimit,
          orderLimit: formData.features.orderLimit,
        },
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      });

      await setDoc(doc(collection(db, 'adminLogs')), {
        action: 'Updated User Details',
        targetUser: user.name || user.email,
        targetUserId: user.id,
        performedBy: 'admin',
        timestamp: serverTimestamp(),
        details: `Plan: ${formData.plan}${formData.isBlocked ? ' (Blocked)' : ''}`
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

  const handleExtendTrial = async () => {
    try {
      const now = new Date();
      await updateDoc(doc(db, 'users', user.id), {
        trialStartDate: now,
        trialActive: true,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(collection(db, 'adminLogs')), {
        action: 'Extended Trial',
        targetUser: user.name || user.email,
        targetUserId: user.id,
        performedBy: 'admin',
        timestamp: serverTimestamp(),
        details: '+30 Days Trial Added'
      });
      toast.success('Trial set to active (+30 days)');
    } catch (e) {
      toast.error('Failed to update trial');
    }
  };

  const handleEndTrial = async () => {
    try {
      // Set to 30 days ago to expire
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', user.id), {
        trialStartDate: thirtyDaysAgo,
        trialActive: false,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(collection(db, 'adminLogs')), {
        action: 'Ended Trial',
        targetUser: user.name || user.email,
        targetUserId: user.id,
        performedBy: 'admin',
        timestamp: serverTimestamp(),
        details: 'Trial Manually Ended'
      });
      toast.success('Trial ended immediately');
    } catch (e) {
      toast.error('Failed to end trial');
    }
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900">SUBSCRIPTION PLAN</h3>
              <button 
                onClick={() => setFormData(prev => ({ ...prev, isBlocked: !prev.isBlocked }))}
                className={`px-3 py-1 text-xs font-bold rounded ${formData.isBlocked ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                {formData.isBlocked ? 'User Blocked 🚫' : 'Block User'}
              </button>
            </div>
            <select 
              value={formData.plan} 
              onChange={e => handlePlanChange(e.target.value)}
              className="w-full p-2 border rounded-md mb-3"
            >
              <option value="Free">Free</option>
              <option value="Premium">Premium - Rs.500</option>
              <option value="Enterprise">Enterprise - Rs.1000</option>
            </select>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <input 
                  type="date" 
                  value={formData.planStartDate}
                  onChange={(e) => setFormData({...formData, planStartDate: e.target.value})}
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Expiry Date</label>
                <input 
                  type="date" 
                  value={formData.planExpiryDate}
                  onChange={(e) => setFormData({...formData, planExpiryDate: e.target.value})}
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Payment Note</label>
              <input 
                type="text" 
                value={formData.paymentNote}
                placeholder="e.g. Rs 500 received via EasyPaisa"
                onChange={(e) => setFormData({...formData, paymentNote: e.target.value})}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div className="border-t pt-4 pb-12">
            <h3 className="font-bold text-slate-900 mb-3">FEATURE ACCESS & LIMITS</h3>
            <div className="space-y-4">
               {['whatsapp', 'imageUpload', 'invoice', 'staffManagement'].map((key) => (
                 <div key={key} className="flex items-center justify-between border-b pb-2">
                    <span className="capitalize text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <button 
                      onClick={() => toggleFeature(key as keyof typeof formData.features)}
                      className={`px-3 py-1 text-xs font-bold rounded ${formData.features[key as keyof typeof formData.features] ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {formData.features[key as keyof typeof formData.features] ? 'ON ✅' : 'OFF ❌'}
                    </button>
                 </div>
               ))}
               
               <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                   <label className="text-xs font-bold text-slate-700 block mb-1">Customer Limit</label>
                   <input 
                     type="number" 
                     value={formData.features.customerLimit}
                     onChange={(e) => setFormData(prev => ({...prev, features: { ...prev.features, customerLimit: parseInt(e.target.value) || 0 }}))}
                     className="w-full p-2 border rounded-md text-sm"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-700 block mb-1">Order Limit</label>
                   <input 
                     type="number" 
                     value={formData.features.orderLimit}
                     onChange={(e) => setFormData(prev => ({...prev, features: { ...prev.features, orderLimit: parseInt(e.target.value) || 0 }}))}
                     className="w-full p-2 border rounded-md text-sm"
                   />
                 </div>
               </div>
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
