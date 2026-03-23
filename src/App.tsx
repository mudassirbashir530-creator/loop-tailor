/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import OfflineIndicator from './components/OfflineIndicator';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const Orders = lazy(() => import('./pages/Orders'));
const QuickOrder = lazy(() => import('./pages/QuickOrder'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const Careers = lazy(() => import('./pages/Careers'));
const MobileApp = lazy(() => import('./pages/MobileApp'));
const Updates = lazy(() => import('./pages/Updates'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));

const legalUpdatedAt = 'March 23, 2026';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineIndicator />
      <Router>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">Loading page...</div>}>
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
            
            {/* Legal Pages */}
            <Route path="/privacy" element={
              <Legal title="Privacy Policy" lastUpdated={legalUpdatedAt}>
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
              <Legal title="Terms of Service" lastUpdated={legalUpdatedAt}>
                <p>Please read these Terms of Service carefully before using the Loop Tailor application.</p>
                <h2>Acceptance of Terms</h2>
                <p>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
                <h2>Use License</h2>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on Loop Tailor&apos;s website for personal, non-commercial transitory viewing only.</p>
                <h2>Disclaimer</h2>
                <p>The materials on Loop Tailor&apos;s website are provided on an &apos;as is&apos; basis. Loop Tailor makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
              </Legal>
            } />
            <Route path="/cookies" element={
              <Legal title="Cookie Policy" lastUpdated={legalUpdatedAt}>
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
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
