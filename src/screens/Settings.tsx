import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Crown, Bell, MessageSquare, Globe, Palette, HelpCircle, LogOut, ChevronRight, Input as InputIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const COUNTRY_CODES = [
  { code: '+92', name: 'Pakistan' },
  { code: '+1', name: 'United States' },
  { code: '+1', name: 'Canada' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+91', name: 'India' },
  { code: '+971', name: 'United Arab Emirates' },
  { code: '+966', name: 'Saudi Arabia' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logOut } = useAuth();
  const { settings } = useShop();
  
  const [shopName, setShopName] = useState(settings.name || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [isCountryCodeOpen, setIsCountryCodeOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Logged out successfully");
      navigate('/');
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

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto">
      
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
                subtitle="Free Plan (Active)" 
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
              <SettingsRow icon={<Bell className="h-5 w-5 text-orange-500" />} title="Notifications" subtitle="Manage notification settings" />
              <SettingsRow icon={<MessageSquare className="h-5 w-5 text-emerald-500" />} title="WhatsApp Templates" subtitle="Customize auto-messages" />
              <SettingsRow 
                icon={<Globe className="h-5 w-5 text-indigo-500" />} 
                title="Country Code" 
                subtitle="Select default country code" 
                onClick={() => setIsCountryCodeOpen(true)}
              />
              <SettingsRow icon={<Palette className="h-5 w-5 text-pink-500" />} title="Appearance" subtitle="Light mode" />
            </div>
          </Card>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Support</h3>
          <Card className="overflow-hidden">
            <SettingsRow icon={<HelpCircle className="h-5 w-5 text-purple-500" />} title="Help & Support" subtitle="Get help or contact us" />
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
                     toast.success(`Default country code set to ${country.code}`);
                     setIsCountryCodeOpen(false);
                  }}
                >
                  <span className="font-medium">{country.name}</span>
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

      {/* Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground">Loop Tailor v1.0.0</p>
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
