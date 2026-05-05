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
    <div className="space-y-8 max-w-2xl px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-slate-500 mt-2">{t('settings.subtitle')}</p>
      </div>

      <Card className="bg-white rounded-xl shadow p-4 mb-4 border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200/50 bg-transparent px-0 pt-0">
          <CardTitle className="text-xl">{t('settings.shopProfile')}</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('settings.editProfile')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center sm:items-start gap-4">
                <label className="text-sm font-medium block">{t('settings.shopLogo')}</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center overflow-hidden relative group">
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
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {editData.logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
                      </Button>
                      {editData.logoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditData(prev => ({ ...prev, logoUrl: '' }))}
                          disabled={uploading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> Remove Icon
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{t('settings.recommendedLogo')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('settings.shopName')}</label>
                  <div className="relative">
                    <Store className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                    <Input required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="My Tailor Shop" className={cn(isRTL ? "pr-12" : "pl-12")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('settings.phoneNumber')}</label>
                  <div className="relative">
                    <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                    <Input value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="+1 234 567 8900" className={cn(isRTL ? "pr-12" : "pl-12")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('settings.address')}</label>
                  <div className="relative">
                    <MapPin className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                    <Input value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} placeholder="123 Tailor Street" className={cn(isRTL ? "pr-12" : "pl-12")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('settings.invoiceFooter')}</label>
                  <div className="relative">
                    <MessageSquare className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                    <Input value={editData.invoiceFooter || ''} onChange={e => setEditData({...editData, invoiceFooter: e.target.value})} placeholder="Thank you for your business!" className={cn(isRTL ? "pr-12" : "pl-12")} />
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-4 bg-gray-100 shadow-neu-sm rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-bold block text-[#25D366]">WhatsApp Templates</label>
                      <p className="text-xs text-slate-500 mt-1">Customize the messages sent to your customers.</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2 border-t border-gray-200/50">
                    <div>
                      <label className="text-xs font-bold mb-1 block">"Order Ready" Message</label>
                      <p className="text-[10px] text-slate-500 mb-2">Variables: {'{customerName}'}, {'{tokenId}'}, {'{dressType}'}, {'{shopName}'}</p>
                      <textarea 
                        value={editData.messageTemplates?.orderReady || `السلام علیکم *{customerName}* صاحب! 🎉\n\nآپ کا سوٹ تیار ہو گیا ہے۔\n\n📋 *Order Details:*\n• Token: #{tokenId}\n• Dress: {dressType}\n• Shop: {shopName}\n\nبراہ کرم جلد تشریف لائیں۔\nشکریہ 🙏`}
                        onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, orderReady: e.target.value}})}
                        className="w-full h-32 p-3 text-sm rounded-xl bg-white shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-[#25D366]/20 outline-none"
                        dir="auto"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">"Order Delivered" Message</label>
                      <p className="text-[10px] text-slate-500 mb-2">Variables: {'{customerName}'}, {'{tokenId}'}, {'{shopName}'}</p>
                      <textarea 
                        value={editData.messageTemplates?.delivered || `شکریہ *{customerName}* صاحب! \nOrder #{tokenId} deliver ہو گیا۔ \nدوبارہ تشریف لائیں! - {shopName}`}
                        onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, delivered: e.target.value}})}
                        className="w-full h-20 p-3 text-sm rounded-xl bg-white shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-[#25D366]/20 outline-none"
                        dir="auto"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">"Payment Reminder" Message</label>
                      <p className="text-[10px] text-slate-500 mb-2">Variables: {'{customerName}'}, {'{balance}'}, {'{shopName}'}</p>
                      <textarea 
                        value={editData.messageTemplates?.paymentReminder || `*{customerName}* صاحب، \nآپ کا بقایا *PKR {balance}* ہے۔ \n- {shopName}`}
                        onChange={(e) => setEditData({...editData, messageTemplates: {...editData.messageTemplates, paymentReminder: e.target.value}})}
                        className="w-full h-20 p-3 text-sm rounded-xl bg-white shadow-neu-pressed-sm border-none focus:ring-2 focus:ring-[#25D366]/20 outline-none"
                        dir="auto"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 bg-gray-100 shadow-neu-sm rounded-2xl border-t border-gray-200/50 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-bold block text-brand-primary flex items-center gap-2">
                        <Bell className="h-4 w-4" /> 
                        Browser Push Notifications
                      </label>
                      <p className="text-xs text-slate-500 mt-1">Get desktop/mobile alerts when orders are ready.</p>
                      <p className="text-xs mt-1 font-medium">
                        Status: {
                          permission === 'granted' ? <span className="text-emerald-500">Enabled ✅</span> : 
                          permission === 'denied' ? <span className="text-rose-500">Blocked ❌</span> : 
                          <span className="text-amber-500">Not Requested</span>
                        }
                      </p>
                    </div>
                    {permission !== 'granted' && (
                      <Button 
                        type="button"
                        onClick={requestPermission} 
                        disabled={isLoading || permission === 'denied'}
                        className="bg-brand-primary text-white shadow-neu-sm hover:shadow-neu-pressed-sm rounded-xl h-10 px-4 font-bold border-none"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable'}
                      </Button>
                    )}
                  </div>
                  {permission === 'granted' && window.location.hostname.includes('localhost') && (
                    <div className="pt-2">
                       <Button 
                          type="button"
                          onClick={() => {
                            // Test local notification since we might not have full FCM backend tested
                            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                              navigator.serviceWorker.ready.then(registration => {
                                registration.showNotification('Test Notification', {
                                  body: 'This is a test push notification from Loop Tailor.',
                                  icon: '/icon-192x192.svg'
                                });
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full text-xs bg-gray-100 shadow-neu-sm hover:shadow-neu-pressed-sm rounded-xl h-9 border-none font-bold text-slate-500"
                       >
                         Send Test Notification
                       </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={saving || uploading}>
                  <Save className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {saving ? t('settings.saving') : t('settings.saveChanges')}
                </Button>
                <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={handleCancel} disabled={saving || uploading}>
                  <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('settings.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div className="text-sm font-medium text-slate-500 w-32">{t('settings.shopLogo')}</div>
                <div className="h-16 w-16 rounded-lg bg-gray-100 shadow-neu-pressed-sm flex items-center justify-center overflow-hidden">
                  {shop.logoUrl ? (
                    <img src={shop.logoUrl} alt="Shop Logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-300" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">{t('settings.shopName')}</div>
                <div className="sm:col-span-2 text-sm font-medium text-slate-900">{shop.name || t('settings.notSet')}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">{t('settings.phoneNumber')}</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.phone || t('settings.notSet')}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">{t('settings.address')}</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.address || t('settings.notSet')}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-slate-100 pb-4">
                <div className="text-sm font-medium text-slate-500">{t('settings.invoiceFooter')}</div>
                <div className="sm:col-span-2 text-sm text-slate-900">{shop.invoiceFooter || t('settings.notSet')}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="text-sm font-medium text-slate-500">WhatsApp Alerts</div>
                <div className="sm:col-span-2 text-sm text-slate-900">
                  <span className={cn("px-2 py-1 rounded-lg text-xs font-bold", shop.enableWhatsappNotifications ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {shop.enableWhatsappNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl shadow p-4 mb-4 border-none">
        <CardHeader className="border-b border-gray-200/50 bg-transparent px-0 pt-0">
          <CardTitle className="text-xl">Order Templates</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500">No templates saved yet. Save templates from the Quick Order form.</p>
            ) : (
              templates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-4 rounded-2xl shadow-neu-sm bg-gray-100">
                  <div>
                    <div className="font-bold text-slate-900">{template.name}</div>
                    <div className="text-sm text-slate-500">{template.dressType} • <span className="capitalize">{template.gender}</span></div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template.id)} className="text-red-500 hover:text-red-600 hover:shadow-neu-pressed-sm rounded-xl">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl shadow p-4 mb-4 border-none">
        <CardHeader className="border-b border-gray-200/50 bg-transparent px-0 pt-0">
          <CardTitle className="text-xl">{t('auth.interfaceLanguage')}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              className={cn(
                "h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold transition-all",
                language === 'en' ? "bg-brand-primary shadow-lg shadow-brand-primary/20" : "border-slate-200 text-slate-500"
              )}
              onClick={() => setLanguage('en')}
            >
              <Globe className="h-5 w-5" />
              English
            </Button>
            <Button
              variant={language === 'ur' ? 'default' : 'outline'}
              className={cn(
                "h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-bold font-urdu transition-all",
                language === 'ur' ? "bg-brand-primary shadow-lg shadow-brand-primary/20" : "border-slate-200 text-slate-500"
              )}
              onClick={() => setLanguage('ur')}
            >
              <Globe className="h-5 w-5" />
              اردو
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4 px-1">
            {t('auth.selectLanguage')}
          </p>
        </CardContent>
      </Card>

      <MeasurementTemplatesManager />
    </div>
  );
}
