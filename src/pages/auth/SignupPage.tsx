import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const shopName = formData.get('shopName') as string;
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Auth is handled inside signUp, and Firestore write happens AFTER auth finishes in that function
      await signUp(email, password, name, phone, 'en', '', shopName);
      toast.success('Account created successfully!');
      navigate('/app');
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address provided.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please enable "Email/Password" provider in Firebase Console under Authentication -> Sign-in method.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <Card className="w-full shadow-xl mb-6">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto bg-primary text-white p-2.5 rounded-xl w-fit shadow-md">
              <Scissors className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
              <CardDescription className="text-base mt-2">Start your 30-day free trial today</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-md bg-destructive/15 border border-destructive/30 text-destructive flex gap-3 text-sm items-start">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="leading-tight">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shop Name</label>
                <Input name="shopName" required placeholder="e.g. Al-Madina Tailors" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your Name</label>
                <Input name="name" required placeholder="John Doe" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email Address</label>
                <Input name="email" type="email" required placeholder="name@example.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="phone" required placeholder="0300 1234567" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <Input name="password" type="password" required placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm</label>
                  <Input name="confirm" type="password" required placeholder="••••••••" />
                </div>
              </div>
              
              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="terms" required className="mt-1 rounded text-primary border-border focus:ring-primary h-4 w-4" />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </label>
              </div>
              
              <Button type="submit" fullWidth size="lg" disabled={loading} className="mt-4">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
        
        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-accent" />
            30-day free trial
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-accent" />
            No credit card
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-accent" />
            Cancel anytime
          </div>
        </div>

      </div>
    </div>
  );
}
