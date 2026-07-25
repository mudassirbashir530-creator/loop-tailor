import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [servicesOffered, setServicesOffered] = useState<string[]>(['Alteration', 'Repair', 'Bespoke']);
  
  const { signUp } = useAuth();

  const toggleService = (service: string) => {
    setServicesOffered(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };
  
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const name = (formData.get('name') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const shopName = (formData.get('shopName') as string || '').trim();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password, name, phone, 'en', '', shopName, '', '', 'free', currency, servicesOffered);
      toast.success('Account created successfully!');
      navigate('/app');
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to create account. Please try again.';
      try {
        const parsed = typeof error.message === 'string' ? JSON.parse(error.message) : error;
        if (parsed && parsed.error) errorMessage = parsed.error;
      } catch (e) {}

      if (error.code === 'auth/email-already-in-use' || errorMessage.includes('already exists')) {
        errorMessage = 'An account with this email address already exists. Please sign in instead.';
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <Card className="w-full shadow-xl mb-6 border border-border/80">
          <CardHeader className="text-center space-y-3 pb-6 border-b border-border/40">
            <div className="mx-auto bg-primary text-white p-3 rounded-2xl w-fit shadow-md">
              <Scissors className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Start Your Free Account</CardTitle>
              <CardDescription className="text-sm mt-1">No credit card required • Instant access</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex gap-3 text-sm items-start">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="leading-tight font-medium">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSignup} className="space-y-5">
              
              {/* BUSINESS DETAILS SECTION */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-primary">Business Details</p>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Business / Shop Name</label>
                  <Input name="shopName" required placeholder="e.g. Royal Tailors & Boutique" className="bg-background h-11" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="PKR">PKR — Pakistani Rupee (Rs.)</option>
                    <option value="USD">USD — US Dollar ($)</option>
                    <option value="AED">AED — UAE Dirham (AED)</option>
                    <option value="SAR">SAR — Saudi Riyal (SAR)</option>
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                    <option value="GBP">GBP — British Pound (£)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground flex justify-between">
                    <span>Services Offered</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Select services</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Alteration', 'Repair', 'Bespoke'].map(service => {
                      const isSelected = servicesOffered.includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleService(service)}
                          className={cn(
                            "py-2.5 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5",
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                              : "bg-background text-muted-foreground border-input hover:bg-accent"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          <span>{service}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* YOUR ACCOUNT SECTION */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-primary">Your Account</p>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <Input name="name" required placeholder="John Doe" className="bg-background h-11" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <Input name="email" type="email" required placeholder="name@example.com" className="bg-background h-11" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Phone Number</label>
                  <Input name="phone" required placeholder="0300 1234567" className="bg-background h-11" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Password</label>
                    <Input name="password" type="password" required placeholder="••••••••" className="bg-background h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Confirm</label>
                    <Input name="confirm" type="password" required placeholder="••••••••" className="bg-background h-11" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 pt-1">
                <input type="checkbox" id="terms" required className="mt-1 rounded text-primary border-border focus:ring-primary h-4 w-4" />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                  I agree to the <a href="#" className="text-primary font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-medium hover:underline">Privacy Policy</a>.
                </label>
              </div>
              
              <Button type="submit" fullWidth size="lg" disabled={loading} className="h-12 text-base font-bold shadow-md">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted-foreground mt-6 font-medium">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
        
        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600" />
            Free Forever Tier
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600" />
            No credit card
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600" />
            Cancel anytime
          </div>
        </div>

      </div>
    </div>
  );
}
