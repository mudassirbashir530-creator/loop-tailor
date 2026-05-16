import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Globe, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const { signIn, resetPassword, user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const intent = searchParams.get('intent');
  const plan = normalizePlanStatus(searchParams.get('plan'));

  if (user) {
    const from = location.state?.from?.pathname || '/app';
    return <Navigate to={from} replace />;
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      if (resetPassword) {
        await resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox.");
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
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
      await signIn(email, password);
      const from = location.state?.from?.pathname || '/app';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F5F0]", 
        isRTL && "font-urdu"
      )} 
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Absolute Header for Language Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#0D3D33] bg-white rounded-full shadow-sm hover:shadow-md border border-gray-100 hover:border-[#2ECC71] transition-all duration-200"
        >
          <Globe className="w-4 h-4 text-[#2ECC71]" />
          {language === 'en' ? 'اردو' : 'English'}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <Link to="/" className="flex justify-center mb-8 group object-contain">
          <img 
            src="/logo.png" 
            alt="Loop Tailor Logo" 
            className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>
        
        <div className="bg-white py-10 px-6 shadow-2xl shadow-[#0D3D33]/5 rounded-3xl sm:px-12 border border-white/40 relative overflow-hidden">
          {/* Decorative subtle background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#2ECC71]/10 to-transparent rounded-bl-full pointer-events-none" />
          
          {plan && intent === 'signup' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 w-full flex items-center justify-center p-3 rounded-2xl bg-[#E6F9EE] text-[#0D3D33] text-sm font-semibold border border-[#2ECC71]/20 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-[#2ECC71]" />
              You've selected the <span className="capitalize ml-1 text-[#2ECC71]">{plan.replace(/-/g, ' ')}</span> plan
            </motion.div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-[#0D3D33] tracking-tight mb-2">
              {intent === 'signup' ? 'Create an Account' : 'Welcome back'}
            </h2>
            <p className="text-[15px] text-gray-500 font-medium">
              {intent === 'signup' 
                ? 'Please log in or create an account to start your subscription.' 
                : 'Access your Loop Tailor dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-[#0D3D33]">
                {t('auth.emailAddress')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2ECC71] transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  className="block w-full pl-11 pr-4 py-3 bg-[#F7F5F0] border-0 text-[#0D3D33] rounded-xl focus:ring-2 focus:ring-[#2ECC71] focus:bg-white transition-all duration-200 sm:text-sm shadow-inner outline-none placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-[#0D3D33]">
                  {t('auth.password')}
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-[#2ECC71] hover:text-[#0D3D33] transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2ECC71] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className="block w-full pl-11 pr-4 py-3 bg-[#F7F5F0] border-0 text-[#0D3D33] rounded-xl focus:ring-2 focus:ring-[#2ECC71] focus:bg-white transition-all duration-200 sm:text-sm shadow-inner outline-none placeholder:text-gray-400 font-medium tracking-widest"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center p-3.5 bg-[#E6F9EE] border border-[#2ECC71]/30 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71] mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium text-[#0D3D33]">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-[#0D3D33] hover:bg-[#16594C] hover:shadow-lg hover:shadow-[#0D3D33]/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D3D33] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none overflow-hidden"
            >
              {/* Button styling interactive background */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center">
                  {t('auth.signIn')}
                  <ArrowRight className="ml-2 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm font-medium text-gray-500">
              {t('auth.dontHaveAccount')}{' '}
              <Link 
                to={plan ? `/signup?plan=${plan}` : "/signup"}
                className="font-bold text-[#0D3D33] hover:text-[#2ECC71] transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

