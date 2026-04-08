import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, Navigate } from 'react-router-dom';
import Hero from '../components/Hero';
import { cn } from '../lib/utils';
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Ruler,
  Scissors,
  UserPlus,
  Users,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { AnimatePresence, motion } from 'motion/react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard analytics',
    desc: 'Daily production, payment health, and delivery pipeline at a glance.',
  },
  {
    icon: ClipboardList,
    title: 'Order management',
    desc: 'Create, update, and deliver every order with reliable stage tracking.',
  },
  {
    icon: Users,
    title: 'Client management',
    desc: 'Searchable profiles with notes, past orders, and follow-up reminders.',
  },
  {
    icon: Ruler,
    title: 'Measurements',
    desc: 'Structured measurement templates for consistency across the whole team.',
  },
  {
    icon: FileText,
    title: 'Invoices',
    desc: 'Generate branded invoices and track balances without spreadsheets.',
  },
  {
    icon: Workflow,
    title: 'Workflow visibility',
    desc: 'Know what needs cutting, stitching, fitting, and delivery each day.',
  },
];

const steps = [
  { icon: UserPlus, title: 'Add client', text: 'Capture profile and preferences in under a minute.' },
  { icon: Ruler, title: 'Save measurements', text: 'Use structured fields to avoid missing details.' },
  { icon: ClipboardList, title: 'Create order', text: 'Assign timeline, amount, and production notes.' },
  { icon: Wallet, title: 'Invoice & track', text: 'Send invoice, collect payments, and close smoothly.' },
];

export default function Landing() {
  const { user, wasLoggedIn } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (user || wasLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={cn('min-h-screen bg-[#FDFCF9] text-slate-900 selection:bg-brand-primary/15', isRTL ? 'font-urdu' : '')}>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-[#FDFCF9]/90 backdrop-blur"
      >
        <div className="lt-container flex h-18 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-brand-primary p-2 text-white shadow-soft">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Loop Tailor</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.features')}</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.howItWorks')}</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.pricing')}</a>
            <Link to="/login"><Button variant="ghost">{t('landing.nav.signIn')}</Button></Link>
            <Link to="/signup"><Button>{t('landing.nav.startFreeTrial')}</Button></Link>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen((v) => !v)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200 bg-[#FDFCF9] md:hidden"
            >
              <div className="lt-container flex flex-col gap-3 py-4">
                <a href="#features" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.features')}</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.howItWorks')}</a>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.pricing')}</a>
                <Link to="/login"><Button variant="outline" className="w-full">{t('landing.nav.signIn')}</Button></Link>
                <Link to="/signup"><Button className="w-full">{t('landing.nav.startFreeTrial')}</Button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <Hero />

      <section id="features" className="lt-section">
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">Product capabilities</p>
            <h2 className="lt-heading-2 mt-3">Everything your tailoring business needs in one clean workspace.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">No clutter, no confusion — only the workflows that matter for day-to-day operations.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div key={feature.title} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="lt-card p-6">
                <div className="mb-4 inline-flex rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><feature.icon className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="lt-section border-y border-slate-200/70 bg-white/60">
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">How it works</p>
            <h2 className="lt-heading-2 mt-3">A simple 4-step flow your team can learn in one day.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="lt-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">Step {index + 1}</p>
                <div className="mt-3 rounded-xl bg-slate-100 p-2.5 w-fit"><step.icon className="h-4 w-4 text-slate-700" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="lt-section">
        <div className="lt-container grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="lt-card p-8">
            <p className="lt-eyebrow">Why teams switch</p>
            <h2 className="lt-heading-3 mt-3">Built for growth without adding complexity.</h2>
            <ul className="mt-6 space-y-3 text-slate-700">
              <li>• Faster order turnaround with clear stage tracking.</li>
              <li>• Better customer retention using complete client profiles.</li>
              <li>• Fewer billing mistakes with integrated invoicing.</li>
              <li>• Stronger decision-making with live dashboard analytics.</li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              {['Al-Madina Tailors', 'Classic Stitch House', 'Urban Fit Studio'].map((name) => (
                <span key={name} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">{name}</span>
              ))}
            </div>
          </div>

          <div className="lt-card p-8">
            <p className="text-sm font-semibold text-brand-primary">Simple pricing</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">One plan for all features</h3>
            <p className="mt-2 text-slate-600">Transparent pricing with no hidden fees.</p>
            <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Starts at</p>
              <p className="text-4xl font-semibold text-slate-900">PKR 0</p>
              <p className="text-sm text-slate-500">during trial period</p>
            </div>
            <Link to="/signup" className="block"><Button className="w-full">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact" className="mt-3 block"><Button variant="outline" className="w-full">Talk to sales</Button></Link>
          </div>
        </div>
      </section>

      <section className="lt-section pt-0">
        <div className="lt-container max-w-3xl">
          <div className="text-center">
            <p className="lt-eyebrow">FAQ</p>
            <h2 className="lt-heading-3 mt-3">Common questions from tailoring business owners.</h2>
          </div>
          {[{
            q: 'Can my team use Loop Tailor on mobile?',
            a: 'Yes. The app is responsive so owners and staff can update orders and clients from any device.',
          }, {
            q: 'Do I need technical knowledge to get started?',
            a: 'No. Setup is straightforward and designed for non-technical business teams.',
          }, {
            q: 'Can I migrate my current customer records?',
            a: 'Yes. You can add records manually first, then progressively import your existing data.',
          }].map((item, index) => (
            <div key={item.q} className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span className="font-medium text-slate-900">{item.q}</span>
                <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', openFaq === index && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {openFaq === index && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/70 py-8">
        <div className="lt-container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} Loop Tailor. Built for small tailoring businesses.</p>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-primary"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
      </footer>
    </div>
  );
}
