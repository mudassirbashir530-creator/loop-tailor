import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ShopProvider } from './contexts/ShopContext';
import OfflineIndicator from './components/OfflineIndicator';
import InstallPrompt from './components/InstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import { motion } from 'framer-motion';
import { Scissors } from 'lucide-react';

import AppLayout from "./layouts/AppLayout";
import WebsiteLayout from "./layouts/WebsiteLayout";

// Website Pages
import HomePage from "./screens/website/Home";
import Pricing from "./screens/website/Pricing";
import Contact from "./screens/website/Contact";

// Auth
import LoginPage from "./screens/auth/LoginPage";
import SignupPage from "./screens/auth/SignupPage";

// App Pages
import Home from "./screens/Home";
import Clients from "./screens/Clients";
import Orders from "./screens/Orders";
import NewOrder from "./screens/NewOrder";
import Settings from "./screens/Settings";

// Other Pages (Preserved for internal links)
import CustomerDetails from './pages/CustomerDetails';
import OrderDetails from './pages/OrderDetails';
import Invoice from './pages/Invoice';
import Invoices from './pages/Invoices';
import Notifications from './pages/Notifications';
const Staff = React.lazy(() => import('./pages/Staff'));
const PaymentReminders = React.lazy(() => import('./pages/PaymentReminders'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Scissors className="h-12 w-12 text-blue-600" />
      </motion.div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingFallback />;
  return user ? <>{children}</> : <Navigate to="/auth/login" replace />;
}

import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <LanguageProvider>
          <OfflineIndicator />
          <InstallPrompt />
          <UpdateNotification />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary>
                <Routes>
                  {/* Redirect old routes mappings temporarily */}
                  <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />
                  <Route path="/dashboard/customers" element={<Navigate to="/app/clients" replace />} />
                  <Route path="/dashboard/orders" element={<Navigate to="/app/orders" replace />} />
                  <Route path="/dashboard/orders/new" element={<Navigate to="/app/new-order" replace />} />
                  <Route path="/dashboard/settings" element={<Navigate to="/app/settings" replace />} />
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

                  {/* Website */}
                  <Route element={<WebsiteLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                  </Route>

                  {/* Auth */}
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/signup" element={<SignupPage />} />

                  {/* App */}
                  <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                    <Route index element={<Home />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:id" element={<CustomerDetails />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="new-order" element={<NewOrder />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="orders/:id/invoice" element={<Invoice />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="reminders" element={<PaymentReminders />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="invoices" element={<Invoices />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </LanguageProvider>
      </ShopProvider>
    </AuthProvider>
  );
}
