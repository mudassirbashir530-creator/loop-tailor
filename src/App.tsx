import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layouts
import WebsiteLayout from './layouts/WebsiteLayout';
import AppLayout from './layouts/AppLayout';

// Website Pages
import LandingPage from './pages/website/LandingPage';
import PricingPage from './pages/website/PricingPage';
import AboutPage from './pages/website/AboutPage';
import ContactPage from './pages/website/ContactPage';
import GenericPage from './pages/website/GenericPage';
import PrivacyPolicyPage from './pages/website/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/website/TermsAndConditionsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// App Pages
import Home from './screens/Home';
import Clients from './screens/Clients';
import Workers from './screens/Workers';
import Orders from './screens/Orders';
import NewOrder from './screens/NewOrder';
import Settings from './screens/Settings';
import Invoice from './pages/Invoice';
import FloatingWhatsApp from './components/FloatingWhatsApp';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="animate-spin h-12 w-12 border-4 border-[#0D3D33] border-t-transparent rounded-full" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return user ? <>{children}</> : <Navigate to="/auth/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return user ? <Navigate to="/app" replace /> : <>{children}</>;
}

import ErrorBoundary from './components/ErrorBoundary';

import { safeStorage } from './lib/safeStorage';

export default function App() {
  React.useEffect(() => {
    try {
      const savedTheme = safeStorage.getItem('theme') || 'system';
      if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn("Theme initial load error:", e);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ShopProvider>
          <LanguageProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                {/* Website Routes */}
                <Route element={<WebsiteLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/blog" element={<GenericPage title="Blog" />} />
                  <Route path="/careers" element={<GenericPage title="Careers" />} />
                  <Route path="/partners" element={<GenericPage title="Partners" />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/auth/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/auth/signup" element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                } />
                <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

                {/* App Routes */}
                <Route path="/app" element={
                  <PrivateRoute>
                    <AppLayout />
                  </PrivateRoute>
                }>
                  <Route index element={<Home />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="workers" element={<Workers />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="invoice/:id" element={<Invoice />} />
                  <Route path="new-order" element={<NewOrder />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-center" richColors />
            <FloatingWhatsApp />
          </BrowserRouter>
        </LanguageProvider>
      </ShopProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
