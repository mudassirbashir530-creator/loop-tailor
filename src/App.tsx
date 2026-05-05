/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ShopProvider, useShop } from './contexts/ShopContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import InstallPrompt from './components/InstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

// Eager load critical components
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load other pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Orders from './pages/Orders';
import QuickOrder from './pages/QuickOrder';
import OrderDetails from './pages/OrderDetails';
import Invoice from './pages/Invoice';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

const Staff = React.lazy(() => import('./pages/Staff'));
const PaymentReminders = React.lazy(() => import('./pages/PaymentReminders'));

// Info Pages
const RedirectExternal = ({ url }: { url: string }) => {
  React.useEffect(() => {
    window.location.href = url;
  }, [url]);
  return null;
};

const About = () => <RedirectExternal url="/landing/about.html" />;
const Contact = () => <RedirectExternal url="/landing/contact.html" />;
const Blog = React.lazy(() => import('./pages/Blog'));
const ArticleView = React.lazy(() => import('./pages/ArticleView'));
const Careers = React.lazy(() => import('./pages/Careers'));
const MobileApp = React.lazy(() => import('./pages/MobileApp'));
const Updates = React.lazy(() => import('./pages/Updates'));
const TailorManagementSoftware = React.lazy(() => import('./pages/TailorManagementSoftware'));
const InstallApp = React.lazy(() => import('./pages/InstallApp'));
const Legal = React.lazy(() => import('./pages/Legal'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Articles = React.lazy(() => import('./pages/admin/Articles').then(m => ({ default: m.Articles })));
const ArticleEditor = React.lazy(() => import('./pages/admin/ArticleEditor').then(m => ({ default: m.ArticleEditor })));
const SocialPosts = React.lazy(() => import('./pages/admin/SocialPosts').then(m => ({ default: m.SocialPosts })));
const MediaLibrary = React.lazy(() => import('./pages/admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const Users = React.lazy(() => import('./pages/admin/Users').then(m => ({ default: m.Users })));

// Secret Admin Panel
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
import { ADMIN_SECRET_ROUTE } from './config/adminConfig';

const LEGAL_LAST_UPDATED = new Date('2026-03-23').toLocaleDateString();

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Scissors className="h-12 w-12 text-brand-primary" />
      </motion.div>
    </div>
  );
}

import { useLocation } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, wasLoggedIn } = useAuth();
  const location = useLocation();
  
  // If we know they were logged in, optimistically render the children
  // The children (like Dashboard) will handle their own loading states or use cached data
  if (loading && wasLoggedIn) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingFallback />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />;
}

import HelpButton from './components/HelpButton';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ShopProvider>
          <LanguageProvider>
            <OfflineIndicator />
            <InstallPrompt />
            <UpdateNotification />
            <Router>
              <HelpButton />
              <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Info Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<RedirectExternal url="/landing/pricing.html" />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<ArticleView />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/mobile-app" element={<MobileApp />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/tailor-management-software" element={<TailorManagementSoftware />} />
              <Route path="/install" element={<InstallApp />} />
              
              {/* Legal Pages */}
              <Route path="/privacy" element={<RedirectExternal url="/landing/privacy.html" />} />
              <Route path="/terms" element={<RedirectExternal url="/landing/terms.html" />} />
              <Route path="/cookies" element={<RedirectExternal url="/landing/cookies.html" />} />
              <Route path="/refund" element={<RedirectExternal url="/landing/refund.html" />} />

              <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/new" element={<QuickOrder />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="orders/:id/invoice" element={<Invoice />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="reminders" element={<PaymentReminders />} />
                <Route path="staff" element={<Staff />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="articles" element={<Articles />} />
                <Route path="articles/new" element={<ArticleEditor />} />
                <Route path="articles/edit/:id" element={<ArticleEditor />} />
                <Route path="social" element={<SocialPosts />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="users" element={<Users />} />
              </Route>

              {/* Secret Admin Route */}
              <Route path={ADMIN_SECRET_ROUTE} element={<PrivateRoute><AdminPanel /></PrivateRoute>} />

              <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </Router>
          <Toaster position="top-center" />
          </LanguageProvider>
        </ShopProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
