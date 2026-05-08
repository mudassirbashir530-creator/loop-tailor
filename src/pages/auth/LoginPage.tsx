import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
      toast.success('Logged in successfully');
      navigate('/app');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto bg-primary text-white p-3 rounded-xl w-fit shadow-md">
              <Scissors className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back!</CardTitle>
              <CardDescription className="text-base mt-2">Sign in to your account to continue</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input name="email" type="email" required placeholder="name@example.com" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
                </div>
                <Input name="password" type="password" required placeholder="••••••••" />
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded text-primary border-border focus:ring-primary h-4 w-4" />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me for 30 days</label>
              </div>
              
              <Button type="submit" fullWidth size="lg" disabled={loading} className="mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-8 bg-muted/50 p-4 rounded-xl border text-sm text-center">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p className="text-muted-foreground">Email: demo@looptailor.com</p>
              <p className="text-muted-foreground">Password: demo123</p>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-8">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-primary font-medium hover:underline">
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
