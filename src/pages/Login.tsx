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
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, resetPassword, user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await signIn();
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await resetPassword(email);
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden", isRTL && "font-urdu")} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side: Branding & Features (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16 group">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md group-hover:bg-white/30 transition-all">
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
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 max-w-sm">
            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center">
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
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-brand-primary hover:text-brand-primary transition-all shadow-sm font-bold text-sm"
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
              {mode === 'login' ? t('auth.signIn') : t('auth.resetPassword')}
            </h2>
            <p className="text-slate-500 font-medium">
              {mode === 'login' 
                ? t('auth.signInDesc') 
                : t('auth.resetPasswordDesc')}
            </p>
          </div>

          {mode === 'login' && (
            <div className="mb-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                {t('auth.continueWithGoogle')}
              </Button>

              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-slate-400 bg-[#FDFCF9] font-bold uppercase tracking-widest">{t('auth.orEmail')}</span>
                </div>
              </div>
            </div>
          )}

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
                  className={cn("h-14 rounded-2xl border-slate-200 bg-white focus:ring-brand-primary focus:border-brand-primary transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                  dir="ltr"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="space-y-2">
                <div className={cn("flex justify-between items-center", isRTL ? "mr-1" : "ml-1")}>
                  <label className="text-sm font-bold text-slate-700">{t('auth.password')}</label>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn("h-14 rounded-2xl border-slate-200 bg-white focus:ring-brand-primary focus:border-brand-primary transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

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
              className={cn("w-full h-16 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-lg shadow-2xl shadow-brand-primary/20 transition-all active:scale-95 mt-4", isRTL && "flex-row-reverse")}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? t('auth.signIn') : t('auth.sendResetLink')}
                  {isRTL ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">
              {mode === 'login' ? t('auth.dontHaveAccount') : t('auth.rememberedPassword')}
              {mode === 'login' ? (
                <Link
                  to="/signup"
                  className={cn("text-brand-primary font-bold hover:underline", isRTL ? "mr-2" : "ml-2")}
                >
                  {t('auth.signUp')}
                </Link>
              ) : (
                <button
                  onClick={() => setMode('login')}
                  className={cn("text-brand-primary font-bold hover:underline", isRTL ? "mr-2" : "ml-2")}
                >
                  {t('auth.logIn')}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
