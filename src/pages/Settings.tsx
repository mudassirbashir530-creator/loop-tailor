import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Edit2, Save, X, Upload, Image as ImageIcon, Loader2, Store, Phone, MapPin, MessageSquare, Globe, Trash2, LayoutTemplate } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOrderTemplates } from '../hooks/useOrderTemplates';
import { toast } from 'sonner';
import { MeasurementTemplatesManager } from '../components/MeasurementTemplatesManager';

export interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  logoUrl: string;
  invoiceFooter: string;
  uiTheme: 'neumorphic' | 'minimalist' | 'elegant';
  enableWhatsappNotifications: boolean;
  messageTemplates?: {
    orderReady?: string;
    delivered?: string;
    paymentReminder?: string;
  };
}

import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { permission, token, isLoading, requestPermission } = usePushNotifications();
  const [shop, setShop] = useState<ShopSettings>({ name: '', phone: '', address: '', logoUrl: '', invoiceFooter: '', uiTheme: 'neumorphic', enableWhatsappNotifications: false });
  const [editData, setEditData] = useState<ShopSettings>({ name: '', phone: '', address: '', logoUrl: '', invoiceFooter: '', uiTheme: 'neumorphic', enableWhatsappNotifications: false });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { templates, deleteTemplate } = useOrderTemplates(user?.uid);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(doc(db, 'shops', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setShop(prev => ({ ...prev, ...data, uiTheme: data.uiTheme || 'neumorphic' }));
        setEditData(prev => ({ ...prev, ...data, uiTheme: data.uiTheme || 'neumorphic' }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `shops/${user.uid}`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        ...editData,
        name: editData.name || shop.name, // Ensure name is always included
      };
      await setDoc(doc(db, 'shops', user.uid), payload, { merge: true });
      setShop(payload);
      setIsEditing(false);
      toast.success(t('settings.settingsSaved') || 'Settings saved successfully');
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
      /* BETA: Image upload is disabled
      const storageRef = ref(storage, `shops/${user.uid}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditData(prev => ({ ...prev, logoUrl: url }));
      */
      
      // Use local preview instead
      const url = URL.createObjectURL(file);
      setEditData(prev => ({ ...prev, logoUrl: url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditData(shop);
    setIsEditing(false);
  };

  return (
    <div className={cn("page pb-[100px]", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-white border-b border-[#E2DDD6] px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-xl font-bold text-[#111111]">{t('settings.title')}</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        
        {/* Shop Profile Card */}
        <div className="card shadow-sm !m-0 !p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E2DDD6] flex items-center justify-between bg-[#F7F5F0]">
            <h2 className="text-[16px] font-bold text-[#111111] flex items-center gap-2">
              <Store className="w-5 h-5 text-[#0D3D33]" />
              {t('settings.shopProfile')}
            </h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-[#0D3D33] font-bold text-sm bg-white border border-[#E2DDD6] px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Edit2 className="w-4 h-4"/> Edit
              </button>
            )}
          </div>
          
          <div className="p-4">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <label className="text-sm font-bold text-[#555555] uppercase tracking-wider">{t('settings.shopLogo')}</label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] flex items-center justify-center overflow-hidden relative group">
                      {editData.logoUrl ? (
                        <img src={editData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-[#888888]" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-[#0D3D33] animate-spin" />
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
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="btn-outline !py-1.5 text-xs text-[#111111] flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> {editData.logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
                        </button>
                        {editData.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditData(prev => ({ ...prev, logoUrl: '' }))}
                            disabled={uploading}
                            className="bg-[#E53935]/10 text-[#E53935] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wider mb-1 block">{t('settings.shopName')}</label>
                    <input 
                      required 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})} 
                      placeholder="My Tailor Shop" 
                      className="w-full h-12 px-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] font-bold text-[#111111] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wider mb-1 block">{t('settings.phoneNumber')}</label>
                    <input 
                      value={editData.phone || ''} 
                      onChange={e => setEditData({...editData, phone: e.target.value})} 
                      placeholder="+1 234 567 8900" 
                      className="w-full h-12 px-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] font-bold text-[#111111] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wider mb-1 block">{t('settings.address')}</label>
                    <input 
                      value={editData.address || ''} 
                      onChange={e => setEditData({...editData, address: e.target.value})} 
                      placeholder="123 Tailor Street" 
                      className="w-full h-12 px-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] font-bold text-[#111111] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-[#555555] uppercase tracking-wider mb-1 block">{t('settings.invoiceFooter')}</label>
                    <input 
                      value={editData.invoiceFooter || ''} 
                      onChange={e => setEditData({...editData, invoiceFooter: e.target.value})} 
                      placeholder="Thank you!" 
                      className="w-full h-12 px-4 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0] focus:bg-white focus:border-[#0D3D33] font-bold text-[#111111] outline-none" 
                    />
                  </div>
                  
                  <div className="mt-8 p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD6]">
                    <label className="text-[12px] font-bold text-[#2ECC71] uppercase tracking-wider mb-1 block flex items-center gap-2">
                       <MessageSquare className="w-4 h-4"/> WhatsApp Templates
                    </label>
                    <p className="text-xs text-[#555555] mb-4">Edit the default messages sent to customers.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold mb-1 text-[#111111] block">"Order Ready"</label>
                        <textarea 
                          value={editData.messageTemplates?.orderReady || `السلام علیکم *{customerName}* صاحب! 🎉\n\nآپ کا سوٹ تیار ہو گیا ہے۔\n\n📋 *Order Details:*\n• Token: #{tokenId}\n• Dress: {dressType}\n• Shop: {shopName}\n\nبراہ کرم جلد تشریف لائیں۔\nشکریہ 🙏`}
                          onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, orderReady: e.target.value}})}
                          className="w-full p-3 rounded-lg border border-[#E2DDD6] outline-none focus:border-[#0D3D33] text-sm h-28 resize-none"
                          dir="auto"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold mb-1 text-[#111111] block">"Order Delivered"</label>
                        <textarea 
                          value={editData.messageTemplates?.delivered || `شکریہ *{customerName}* صاحب! \nOrder #{tokenId} deliver ہو گیا۔ \nدوبارہ تشریف لائیں! - {shopName}`}
                          onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, delivered: e.target.value}})}
                          className="w-full p-3 rounded-lg border border-[#E2DDD6] outline-none focus:border-[#0D3D33] text-sm h-16 resize-none"
                          dir="auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F7F5F0] rounded-xl border border-[#E2DDD6] flex items-center justify-between">
                     <div>
                       <label className="text-[12px] font-bold text-[#111111] uppercase tracking-wider block flex items-center gap-2 mb-1">
                          <Bell className="w-4 h-4 text-[#0D3D33]" /> Push Notifications
                       </label>
                       <p className="text-[11px] text-[#555555]">
                          {permission === 'granted' ? <span className="text-[#2ECC71] font-bold">Enabled</span> : 'Not enabled'}
                       </p>
                     </div>
                     {permission !== 'granted' && (
                       <button 
                         type="button"
                         onClick={requestPermission} 
                         disabled={isLoading || permission === 'denied'}
                         className="bg-[#0D3D33] text-white px-4 py-2 rounded-lg text-xs font-bold"
                       >
                         {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
                       </button>
                     )}
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button type="button" className="btn-outline flex-1 h-12" onClick={handleCancel} disabled={saving || uploading}>
                    {t('settings.cancel')}
                  </button>
                  <button type="submit" className="btn-primary flex-1 h-12 flex items-center justify-center gap-2" disabled={saving || uploading}>
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} {t('settings.saveChanges')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-2">
                  <div className="h-14 w-14 rounded-xl bg-[#F7F5F0] border border-[#E2DDD6] flex items-center justify-center overflow-hidden">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Store className="w-6 h-6 text-[#888888]"/>
                    )}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#111111]">{shop.name || 'Not Set'}</div>
                    <div className="text-sm text-[#555555]">{shop.phone || 'No phone added'}</div>
                  </div>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 border border-[#E2DDD6]">
                  <div className="text-xs text-[#555555] uppercase tracking-wider font-bold mb-1">Address</div>
                  <div className="text-sm font-medium text-[#111111]">{shop.address || 'No address added'}</div>
                </div>
                <div className="bg-[#F7F5F0] rounded-xl p-3 border border-[#E2DDD6]">
                  <div className="text-xs text-[#555555] uppercase tracking-wider font-bold mb-1">Invoice Footer</div>
                  <div className="text-sm font-medium text-[#111111] italic">"{shop.invoiceFooter || 'Thank you for your business!'}"</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="card shadow-sm !m-0 !p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E2DDD6] bg-[#F7F5F0]">
            <h2 className="text-[16px] font-bold text-[#111111] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0D3D33]" />
              {t('auth.interfaceLanguage')}
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
              <button
                className={cn(
                  "flex-1 h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all text-sm",
                  language === 'en' ? "border-[#0D3D33] bg-[#0D3D33]/5 text-[#0D3D33]" : "border-[#E2DDD6] bg-[#F7F5F0] text-[#555555]"
                )}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={cn(
                  "flex-1 h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-bold font-urdu transition-all text-sm",
                  language === 'ur' ? "border-[#0D3D33] bg-[#0D3D33]/5 text-[#0D3D33]" : "border-[#E2DDD6] bg-[#F7F5F0] text-[#555555]"
                )}
                onClick={() => setLanguage('ur')}
              >
                اردو
              </button>
            </div>
            <p className="text-[11px] text-[#888888] text-center font-bold uppercase tracking-wider">
               Select your preferred app language
            </p>
          </div>
        </div>

        {/* Order Templates */}
        <div className="card shadow-sm !m-0 !p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E2DDD6] bg-[#F7F5F0]">
            <h2 className="text-[16px] font-bold text-[#111111] flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[#0D3D33]" />
              Order Templates
            </h2>
          </div>
          <div className="p-4">
            {templates.length === 0 ? (
              <div className="text-center py-6 text-[#555555] text-sm">
                 <LayoutTemplate className="w-8 h-8 opacity-20 mx-auto mb-2" />
                 No templates saved yet.
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="flex flex-row items-center justify-between p-3 rounded-xl border border-[#E2DDD6] bg-[#F7F5F0]">
                    <div>
                      <div className="font-bold text-[#111111] text-sm">{template.name}</div>
                      <div className="text-xs text-[#555555] uppercase tracking-wider mt-0.5">{template.dressType}</div>
                    </div>
                    <button onClick={() => deleteTemplate(template.id)} className="w-8 h-8 rounded-lg bg-white border border-[#E2DDD6] flex items-center justify-center text-[#E53935] shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Measurement Templates Managers */}
        <MeasurementTemplatesManager />

      </div>
    </div>
  );
}
