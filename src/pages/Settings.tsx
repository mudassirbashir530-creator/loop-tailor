import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Edit2, Save, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [shop, setShop] = useState({ name: '', phone: '', address: '', logoUrl: '', invoiceFooter: '' });
  const [editData, setEditData] = useState({ name: '', phone: '', address: '', logoUrl: '', invoiceFooter: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchShop = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'shops', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setShop(prev => ({ ...prev, ...data }));
          setEditData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
      }
    };
    fetchShop();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'shops', user.uid), editData, { merge: true });
      setShop(editData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `shops/${user.uid}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditData(prev => ({ ...prev, logoUrl: url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditData(shop);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 max-w-2xl px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Shop Settings</h1>
        <p className="text-slate-500 mt-2">Manage your tailor shop details and invoice preferences.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Shop Profile</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center sm:items-start gap-4">
                <label className="text-sm font-medium block">Shop Logo</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {editData.logoUrl ? (
                      <img src={editData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-brand-primary animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" /> {editData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-slate-500">Recommended: Square PNG or JPG</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Shop Name</label>
                  <Input required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="My Tailor Shop" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone Number</label>
                  <Input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Address</label>
                  <Input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} placeholder="123 Tailor Street" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Invoice Footer Message</label>
                  <Input value={editData.invoiceFooter || ''} onChange={e => setEditData({...editData, invoiceFooter: e.target.value})} placeholder="Thank you for your business!" />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={saving || uploading}>
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={handleCancel} disabled={saving || uploading}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div className="text-sm font-medium text-slate-500 w-32">Shop Logo</div>
                <div className="h-16 w-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt="Shop Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">Shop Name</div>
                <div className="sm:col-span-2 text-sm font-medium text-slate-900">{shop.name || 'Not set'}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">Phone Number</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.phone || 'Not set'}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">Address</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.address || 'Not set'}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="text-sm font-medium text-slate-500">Invoice Footer</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.invoiceFooter || 'Not set'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
