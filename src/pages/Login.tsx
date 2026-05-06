import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Mail, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle, Smartphone, Shield, Zap, Globe, PackageOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { normalizePlanStatus } from '../lib/planUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const intent = searchParams.get('intent');
  const plan = normalizePlanStatus(searchParams.get('plan'));

  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("auth-page", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
        className="lang-btn"
      >
        {language === 'en' ? 'اردو' : 'English'}
      </button>

      <div className="auth-card">
        <Link to="/">
           <img src="/logo.png" alt="Loop Tailor Logo" className="auth-logo" />
        </Link>

        {plan && intent === 'signup' && (
          <div className="mb-4 w-full p-3 rounded-xl bg-[#2ECC71]/10 text-[#0D3D33] text-sm font-bold border border-[#2ECC71] text-center">
            You've selected the {plan.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} plan
          </div>
        )}

        <h2 className="auth-title">
          {intent === 'signup' ? 'Create an Account' : 'Sign In'}
        </h2>
        <p className="auth-subtitle">
          {intent === 'signup' ? 'Please log in or create an account to start your subscription.' : 'Access your Loop Tailor dashboard'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="auth-field">
            <label>{t('auth.emailAddress')}</label>
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="auth-field">
            <div className="flex justify-between items-center mb-1.5">
              <label className="mb-0">{t('auth.password')}</label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#0D3D33] hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-50 border border-green-200 text-green-600 text-sm font-semibold rounded-lg"
            >
              {success}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              t('auth.signIn')
            )}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.dontHaveAccount')}{' '}
          <Link to={plan ? `/signup?plan=${plan}` : "/signup"}>
            {t('auth.signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
