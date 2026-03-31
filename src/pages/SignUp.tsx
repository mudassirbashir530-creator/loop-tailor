import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, CheckCircle, Star, Shield, Zap, BadgeCheck, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ur'>('en');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const { t, isRTL, setLanguage } = useLanguage();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signUp(email, password, name, phone, selectedLanguage);
      await setLanguage(selectedLanguage);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden", selectedLanguage === 'ur' && "font-urdu")} dir={selectedLanguage === 'ur' ? 'rtl' : 'ltr'}>
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
              {t('auth.futureOfTailoring')} <br />
              <span className="text-white/60 italic">{t('auth.tailoring')}</span>
            </h1>
            <p className="text-xl text-white/80 max-w-md leading-relaxed mb-12">
              {t('auth.join500')}
            </p>

            <div className="space-y-6">
              {[
                { icon: <Zap className="h-5 w-5" />, text: t('auth.instantMeasurement') },
                { icon: <Shield className="h-5 w-5" />, text: t('auth.secureCloud') },
                { icon: <Star className="h-5 w-5" />, text: t('auth.professionalInvoicing') }
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
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm">
              <div className="font-bold">{t('auth.trustedByExperts')}</div>
              <div className="text-white/60">{t('auth.rating')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-[#FDFCF9]">
        <div className="max-w-md w-full mx-auto">
          <Link to="/" className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 transition-colors w-fit">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span className="text-sm font-bold">{t('auth.backToWebsite')}</span>
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 mb-3">{t('auth.createAccount')}</h2>
            <p className="text-slate-500 font-medium">{t('auth.startFreeTrial')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className={cn("text-sm font-bold text-slate-700 block", isRTL ? "mr-1" : "ml-1")}>{t('auth.shopName')}</label>
              <div className="relative">
                <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} />
                <Input
                  required
                  placeholder="e.g. Royal Stitch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn("h-14 rounded-2xl border-slate-200 bg-white focus:ring-brand-primary focus:border-brand-primary transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-bold text-slate-700 block", isRTL ? "mr-1" : "ml-1")}>{t('auth.phoneNumber') || 'Phone Number'}</label>
              <div className="relative">
                <svg className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10", isRTL ? "right-4" : "left-4")} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <Input
                  required
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-14 rounded-2xl border-slate-200 bg-white focus:ring-brand-primary focus:border-brand-primary transition-all text-lg", isRTL ? "pr-12 text-right" : "pl-12")}
                  dir="ltr"
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <label className={cn("text-sm font-bold text-slate-700 block", isRTL ? "mr-1" : "ml-1")}>{t('auth.password')}</label>
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

            <div className="space-y-2">
              <label className={cn("text-sm font-bold text-slate-700 block", selectedLanguage === 'ur' ? "mr-1" : "ml-1")}>{t('auth.interfaceLanguage')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('en');
                    setLanguage('en');
                  }}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2",
                    selectedLanguage === 'en' 
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm" 
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLanguage('ur');
                    setLanguage('ur');
                  }}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 font-urdu",
                    selectedLanguage === 'ur' 
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm" 
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                  )}
                >
                  <Globe className="h-4 w-4" />
                  اردو
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium px-1">
                {t('auth.selectLanguage')}
              </p>
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

            <Button
              disabled={isLoading}
              className={cn("w-full h-16 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-lg shadow-2xl shadow-brand-primary/20 transition-all active:scale-95 mt-4", isRTL && "flex-row-reverse")}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {t('auth.createMyAccount')}
                  {isRTL ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
                </>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-500 font-medium">
              {t('auth.alreadyHaveAccount')}
              <Link
                to="/login"
                className={cn("text-brand-primary font-bold hover:underline", isRTL ? "mr-2" : "ml-2")}
              >
                {t('auth.logIn')}
              </Link>
            </p>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('auth.bySigningUp')} <Link to="/terms" className="underline">{t('auth.termsOfService')}</Link> {t('auth.and')} <Link to="/privacy" className="underline">{t('auth.privacyPolicy')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
