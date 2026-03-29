/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';
import InstallPrompt from './components/InstallPrompt';
import { motion } from 'motion/react';
import { Scissors } from 'lucide-react';

// Eager load critical components
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Lazy load other pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Customers = React.lazy(() => import('./pages/Customers'));
const CustomerDetails = React.lazy(() => import('./pages/CustomerDetails'));
const Orders = React.lazy(() => import('./pages/Orders'));
const QuickOrder = React.lazy(() => import('./pages/QuickOrder'));
const OrderDetails = React.lazy(() => import('./pages/OrderDetails'));
const Invoice = React.lazy(() => import('./pages/Invoice'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Public Pages
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Blog = React.lazy(() => import('./pages/Blog'));
const Careers = React.lazy(() => import('./pages/Careers'));
const MobileApp = React.lazy(() => import('./pages/MobileApp'));
const Updates = React.lazy(() => import('./pages/Updates'));
const TailorManagementSoftware = React.lazy(() => import('./pages/TailorManagementSoftware'));
const InstallApp = React.lazy(() => import('./pages/InstallApp'));
const Legal = React.lazy(() => import('./pages/Legal'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <OfflineIndicator />
        <InstallPrompt />
        <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Info Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/mobile-app" element={<MobileApp />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/tailor-management-software" element={<TailorManagementSoftware />} />
            <Route path="/install" element={<InstallApp />} />
            
            {/* Legal Pages */}
            <Route path="/privacy" element={
              <Legal title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
                <p>At Loop Tailor, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our application.</p>
                <h2>Information We Collect</h2>
                <p>We collect information that you provide directly to us when you register for an account, create a profile, use our services, or communicate with us. This includes your name, email address, phone number, and any customer data you input into our system.</p>
                <h2>How We Use Your Information</h2>
                <p>We use the information we collect to operate, maintain, and provide the features and functionality of the Service, to communicate with you, and to monitor and improve our services.</p>
                <h2>Data Security</h2>
                <p>We implement appropriate technical and organizational security measures to protect your personal information against accidental or unlawful destruction, loss, alteration, or unauthorized disclosure.</p>
              </Legal>
            } />
            <Route path="/terms" element={
              <Legal title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED}>
                <p>Please read these Terms of Service carefully before using the Loop Tailor application.</p>
                <h2>Acceptance of Terms</h2>
                <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
                <h2>Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on Loop Tailor's website for personal, non-commercial transitory viewing only.</p>
                <h2>Disclaimer</h2>
                <p>The materials on Loop Tailor's website are provided on an 'as is' basis. Loop Tailor makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
              </Legal>
            } />
            <Route path="/cookies" element={
              <Legal title="Cookie Policy" lastUpdated={LEGAL_LAST_UPDATED}>
                <p>This Cookie Policy explains how Loop Tailor uses cookies and similar technologies to recognize you when you visit our website and use our application.</p>
                <h2>What are cookies?</h2>
                <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
                <h2>Why do we use cookies?</h2>
                <p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Websites to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties.</p>
              </Legal>
            } />

            <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/new" element={<QuickOrder />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="orders/:id/invoice" element={<Invoice />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
