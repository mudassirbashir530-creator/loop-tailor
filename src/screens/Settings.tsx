import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Crown, Bell, MessageSquare, Globe, Palette, HelpCircle, LogOut, ChevronRight, Moon, Sun, Smartphone, Check, UserCircle, X, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth, PLAN_DETAILS } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { PLANS } from '../constants/plans';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { openWhatsApp } from '../lib/whatsapp';
import { uploadToCloudinary } from '../lib/cloudinary';
import { CloudinaryImage } from '../lib/types';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const COUNTRY_CODES = [
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
];

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413z"/>
  </svg>
);

import { safeStorage } from '../lib/safeStorage';

export default function Settings() {
  const navigate = useNavigate();
  const { user, userData, logOut } = useAuth();
  const { settings, loading: settingsLoading } = useShop();
  const { usage } = usePlanLimits();
  
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState<string | CloudinaryImage | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditingProfile, setIsEditingProfileState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingProfileRef = React.useRef(false);

  const setIsEditingProfile = (val: boolean) => {
    isEditingProfileRef.current = val;
    setIsEditingProfileState(val);
  };

  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+92');

  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [theme, setTheme] = useState<'light'|'dark'|'system'>('system');

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState({
    orderReceived: 'Hi {customerName}, your order #{orderId} for {clothingType} has been received. Total: {totalPrice}, Advance: {advanceAmount}. Delivery expected by {deliveryDate}.',
    stitchingStarted: 'Hi {customerName}, great news! Stitching for your order #{orderId} has started.',
    readyForDelivery: 'Hi {customerName}, your order #{orderId} is ready for delivery! Please collect it. Remaining amount: {remainingAmount}.',
    paymentPending: 'Hi {customerName}, a friendly reminder for remaining payment of {remainingAmount} for order #{orderId}.',
    deliveredSuccessfully: 'Hi {customerName}, your order #{orderId} has been delivered successfully. Thank you for choosing us!'
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Auto load profile when Settings opens from users collection
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists() && !isEditingProfileRef.current) {
        const data = docSnap.data();
        setShopName(data.shopName || '');
        setPhone(data.phone || '');
        setOwnerName(data.ownerName || '');
        setWhatsappNumber(data.whatsappNumber || '');
        setAddress(data.address || '');
        setBusinessDescription(data.businessDescription || '');
        setShopLogo(data.shopLogo || null);
        setSelectedCountryCode(data.countryCode || '+92');
        if (data.theme) {
          setTheme(data.theme);
          safeStorage.setItem('theme', data.theme);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (settings && !isEditingProfileRef.current) {
      setShopName(prev => prev || settings.name || '');
      setPhone(prev => prev || settings.phone || '');
      setOwnerName(prev => prev || settings.ownerName || '');
      setWhatsappNumber(prev => prev || settings.whatsappNumber || '');
      setAddress(prev => prev || settings.address || '');
      setBusinessDescription(prev => prev || settings.businessDescription || '');
      setShopLogo(prev => prev || settings.shopLogo || null);
      setSelectedCountryCode(prev => prev || settings.countryCode || '+92');
      if (settings.templates) {
        setTemplates(prev => ({ ...prev, ...settings.templates }));
      }
      setNotificationsEnabled(settings.enableWhatsappNotifications ?? true);
      
      const savedTheme = safeStorage.getItem('theme') as any;
      if (savedTheme && theme === 'system') {
        setTheme(savedTheme);
      }
    }
  }, [settings]);

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Logged out successfully");
      navigate('/auth/login');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const currentPlan = userData?.plan || userData?.subscriptionPlan || 'Free';

  const handleUpgradePlan = (selectedPlanName: string) => {
    const userEmail = user?.email || 'N/A';
    const msg = `Hi, I want to upgrade my Loop Tailor\nplan to ${selectedPlanName}.\nMy account: ${userEmail}`;
    openWhatsApp('03321379924', msg);
  };

  const handleUpdateProfile = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    // Basic validation
    if (!shopName?.trim()) {
      toast.error("Shop name is required");
      return;
    }
    
    setIsSaving(true);
    try {
      let finalLogoUrl = typeof shopLogo === 'string' ? shopLogo : (shopLogo?.url || null);
      if (logoFile) {
        const uploadedLogo = await uploadToCloudinary(logoFile, setUploadProgress);
        finalLogoUrl = typeof uploadedLogo === 'string' ? uploadedLogo : (uploadedLogo?.url || null);
      }

      const updateDataSettings: any = {
        name: shopName || "",
        phone: phone || "",
        ownerName: ownerName || "",
        whatsappNumber: whatsappNumber || "",
        address: address || "",
        businessDescription: businessDescription || "",
        shopLogo: finalLogoUrl,
        countryCode: selectedCountryCode || "+92"
      };

      const updateDataUsers: any = {
        uid: user.uid,
        shopName: shopName || "",
        ownerName: ownerName || "",
        email: user.email || "",
        phone: phone || "",
        whatsappNumber: whatsappNumber || "",
        countryCode: selectedCountryCode || "+92",
        address: address || "",
        businessDescription: businessDescription || "",
        shopLogo: finalLogoUrl,
        theme: theme || "system",
        subscriptionPlan: user.email === "mudassirbashir530@gmail.com" ? "Premium Plan" : "Free Plan",
        updatedAt: serverTimestamp()
      };

      // Remove undefined values to prevent Firestore error
      Object.keys(updateDataSettings).forEach(key => updateDataSettings[key] === undefined && delete updateDataSettings[key]);
      Object.keys(updateDataUsers).forEach(key => updateDataUsers[key] === undefined && delete updateDataUsers[key]);

      // Save to users collection (primary)
      await setDoc(doc(db, 'users', user.uid), updateDataUsers, { merge: true });
      
      // Save to settings collection for backward compatibility
      await setDoc(doc(db, 'settings', user.uid), updateDataSettings, { merge: true });

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      setLogoFile(null);
      setUploadProgress(0);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettingsField = async (field: string, value: any) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'settings', user.uid), { [field]: value }, { merge: true });
      toast.success("Settings saved");
    } catch (error: any) {
      console.error(`Failed to save ${field}:`, error);
      toast.error(error.message || "Failed to save settings");
    }
  }

  const handleThemeChange = async (newTheme: 'light'|'dark'|'system') => {
    if (!user) return;
    try {
      setTheme(newTheme);
      safeStorage.setItem('theme', newTheme);
      
      const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      await setDoc(doc(db, 'users', user.uid), { theme: newTheme, updatedAt: serverTimestamp() }, { merge: true });

      toast.success(`Theme switched to ${newTheme}`);
    } catch (error: any) {
      console.error("Theme switch failed:", error);
      toast.error(error.message || "Failed to update appearance settings");
    }
  }

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto w-full max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          {shopLogo || settings?.shopLogo ? (
            <img 
              src={typeof (shopLogo || settings?.shopLogo) === 'string' ? (shopLogo || settings?.shopLogo) as string : ((shopLogo || settings?.shopLogo) as CloudinaryImage)?.url} 
              className="h-16 w-16 rounded-full border-2 border-white/50 object-cover bg-white shadow-sm" 
              alt="logo" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-white text-primary flex items-center justify-center text-xl font-bold shadow-sm uppercase shrink-0">
              {shopName?.substring(0, 2) || user?.displayName?.substring(0, 2) || 'LT'}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{shopName || user?.displayName || 'Your Tailor Shop'}</h2>
            <p className="text-primary-foreground/80 text-sm">{phone || user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        
        {/* Shop Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Shop Information</h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <SettingsRow 
                icon={<Store className="h-5 w-5 text-blue-600" />} 
                title="Shop Profile" 
                subtitle="Edit name and details" 
                onClick={() => setIsEditingProfile(true)}
              />
              <SettingsRow 
                icon={<UserCircle className="h-5 w-5 text-purple-500" />} 
                title="Workers Management" 
                subtitle="Manage your staff and performance" 
                onClick={() => navigate('/app/workers')}
              />
              <SettingsRow 
                icon={<FileText className="h-5 w-5 text-green-500" />} 
                title="Staff Payroll" 
                subtitle="Manage monthly salaries and payments" 
                onClick={() => navigate('/app/payroll')}
              />
              <SettingsRow 
                icon={<Crown className="h-5 w-5 text-accent" />} 
                title="Subscription Plan" 
                subtitle={`${currentPlan} Plan (Active)`}
                rightElement={<span className="bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-md">Upgrade</span>}
                onClick={() => setIsPricingOpen(true)}
              />
            </div>
          </Card>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Preferences</h3>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              <SettingsRow onClick={() => setIsNotificationsOpen(true)} icon={<Bell className="h-5 w-5 text-orange-500" />} title="Notifications" subtitle={notificationsEnabled ? "Enabled" : "Disabled"} />
              <SettingsRow onClick={() => setIsTemplatesOpen(true)} icon={<MessageSquare className="h-5 w-5 text-emerald-500" />} title="WhatsApp Templates" subtitle="Customize auto-messages" />
              <SettingsRow 
                icon={<Globe className="h-5 w-5 text-indigo-500" />} 
                title="Country Code" 
                subtitle={`Default: ${selectedCountryCode}`}
                onClick={() => setIsCountryCodeOpen(true)}
              />
              <SettingsRow onClick={() => setIsAppearanceOpen(true)} icon={<Palette className="h-5 w-5 text-pink-500" />} title="Appearance" subtitle={`Theme: ${theme}`} />
            </div>
          </Card>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Support</h3>
          <Card className="overflow-hidden">
            <SettingsRow onClick={() => setIsHelpOpen(true)} icon={<HelpCircle className="h-5 w-5 text-purple-500" />} title="Help & Support" subtitle="Get help or contact us" />
          </Card>
        </div>

        {/* Logout */}
        <Card className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer" onClick={handleLogout}>
          <CardContent className="p-4 flex items-center gap-3 text-destructive">
            <LogOut className="h-5 w-5" />
            <span className="font-semibold">Sign out of your account</span>
          </CardContent>
        </Card>

      </div>

      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Shop Profile</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2 space-y-2 mb-4">
              <label className="text-sm font-semibold text-foreground">Shop Logo</label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <label className="relative flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-all flex items-center justify-center overflow-hidden bg-muted/20">
                    {logoFile || shopLogo ? (
                      <img 
                        src={logoFile ? URL.createObjectURL(logoFile) : (typeof shopLogo === 'string' ? shopLogo : shopLogo?.url)} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        alt="logo" 
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setLogoFile(file);
                    }} />
                  </label>
                  {(logoFile || shopLogo) && (
                    <button 
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setShopLogo(null);
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">Upload your shop logo. This will appear on all invoices and WhatsApp shares.</p>
                  {uploadProgress > 0 && (
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Shop Name</label>
              <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Al-Madina Tailors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Owner Name</label>
              <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Phone Number</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0300 1234567" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">WhatsApp Number</label>
              <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="Same as phone" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Shop 12, Main Street" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Business Description</label>
              <Textarea value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} placeholder="Specialists in..." className="resize-none h-28" />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isSaving} className="mt-6 md:col-span-2 h-12 text-base font-semibold shadow-lg shadow-primary/20">
              {isSaving ? "Saving..." : "Save Profile Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Templates Dialog */}
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">WhatsApp Templates</DialogTitle>
            <DialogDescription className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
              <span className="font-semibold block mb-1">Available Variables:</span>
              <code className="text-xs text-primary">{'{customerName}'}, {'{orderId}'}, {'{clothingType}'}, {'{totalPrice}'}, {'{advanceAmount}'}, {'{deliveryDate}'}, {'{remainingAmount}'}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Order Received</label>
              <Textarea 
                value={templates.orderReceived} 
                onChange={e => setTemplates({...templates, orderReceived: e.target.value})} 
                className="h-24 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Stitching Started</label>
              <Textarea 
                value={templates.stitchingStarted} 
                onChange={e => setTemplates({...templates, stitchingStarted: e.target.value})} 
                className="h-24 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Ready for Delivery</label>
              <Textarea 
                value={templates.readyForDelivery} 
                onChange={e => setTemplates({...templates, readyForDelivery: e.target.value})} 
                className="h-24 resize-none"
              />
            </div>
            <div className="space-y-2 text-right">
                <Button onClick={() => {
                  saveSettingsField('templates', templates);
                  setIsTemplatesOpen(false);
                }} className="shadow-lg">Save All Templates</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCountryCodeOpen} onOpenChange={setIsCountryCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Country</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Search by name or code (+92)..." 
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              className="w-full"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredCountries.map((country, idx) => (
                <div 
                  key={idx} 
                  className="p-3 hover:bg-muted cursor-pointer rounded-lg flex items-center justify-between"
                  onClick={() => {
                     setSelectedCountryCode(country.code);
                     saveSettingsField('countryCode', country.code);
                     if (user) {
                       setDoc(doc(db, 'users', user.uid), { countryCode: country.code, updatedAt: serverTimestamp() }, { merge: true });
                     }
                     setIsCountryCodeOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium">{country.name}</span>
                  </div>
                  <span className="text-muted-foreground">{country.code}</span>
                </div>
              ))}
              {filteredCountries.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">No countries found.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appearance Dialog */}
      <Dialog open={isAppearanceOpen} onOpenChange={setIsAppearanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appearance</DialogTitle>
            <DialogDescription>Customize how Loop Tailor looks on your device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {[
              { id: 'light', icon: <Sun className="h-5 w-5" />, label: 'Light Mode' },
              { id: 'dark', icon: <Moon className="h-5 w-5" />, label: 'Dark Mode' },
              { id: 'system', icon: <Smartphone className="h-5 w-5" />, label: 'System Default' }
            ].map(t => (
              <div 
                key={t.id} 
                className="p-3 hover:bg-muted cursor-pointer rounded-lg flex items-center justify-between"
                onClick={() => handleThemeChange(t.id as any)}
              >
                <div className="flex items-center gap-3">
                  {t.icon}
                  <span className="font-medium">{t.label}</span>
                </div>
                {theme === t.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Manage your app notifications here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div 
                className="p-3 hover:bg-muted cursor-pointer rounded-lg flex items-center justify-between"
                onClick={() => {
                  const newVal = !notificationsEnabled;
                  setNotificationsEnabled(newVal);
                  saveSettingsField('notificationsEnabled', newVal);
                }}
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Enable Notifications</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${notificationsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            
            <div className="space-y-3">
              {[
                {q: "How to create orders?", a: "Go to 'New Order' tab. Fill customer info and measurements."},
                {q: "How invoices work?", a: "Every order automatically generates an invoice that you can share."},
                {q: "How WhatsApp integration works?", a: "You can click the WhatsApp icon on the order details page to send pre-filled templates to the customer."},
                {q: "How subscription works?", a: "The free plan offers core features. Premium provides unlimited orders and AI tools."},
              ].map((faq, i) => (
                <div key={i} className="bg-muted p-3 flex flex-col gap-1 rounded-lg">
                  <p className="font-semibold text-sm">{faq.q}</p>
                  <p className="text-xs text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>

            <Button 
              className="w-full mt-4 bg-[#25D366] hover:bg-[#20bd5a] text-white" 
              onClick={() => openWhatsApp('03321379924', 'Hi! I need some help with Loop Tailor.')}
            >
              <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" />
              Chat on WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground">Loop Tailor v1.1.0</p>
      </div>

      {/* Pricing Dialog */}
      <Dialog open={isPricingOpen} onOpenChange={setIsPricingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-8">
          <DialogHeader className="space-y-2 mb-4">
            <div className="flex justify-center">
              <span className="bg-[#0D3D33] text-[#2ECC71] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-emerald-500/10">
                YOUR CURRENT PLAN: {currentPlan?.toUpperCase()}
              </span>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-center text-slate-900 dark:text-white">Software Plans</DialogTitle>
            <DialogDescription className="text-center text-slate-500 max-w-lg mx-auto">
              Choose the best plan for your shop's growth. Contact us on WhatsApp for upgrades.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-3">
            {Object.values(PLANS).map((plan) => {
              const isActive = currentPlan.toLowerCase() === plan.id.toLowerCase();
              
              // Custom rendering for usage stats
              const renderUsageLine = (label: string, current: number, max: number) => {
                if (max === 0) {
                  return (
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-350 py-0.5">
                      <span>{label}:</span>
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-black">Unlimited</span>
                        <span>{current} / ∞</span>
                      </span>
                    </div>
                  );
                }
                
                const totalSpots = 5;
                const filled = Math.min(totalSpots, Math.max(0, Math.round((current / max) * totalSpots)));
                const empty = Math.max(0, totalSpots - filled);
                const bar = '▓'.repeat(filled) + '░'.repeat(empty);
                
                return (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-350 py-0.5">
                    <span>{label}:</span>
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="text-primary tracking-tighter opacity-80">{bar}</span>
                      <span>{current}/{max}</span>
                    </span>
                  </div>
                );
              };

              return (
                <div 
                  key={plan.id}
                  className={cn(
                    "snap-align-start shrink-0 w-[85vw] sm:w-[320px] md:w-full md:shrink relative p-5 md:p-6 rounded-[2rem] border-2 flex flex-col justify-between transition-all",
                    isActive 
                      ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg shadow-primary/5" 
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                  )}
                >
                  {isActive && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                      Currently Active
                    </div>
                  )}
                  
                  <div>
                    <div className="mb-4 text-center md:text-left">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{plan.name}</h3>
                      <p className="text-[13px] text-slate-500 font-semibold leading-tight mt-1">{plan.description}</p>
                    </div>
                    
                    <div className="mb-6 text-center md:text-left">
                      <div className="flex items-baseline justify-center md:justify-start gap-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Rs. {plan.price}</span>
                        <span className="text-slate-400 text-sm font-semibold">/mo</span>
                      </div>
                    </div>

                    {/* Usage Bars */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 mb-6 font-mono text-[11px] shadow-inner">
                      {renderUsageLine("Customers", usage.customers, plan.limits.customers)}
                      {renderUsageLine("Orders", usage.ordersThisMonth, plan.limits.ordersPerMonth)}
                      {renderUsageLine("Workers", usage.workers, plan.limits.workers)}
                    </div>
                    
                    {/* Feature Lists */}
                    <div className="space-y-3 mb-6 px-1">
                      {plan.featureList.map(f => (
                        <div key={f.label} className={cn("flex items-start gap-3 text-[13px] font-semibold", !f.included && "opacity-40")}>
                          {f.included ? (
                            <Check className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                          ) : (
                            <X className="w-[18px] h-[18px] text-red-400 shrink-0" />
                          )}
                          <span className={f.included ? "text-slate-700 dark:text-slate-200" : "text-slate-400 line-through"}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-2">
                    <Button 
                      onClick={() => handleUpgradePlan(plan.name)}
                      variant={isActive ? "outline" : "default"}
                      className={cn("w-full h-12 rounded-xl font-bold text-sm shadow-sm", isActive && "opacity-60 cursor-default bg-transparent border-slate-200 text-slate-500")}
                      disabled={isActive}
                    >
                      {isActive ? "Current Plan" : "Upgrade Plan"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Need custom enterprise assistance?</p>
                <p className="text-xs text-slate-500 mt-0.5">Contact admin support on WhatsApp anytime.</p>
              </div>
            </div>
            <Button variant="outline" className="w-full md:w-auto h-11 px-6 rounded-xl text-sm font-bold shadow-sm" onClick={() => openWhatsApp('03321379924', 'Hi! I need a custom plan for my shop.')}>
              Contact Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SettingsRow({ icon, title, subtitle, rightElement, onClick }: { icon: React.ReactNode, title: string, subtitle?: string, rightElement?: React.ReactNode, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}

