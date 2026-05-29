import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'motion/react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShopProvider } from './contexts/ShopContext';
import { LanguageProvider } from './contexts/LanguageContext';

import OrderDetails from './pages/OrderDetails';

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

// Admin Routes
import { AdminLayout } from './layouts/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import UsersList from './admin/AdminUsersList';
import Home from './screens/Home';
import Clients from './screens/Clients';
import Workers from './screens/Workers';
import { Payroll } from './pages/Payroll';
import Orders from './screens/Orders';
import NewOrder from './screens/NewOrder';
import Settings from './screens/Settings';
import Invoice from './pages/Invoice';
import Upgrade from './screens/Upgrade';
import FeatureRoute from './components/FeatureRoute';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0]">
      <div className="animate-spin h-12 w-12 border-4 border-[#0D3D33] border-t-transparent rounded-full" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;
  // Admin should not see the user app
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingFallback />;
  if (user) {
    const from = location.state?.from?.pathname || (isAdmin ? "/admin" : "/app");
    return <Navigate to={from} replace />;
  }
  return <>{children}</>;
}

import ErrorBoundary from './components/ErrorBoundary';

import { safeStorage } from './lib/safeStorage';

function AppContent() {
  const location = useLocation();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
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
            <Route path="workers" element={
              <FeatureRoute feature="canManageWorkers">
                <Workers />
              </FeatureRoute>
            } />
            <Route path="payroll" element={
              <FeatureRoute feature="canUsePayroll">
                <Payroll />
              </FeatureRoute>
            } />
            <Route path="analytics" element={
              <FeatureRoute feature="canViewAnalytics">
                <Home />
              </FeatureRoute>
            } />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="invoice/:id" element={<Invoice />} />
            <Route path="new-order" element={<NewOrder />} />
            <Route path="settings" element={<Settings />} />
            <Route path="upgrade" element={<Upgrade />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="users" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><UsersList /></div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

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
      document.documentElement.classList.remove('dark', 'system');
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ShopProvider>
          <LanguageProvider>
            <BrowserRouter>
              <AppContent />
              <Toaster position="top-center" richColors />
            </BrowserRouter>
          </LanguageProvider>
        </ShopProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
