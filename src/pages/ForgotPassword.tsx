import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, CheckCircle, Scissors } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'success'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setStep('success');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="bg-brand-primary p-2 rounded-xl group-hover:bg-brand-primary/90 transition-all shadow-sm">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-slate-900">Loop Tailor</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {step === 'email' ? 'Reset Your Password' : 'Check Your Email'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {t('auth.or')} {' '}
          <Link to="/auth/login" className="font-medium text-brand-primary hover:text-brand-primary/80 transition-colors">
            {t('auth.returnToSignIn')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-100 py-8 px-4 shadow-neu sm:rounded-[2rem] sm:px-10 border-none relative">
          
          <div className="absolute top-4 left-4">
             <Link to="/auth/login">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-200">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
             </Link>
          </div>

          <div className="pt-6">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Reset link sent to your email</h3>
              <p className="text-sm text-slate-500 mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link to="/auth/login">
                <Button className="w-full h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-medium shadow-sm transition-all">
                  {t('auth.returnToLogin')}
                </Button>
              </Link>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSendResetLink}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  {t('auth.emailAddress')}
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 h-12 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm focus:ring-2 focus:ring-brand-primary/20 sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
