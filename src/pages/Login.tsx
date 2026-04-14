import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Mail, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle, Smartphone, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-100 flex flex-col lg:flex-row overflow-hidden", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gray-100 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gray-100 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16 group">
            <div className="bg-gray-100/20 p-2 rounded-xl backdrop-blur-md group-hover:bg-gray-100/30 transition-all">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">Loop Tailor</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl xl:text-7xl font-display font-black leading-[0.95] mb-8">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-xl text-white/80 max-w-md leading-relaxed mb-12">
              {t('auth.welcomeBackDesc')}
            </p>

            <div className="space-y-6">
              {[
                { icon: <CheckCircle className="h-5 w-5" />, text: t('auth.realTimeTracking') },
                { icon: <Smartphone className="h-5 w-5" />, text: t('auth.mobileFirst') },
                { icon: <Shield className="h-5 w-5" />, text: t('auth.encryptedData') }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100/10 flex items-center justify-center backdrop-blur-sm">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 p-6 bg-gray-100/10 backdrop-blur-md rounded-[2rem] border border-white/10 max-w-sm">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Zap className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="text-sm">
              <div className="font-bold">{t('auth.fastSync')}</div>
              <div className="text-white/60">{t('auth.acrossDevices')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-[#FDFCF9] relative">
        {/* Language Toggle */}
        <div className={cn("absolute top-6 z-20", isRTL ? "left-6" : "right-6")}>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border-none text-slate-600 hover:shadow-neu-pressed-sm hover:text-brand-primary transition-all shadow-neu-sm font-bold text-sm"
          >
            <Globe className="h-4 w-4" />
            <span>{language === 'en' ? 'اردو' : 'English'}</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 transition-colors w-fit">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span className="text-sm font-bold">{t('auth.backToWebsite')}</span>
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">
              {t('auth.signIn')}
            </h2>
            <p className="text-slate-500 font-medium">
              {t('auth.signInDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className={cn("text-sm font-bold text-slate-700 block", isRTL ? "mr-1" : "ml-1")}>{t('auth.emailAddress')}</label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                <Input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-14 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm focus:ring-2 focus:ring-brand-primary/20 transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className={cn("flex justify-between items-center", isRTL ? "mr-1" : "ml-1")}>
                <label className="text-sm font-bold text-slate-700">{t('auth.password')}</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("h-14 rounded-2xl border-none bg-gray-100 shadow-neu-pressed-sm focus:ring-2 focus:ring-brand-primary/20 transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold"
              >
                {success}
              </motion.div>
            )}

            <Button
              disabled={isLoading}
              className={cn("w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-2xl shadow-blue-600/20 transition-all active:scale-95 mt-4", isRTL && "flex-row-reverse")}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {t('auth.signIn')}
                  {isRTL ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">
              {t('auth.dontHaveAccount')}
              <Link
                to="/signup"
                className={cn("text-orange-500 font-bold hover:underline", isRTL ? "mr-2" : "ml-2")}
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
