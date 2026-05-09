import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Crown, Bell, MessageSquare, Globe, Palette, HelpCircle, LogOut, ChevronRight, Moon, Sun, Smartphone, Check } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { openWhatsApp } from '../lib/whatsapp';

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

export default function Settings() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const { settings } = useShop();
  
  const [shopName, setShopName] = useState(settings?.name || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(settings?.countryCode || '+92');

  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [theme, setTheme] = useState<'light'|'dark'|'system'>((localStorage.getItem('theme') as any) || 'system');

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
    if (user) {
      getDoc(doc(db, 'settings', user.uid)).then(d => {
        if (d.exists()) {
          const data = d.data();
          if (data.countryCode) setSelectedCountryCode(data.countryCode);
          if (data.templates) setTemplates(data.templates);
          if (data.notificationsEnabled !== undefined) setNotificationsEnabled(data.notificationsEnabled);
        }
      });
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Logged out successfully");
      navigate('/auth/login');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'settings', user.uid), {
        name: shopName,
        phone: phone,
      });
      toast.success("Profile updated");
      setIsEditingProfile(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const saveSettingsField = async (field: string, value: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'settings', user.uid), { [field]: value });
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  }

  const handleThemeChange = (newTheme: 'light'|'dark'|'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success("Appearance updated");
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
          <div className="h-16 w-16 rounded-full bg-white text-primary flex items-center justify-center text-xl font-bold shadow-sm uppercase">
            {shopName?.substring(0, 2) || user?.displayName?.substring(0, 2) || 'LT'}
          </div>
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
                icon={<Crown className="h-5 w-5 text-accent" />} 
                title="Subscription Plan" 
                subtitle={user?.email === "mudassirbashir530@gmail.com" ? "Premium Plan (Active)" : "Free Plan (Active)"}
                rightElement={<span className="bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-md">Upgrade</span>}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Shop Name</label>
              <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Al-Madina Tailors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0300 1234567" />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Templates Dialog */}
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>WhatsApp Templates</DialogTitle>
            <DialogDescription>Use variables: {'{customerName}'}, {'{orderId}'}, {'{clothingType}'}, {'{totalPrice}'}, {'{advanceAmount}'}, {'{deliveryDate}'}, {'{remainingAmount}'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Order Received</label>
              <Textarea 
                value={templates.orderReceived} 
                onChange={e => setTemplates({...templates, orderReceived: e.target.value})} 
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Stitching Started</label>
              <Textarea 
                value={templates.stitchingStarted} 
                onChange={e => setTemplates({...templates, stitchingStarted: e.target.value})} 
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ready for Delivery</label>
              <Textarea 
                value={templates.readyForDelivery} 
                onChange={e => setTemplates({...templates, readyForDelivery: e.target.value})} 
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Payment Pending</label>
              <Textarea 
                value={templates.paymentPending} 
                onChange={e => setTemplates({...templates, paymentPending: e.target.value})} 
                className="h-20 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Delivered Successfully</label>
              <Textarea 
                value={templates.deliveredSuccessfully} 
                onChange={e => setTemplates({...templates, deliveredSuccessfully: e.target.value})} 
                className="h-20 resize-none"
              />
            </div>
            <Button onClick={() => {
              saveSettingsField('templates', templates);
              setIsTemplatesOpen(false);
            }} className="w-full">Save Templates</Button>
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

