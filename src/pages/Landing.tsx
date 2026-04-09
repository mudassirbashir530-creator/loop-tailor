import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, Navigate } from 'react-router-dom';
import Hero from '../components/Hero';
import { cn } from '../lib/utils';
import Footer from '../components/Footer';
import {
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
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cardFade, defaultViewport, fadeUp, staggerContainer } from '../lib/animations';

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

  const sectionImageMap = {
  features: {
    src: 'https://images.unsplash.com/photo-1595341595379-cf0f7f6bd6a8?auto=format&fit=crop&w=1600&q=80',
    alt: 'Tailor discussing garment details with a customer in a workshop',
  },
  flow: {
    src: 'https://images.unsplash.com/photo-1521223344201-d169129f7b7e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Sewing workflow with patterns, measuring tape, and fabric pieces',
  },
  faq: {
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    alt: 'Premium tailored suit details on mannequin with measuring tape',
  },
};

export default function Landing() {
  const { user, wasLoggedIn } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

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
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: [0, -1.5, 0] }}
              whileHover={{ y: -1, scale: 1.03 }}
              transition={prefersReducedMotion ? { duration: 0.25 } : { duration: 0.4, y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } }}
              className="rounded-xl bg-brand-primary p-2 text-white shadow-soft"
            >
              <Scissors className="h-5 w-5" />
            </motion.div>
            <span className="text-lg font-semibold tracking-tight">Loop Tailor</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-brand-primary">About</Link>
            <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-brand-primary">Contact</Link>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.features')}</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.howItWorks')}</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.pricing')}</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-brand-primary">FAQ</a>
            <Link to="/privacy" className="text-sm font-medium text-slate-600 hover:text-brand-primary">Privacy</Link>
            <Link to="/terms" className="text-sm font-medium text-slate-600 hover:text-brand-primary">Terms</Link>
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
                <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                <Link to="/privacy" onClick={() => setIsMenuOpen(false)}>Privacy</Link>
                <Link to="/terms" onClick={() => setIsMenuOpen(false)}>Terms</Link>
                <Link to="/login"><Button variant="outline" className="w-full">{t('landing.nav.signIn')}</Button></Link>
                <Link to="/signup"><Button className="w-full">{t('landing.nav.startFreeTrial')}</Button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <Hero />

      <motion.section id="features" className="lt-section" variants={fadeUp} initial="hidden" whileInView="visible" viewport={defaultViewport}>
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">Product capabilities</p>
            <h2 className="lt-heading-2 mt-3">Everything your tailoring business needs in one clean workspace.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">No clutter, no confusion — only the workflows that matter for day-to-day operations.</p>
          </div>
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-soft">
            <div className="grid items-center gap-0 md:grid-cols-2">
              <motion.img
                src={sectionImageMap.features.src}
                alt={sectionImageMap.features.alt}
                loading="lazy"
                decoding="async"
                width={1600}
                height={1000}
                initial={{ opacity: 0, scale: 1.04 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={defaultViewport}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="h-56 w-full object-cover md:h-full"
              />
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={defaultViewport}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
                className="p-6 md:p-8"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary">Real workshop clarity</p>
                <p className="mt-2 text-slate-600">
                  From first consultation to final fitting, each stage is visible so teams can coordinate confidently and deliver on time.
                </p>
              </motion.div>
            </div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={defaultViewport} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={cardFade} whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className="lt-card p-6">
                <div className="mb-4 inline-flex rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><feature.icon className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section id="how-it-works" className="lt-section border-y border-slate-200/70 bg-white/60" variants={fadeUp} initial="hidden" whileInView="visible" viewport={defaultViewport}>
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">How it works</p>
            <h2 className="lt-heading-2 mt-3">A simple 4-step flow your team can learn in one day.</h2>
          </div>
          <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={defaultViewport}
              transition={{ duration: 0.46, ease: 'easeOut' }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <img
                src={sectionImageMap.flow.src}
                alt={sectionImageMap.flow.alt}
                loading="lazy"
                decoding="async"
                width={1400}
                height={900}
                className="h-60 w-full object-cover md:h-72"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={defaultViewport}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
              className="lt-card flex flex-col justify-center p-6"
            >
              <h3 className="text-xl font-semibold text-slate-900">From measurements to delivery, everyone stays in sync.</h3>
              <p className="mt-3 text-slate-600">
                Scroll-friendly process visibility helps cutters, stitchers, and front-desk teams coordinate without repeated follow-ups.
              </p>
            </motion.div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={defaultViewport} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div key={step.title} variants={cardFade} className="lt-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">Step {index + 1}</p>
                <div className="mt-3 rounded-xl bg-slate-100 p-2.5 w-fit"><step.icon className="h-4 w-4 text-slate-700" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section id="pricing" className="lt-section" variants={fadeUp} initial="hidden" whileInView="visible" viewport={defaultViewport}>
        <div className="lt-container grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={defaultViewport} transition={{ duration: 0.46, ease: 'easeOut' }} className="lt-card p-8">
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
            <div className="mt-6 rounded-3xl border border-brand-primary/20 bg-brand-primary/[0.03] p-5">
              <h4 className="font-semibold text-slate-900">Built for tailoring workflows</h4>
              <p className="mt-2 text-sm text-slate-600">Production pipeline, customer records, measurements, invoices, and follow-ups in one subscription.</p>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={defaultViewport} className="grid gap-3">
            {[
              { name: 'Starter', price: 'PKR 0', subtitle: 'Trial period', features: ['Orders + clients', 'Measurements', 'Mobile dashboard'] },
              { name: 'Growth', price: 'Contact sales', subtitle: 'For scaling teams', features: ['Multi-staff workflow', 'Invoice tracking', 'Priority support'] },
              { name: 'Enterprise', price: 'Custom', subtitle: 'For multi-branch', features: ['Advanced reporting', 'Custom onboarding', 'Dedicated support'] },
            ].map((plan, index) => (
              <motion.div key={plan.name} variants={cardFade} whileHover={{ y: -4 }} className={cn("lt-card p-6 transition-shadow", index === 1 && "border-brand-primary/30 shadow-[0_20px_40px_-20px_rgba(0,70,67,0.45)]")}>
                <p className="text-sm font-semibold text-brand-primary">{plan.name}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{plan.price}</p>
                <p className="text-xs text-slate-500">{plan.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
                </ul>
                <Button className="mt-4 w-full">{index === 0 ? 'Start now' : 'Talk to sales'}</Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section id="faq" className="lt-section pt-0" variants={fadeUp} initial="hidden" whileInView="visible" viewport={defaultViewport}>
        <div className="lt-container max-w-3xl">
          <div className="text-center">
            <p className="lt-eyebrow">FAQ</p>
            <h2 className="lt-heading-3 mt-3">Common questions from tailoring business owners.</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={defaultViewport}
            transition={{ duration: 0.42, ease: 'easeOut' }}
            className="mt-5 overflow-hidden rounded-3xl border border-slate-200"
          >
            <img
              src={sectionImageMap.faq.src}
              alt={sectionImageMap.faq.alt}
              loading="lazy"
              decoding="async"
              width={900}
              height={700}
              className="h-48 w-full object-cover md:h-56"
            />
          </motion.div>
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
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
                    <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="border-t border-slate-200 bg-white/70 py-3">
        <div className="lt-container flex justify-end">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-primary"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
