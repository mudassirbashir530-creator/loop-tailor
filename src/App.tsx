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
              <Legal title="Privacy and Policy" lastUpdated={LEGAL_LAST_UPDATED}>
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What is Loop Tailor?</h2>
                    <p>Loop Tailor is a specialized, cloud-based management platform designed exclusively for the tailoring industry. Our primary purpose is to digitize and streamline the traditional tailoring workflow, replacing manual paper-based records with a secure, efficient, and organized digital system.</p>
                    <p>By using Loop Tailor, tailors and boutique owners can manage customer profiles, record precise measurements, track order progress, and generate professional invoices—all from a single, accessible interface available in both English and Urdu.</p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
                    <p>To provide our services effectively, we collect the following types of information:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Account Information:</strong> When you sign up, we collect your name, email address, shop name, and preferred interface language.</li>
                      <li><strong>Customer Data:</strong> As part of the service, you may input data about your customers, including their names, contact details, and specific body measurements.</li>
                      <li><strong>Order Information:</strong> Details regarding garments, styles, deadlines, and payment status for each order processed through the app.</li>
                      <li><strong>Authentication Data:</strong> We use secure authentication methods (including Google Sign-In) which provide us with basic profile information to verify your identity.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
                    <p>The information we collect is used solely for the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>To provide, maintain, and improve the Loop Tailor application and its features.</li>
                      <li>To manage your account and provide you with customer support.</li>
                      <li>To process and track orders and generate invoices for your business.</li>
                      <li>To communicate important updates, security alerts, and administrative messages.</li>
                      <li>To personalize your experience, such as setting your preferred language (English or Urdu).</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Storage and Security</h2>
                    <p>We prioritize the security of your data. Loop Tailor utilizes industry-standard cloud infrastructure provided by Google Firebase to store and protect your information.</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Encryption:</strong> Data is encrypted both in transit and at rest.</li>
                      <li><strong>Access Control:</strong> Only authenticated users can access their own business data. We implement strict security rules to ensure data isolation between different shops.</li>
                      <li><strong>Reliability:</strong> Our cloud-based system ensures that your records are backed up and protected against local hardware failures or loss of paper records.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Sharing and Disclosure</h2>
                    <p>We do not sell, trade, or otherwise transfer your personal or business data to outside parties. Your data is your own. We may only disclose information when required by law or to protect our rights, property, or safety.</p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Your Rights and Choices</h2>
                    <p>You have full control over your data within Loop Tailor:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Access and Update:</strong> You can view and edit your profile, customer data, and order records at any time through the app interface.</li>
                      <li><strong>Language Preference:</strong> You can switch between English and Urdu interfaces through the settings menu.</li>
                      <li><strong>Account Deletion:</strong> If you choose to stop using Loop Tailor, you can request the deletion of your account and all associated data.</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Cookies and Tracking</h2>
                    <p>Loop Tailor uses essential cookies and local storage to maintain your session and remember your preferences (such as language). We do not use tracking cookies for advertising purposes.</p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Changes to This Policy</h2>
                    <p>We may update our Privacy and Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date at the top.</p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contact Us</h2>
                    <p>If you have any questions or concerns about this Privacy and Policy, please contact us at <a href="mailto:support@looptailor.com" className="text-brand-primary font-bold">support@looptailor.com</a>.</p>
                  </section>
                </div>
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
