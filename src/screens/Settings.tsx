import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Crown, Bell, MessageSquare, Globe, Palette, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  // Simulated useAuth for prompt constraints
  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate('/');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-16 w-16 rounded-full bg-white text-primary flex items-center justify-center text-xl font-bold shadow-sm">
            AM
          </div>
          <div>
            <h2 className="text-xl font-bold">Al-Madina Tailors</h2>
            <p className="text-primary-foreground/80 text-sm">0300 1234567</p>
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
              <SettingsRow icon={<Store className="h-5 w-5 text-blue-600" />} title="Shop Profile" subtitle="Edit name and details" />
              <SettingsRow 
                icon={<Crown className="h-5 w-5 text-accent" />} 
                title="Subscription Plan" 
                subtitle="Free Plan (29 days remaining)" 
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
              <SettingsRow icon={<Globe className="h-5 w-5 text-indigo-500" />} title="Language" subtitle="English" />
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

      {/* Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground">Loop Tailor v1.0.0</p>
      </div>

    </div>
  );
}

function SettingsRow({ icon, title, subtitle, rightElement }: { icon: React.ReactNode, title: string, subtitle?: string, rightElement?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
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
