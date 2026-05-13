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
import { motion, AnimatePresence } from 'framer-motion';

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
    
    const unsubscribe = onSnapshot(doc(db, 'settings', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setShop(prev => ({ ...prev, ...data, uiTheme: data.uiTheme || 'neumorphic' }));
        setEditData(prev => ({ ...prev, ...data, uiTheme: data.uiTheme || 'neumorphic' }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
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
      await setDoc(doc(db, 'settings', user.uid), payload, { merge: true });
      setShop(payload);
      setIsEditing(false);
      toast.success(t('settings.settingsSaved') || 'Settings saved successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${user.uid}`);
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
    <div className={cn("w-full max-w-4xl mx-auto pb-32", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-medium text-on-surface">{t('settings.title')}</h1>
          <p className="text-sm text-on-surface-variant mt-1 hidden sm:block">Manage your shop preferences and templates</p>
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 py-6 space-y-8">
        
        {/* Shop Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-3xl border border-outline-variant shadow-sm overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
            <h2 className="text-lg font-medium text-on-surface flex items-center gap-3">
              <Store className="w-5 h-5 text-primary" />
              {t('settings.shopProfile')}
            </h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-primary font-medium text-sm bg-surface border border-outline-variant px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-surface-container transition-colors shadow-soft">
                <Edit2 className="w-4 h-4"/> Edit
              </button>
            )}
          </div>
          
          <div className="p-5 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-start gap-4">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t('settings.shopLogo')}</label>
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center overflow-hidden relative shadow-sm">
                      {editData.logoUrl ? (
                        <img src={editData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-on-surface-variant/50" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="h-10 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-medium hover:bg-surface-container transition-colors shadow-soft flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" /> {editData.logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
                        </button>
                        {editData.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditData(prev => ({ ...prev, logoUrl: '' }))}
                            disabled={uploading}
                            className="h-10 px-4 bg-error/10 text-error rounded-xl text-sm font-medium hover:bg-error/20 transition-colors flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('settings.shopName')}</label>
                    <input 
                      required 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})} 
                      placeholder="My Tailor Shop" 
                      className="w-full h-14 pl-4 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('settings.phoneNumber')}</label>
                    <input 
                      value={editData.phone || ''} 
                      onChange={e => setEditData({...editData, phone: e.target.value})} 
                      placeholder="+1 234 567 8900" 
                      className="w-full h-14 pl-4 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('settings.address')}</label>
                    <input 
                      value={editData.address || ''} 
                      onChange={e => setEditData({...editData, address: e.target.value})} 
                      placeholder="123 Tailor Street" 
                      className="w-full h-14 pl-4 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">{t('settings.invoiceFooter')}</label>
                    <input 
                      value={editData.invoiceFooter || ''} 
                      onChange={e => setEditData({...editData, invoiceFooter: e.target.value})} 
                      placeholder="Thank you!" 
                      className="w-full h-14 pl-4 pr-4 rounded-xl border border-outline-variant bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 text-on-surface font-medium placeholder:font-normal placeholder:text-on-surface-variant outline-none transition-all shadow-sm" 
                    />
                  </div>
                  
                  <div className="mt-8 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
                    <label className="text-sm font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4"/> WhatsApp Templates
                    </label>
                    <p className="text-sm text-on-surface-variant mb-5">Edit the default messages sent to customers.</p>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant mb-2 block">"Order Ready"</label>
                        <textarea 
                          value={editData.messageTemplates?.orderReady || `السلام علیکم *{customerName}* صاحب! 🎉\n\nآپ کا سوٹ تیار ہو گیا ہے۔\n\n📋 *Order Details:*\n• Token: #{tokenId}\n• Dress: {dressType}\n• Shop: {shopName}\n\nبراہ کرم جلد تشریف لائیں۔\nشکریہ 🙏`}
                          onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, orderReady: e.target.value}})}
                          className="w-full p-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 bg-surface text-on-surface outline-none transition-all text-sm h-32 resize-none shadow-sm"
                          dir="auto"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant mb-2 block">"Order Delivered"</label>
                        <textarea 
                          value={editData.messageTemplates?.delivered || `شکریہ *{customerName}* صاحب! \nOrder #{tokenId} deliver ہو گیا۔ \nدوبارہ تشریف لائیں! - {shopName}`}
                          onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, delivered: e.target.value}})}
                          className="w-full p-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 bg-surface text-on-surface outline-none transition-all text-sm h-24 resize-none shadow-sm"
                          dir="auto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
                     <div>
                       <label className="text-sm font-semibold text-on-surface uppercase tracking-wider flex items-center gap-2 mb-1.5">
                          <Bell className="w-4 h-4 text-primary" /> Push Notifications
                       </label>
                       <p className="text-sm text-on-surface-variant">
                          {permission === 'granted' ? <span className="text-secondary font-medium px-2.5 py-1 bg-secondary/10 rounded-full text-xs">Enabled</span> : 'Not enabled'}
                       </p>
                     </div>
                     {permission !== 'granted' && (
                       <button 
                         type="button"
                         onClick={requestPermission} 
                         disabled={isLoading || permission === 'denied'}
                         className="h-10 bg-primary text-white px-5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-soft disabled:opacity-70 flex items-center"
                       >
                         {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
                       </button>
                     )}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button type="button" className="flex-1 h-12 rounded-xl border border-outline-variant bg-surface text-on-surface font-medium hover:bg-surface-container transition-colors" onClick={handleCancel} disabled={saving || uploading}>
                    {t('settings.cancel')}
                  </button>
                  <button type="submit" className="flex-[2] h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-soft flex items-center justify-center gap-2" disabled={saving || uploading}>
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} {t('settings.saveChanges')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-5 py-2">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-surface-container border border-outline-variant shadow-sm flex items-center justify-center overflow-hidden">
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-8 h-8 text-on-surface-variant/50"/>
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-medium text-on-surface">{shop.name || 'Not Set'}</div>
                    <div className="text-sm text-on-surface-variant mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {shop.phone || 'No phone added'}</div>
                  </div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm">
                  <div className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-2">Address</div>
                  <div className="text-base font-medium text-on-surface">{shop.address || 'No address added'}</div>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant shadow-sm">
                  <div className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-2">Invoice Footer</div>
                  <div className="text-base font-medium text-on-surface italic">"{shop.invoiceFooter || 'Thank you for your business!'}"</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Language Selection Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-surface rounded-3xl border border-outline-variant shadow-sm overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-outline-variant bg-surface-container-lowest">
            <h2 className="text-lg font-medium text-on-surface flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              {t('auth.interfaceLanguage')}
            </h2>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className={cn(
                  "flex-1 h-14 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all text-base",
                  language === 'en' ? "border-primary bg-primary/5 text-primary shadow-soft ring-1 ring-primary/20" : "border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
                )}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={cn(
                  "flex-1 h-14 rounded-xl border flex items-center justify-center gap-2 font-medium font-urdu transition-all text-base",
                  language === 'ur' ? "border-primary bg-primary/5 text-primary shadow-soft ring-1 ring-primary/20" : "border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
                )}
                onClick={() => setLanguage('ur')}
              >
                اردو
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant text-center font-semibold uppercase tracking-wider pt-2">
               Select your preferred app language
            </p>
          </div>
        </motion.div>

        {/* Order Templates */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-3xl border border-outline-variant shadow-sm overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-outline-variant bg-surface-container-lowest">
            <h2 className="text-lg font-medium text-on-surface flex items-center gap-3">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              Order Templates
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant flex flex-col items-center">
                 <LayoutTemplate className="w-10 h-10 opacity-20 mb-3" />
                 <span className="font-medium">No templates saved yet.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="flex flex-row items-center justify-between p-4 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                    <div>
                      <div className="font-medium text-on-surface text-base">{template.name}</div>
                      <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mt-1">{template.dressType}</div>
                    </div>
                    <button onClick={() => deleteTemplate(template.id)} className="w-10 h-10 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-error hover:bg-error/10 hover:border-error/20 transition-colors shadow-soft">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Measurement Templates Managers */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
        >
          <MeasurementTemplatesManager />
        </motion.div>

      </div>
    </div>
  );
}
