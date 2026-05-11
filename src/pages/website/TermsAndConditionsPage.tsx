import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Lock, CreditCard, Activity, Database, MessageSquare, ShieldAlert, Ban, Bookmark, Scale, MapPin, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', icon: CheckCircle },
  { id: 'responsibilities', title: 'User Responsibilities', icon: AlertTriangle },
  { id: 'account-security', title: 'Account Security', icon: Lock },
  { id: 'subscription', title: 'Subscription & Payments', icon: CreditCard },
  { id: 'availability', title: 'Service Availability', icon: Activity },
  { id: 'data-content', title: 'Data & Content', icon: Database },
  { id: 'whatsapp', title: 'WhatsApp & Invoice', icon: MessageSquare },
  { id: 'liability', title: 'Limitation of Liability', icon: ShieldAlert },
  { id: 'suspension', title: 'Account Suspension', icon: Ban },
  { id: 'intellectual-property', title: 'Intellectual Property', icon: Bookmark },
  { id: 'governing-law', title: 'Governing Law', icon: Scale },
  { id: 'contact', title: 'Contact Information', icon: MapPin },
];

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Terms & Conditions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              These terms govern your use of the Loop Tailor platform. Please read them carefully to understand your rights and responsibilities.
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-8">
              Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 relative">
          
          {/* Table of Contents - Sticky Sidebar */}
          <div className="w-full md:w-64 shrink-0 hidden md:block">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-6 px-3">
                Contents
              </h3>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all",
                        activeSection === section.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl prose prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-16"
            >
              
              <section id="acceptance" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">1. Acceptance of Terms</h2>
                <p>By registering for, accessing, or using the Loop Tailor application or services, you agree to comply with and be bound by all of the terms and conditions set forth herein. If you do not agree to these terms, please do not use our services.</p>
              </section>

              <section id="responsibilities" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">2. User Responsibilities</h2>
                <p>As a user of Loop Tailor, you are expected to maintain professional conduct while using our platform. You must:</p>
                <ul>
                  <li>Provide accurate, current, and complete information during registration and account setup.</li>
                  <li>Protect your login credentials and immediately notify us of any suspicious activity.</li>
                  <li>Avoid any illegal activities, deceptive practices, or actions that violate the rights of others.</li>
                  <li>Avoid abusing the platform, including attempting to bypass security constraints or excessively consuming system resources.</li>
                </ul>
              </section>

              <section id="account-security" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">3. Account Security</h2>
                <p>Your account security is a shared responsibility.</p>
                <ul>
                  <li>Users are entirely responsible for any and all activities that occur under their account.</li>
                  <li>Loop Tailor is not responsible for any unauthorized access or loss of data caused by weak passwords or user-side negligence.</li>
                </ul>
              </section>

              <section id="subscription" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">4. Subscription & Payments</h2>
                <p>Our services are provided on a recurring subscription basis unless specified otherwise.</p>
                <ul>
                  <li>Subscription plans, pricing, and features may change or be updated over time.</li>
                  <li>All payments are non-refundable unless expressly required by applicable law.</li>
                  <li>Free trials will expire automatically at the end of their designated period unless a subscription plan is chosen.</li>
                </ul>
              </section>

              <section id="availability" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">5. Service Availability</h2>
                <p>We strive to provide continuous uninterrupted access, but guarantee no specific uptime.</p>
                <ul>
                  <li>Loop Tailor may temporarily go offline for maintenance, upgrades, or due to unforeseen technical constraints.</li>
                </ul>
              </section>

              <section id="data-content" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">6. Data & Content</h2>
                <p>You have ultimate control over the data you bring to the platform.</p>
                <ul>
                  <li>Users retain full ownership of their uploaded data, customer information, text, and images.</li>
                  <li>Users must not upload illegal, highly inappropriate, or copyrighted material to which they do not own the rights.</li>
                </ul>
              </section>

              <section id="whatsapp" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">7. WhatsApp & Invoice Features</h2>
                <p>Loop Tailor incorporates external communication workflows to help you interact with your clients.</p>
                <ul>
                  <li>Invoice generation sharing and WhatsApp integrations strictly depend on third-party service availability, terms of use, and API stabilities. We cannot guarantee these features will function identically on all devices or forever.</li>
                </ul>
              </section>

              <section id="liability" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">8. Limitation of Liability</h2>
                <p>In no event shall Loop Tailor be liable for potential consequences of using our application.</p>
                <ul>
                  <li>We are not responsible for direct or indirect business losses or revenue impacts.</li>
                  <li>We are not responsible for data loss caused by user errors, external hardware issues, or force majeure.</li>
                  <li>We bear no liability for third-party service downtime (such as Firebase, Cloudinary, or WhatsApp).</li>
                </ul>
              </section>

              <section id="suspension" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">9. Account Suspension</h2>
                <p>We reserve the right to restrict access to protect our community and systems.</p>
                <ul>
                  <li>Accounts found to be violating these terms, engaging in fraudulent behavior, or attempting to compromise the application may be suspended or permanently removed without prior notice.</li>
                </ul>
              </section>

              <section id="intellectual-property" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">10. Intellectual Property</h2>
                <p>The Loop Tailor platform itself is proprietary.</p>
                <ul>
                  <li>All Loop Tailor branding (logos, trademarks), User Interface (UI), system design, source code, and software strictly remain the protected intellectual property of Loop Tailor.</li>
                  <li>You are granted a limited license to use the service; you are not obtaining rights to the software itself.</li>
                </ul>
              </section>

              <section id="governing-law" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">11. Governing Law</h2>
                <p>Jurisdiction over these terms.</p>
                <ul>
                  <li>These terms and your use of the service are governed under the laws of Pakistan, without regard to its conflict of law principles.</li>
                </ul>
              </section>

              <section id="contact" className="scroll-mt-24 bg-muted p-8 rounded-2xl">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">12. Contact Information</h2>
                <p>If you have any questions or require clarification about these Terms & Conditions, please contact us:</p>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Us</p>
                      <a href="mailto:looptailor@gmail.com" className="text-base font-semibold text-foreground hover:text-primary transition-colors">looptailor@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-base font-semibold text-foreground">Manzoor Colony, Karachi, Pakistan</p>
                    </div>
                  </div>
                </div>
              </section>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
