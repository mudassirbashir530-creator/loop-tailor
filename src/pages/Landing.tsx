import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, Navigate } from 'react-router-dom';
import Hero from '../components/Hero';
import { cn } from '../lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Facebook,
  FileCheck,
  FileText,
  Globe,
  Instagram,
  LayoutDashboard,
  Linkedin,
  Menu,
  Ruler,
  Scissors,
  Truck,
  UserPlus,
  Users,
  Workflow,
  X,
  Youtube,
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

const socialLinks = [
  { href: 'https://www.facebook.com/profile.php?id=61575736701852', icon: Facebook, label: 'Facebook' },
  { href: 'https://www.linkedin.com/in/loop-tailor-1b50543ba/', icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://www.instagram.com/looptailor/', icon: Instagram, label: 'Instagram' },
  { href: 'https://youtube.com/@looptailor?si=yWxjWbNEXox2WBTd', icon: Youtube, label: 'YouTube' },
];

export default function Landing() {
  const { user, wasLoggedIn } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const translatedFaqs = t('landing.faq.items') as unknown as { q: string; a: string }[];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: translatedFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  if (user || wasLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={cn('min-h-screen bg-[#FDFCF9] text-slate-900 selection:bg-brand-primary/15', isRTL ? 'font-urdu' : '')}>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

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

          <div className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-primary">Home</Link>
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.features')}</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.howItWorks')}</a>
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.about')}</Link>
            <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-brand-primary">{t('landing.nav.contact')}</Link>
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
              <div className="lt-container flex flex-col gap-3 py-4 text-sm">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                <a href="#features" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.features')}</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.howItWorks')}</a>
                <Link to="/about" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.about')}</Link>
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.contact')}</Link>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)}>{t('landing.nav.pricing')}</a>
                <Link to="/login"><Button variant="outline" className="w-full">{t('landing.nav.signIn')}</Button></Link>
                <Link to="/signup"><Button className="w-full">{t('landing.nav.getStarted')}</Button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <Hero />

      <section id="features" className="lt-section">
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">{t('landing.features.badge')}</p>
            <h2 className="lt-heading-2 mt-3">{t('landing.features.title')} <span className="text-brand-primary">{t('landing.features.titleHighlight')}</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">{t('landing.features.subtitle')}</p>
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

      <section className="lt-section border-y border-slate-200/70 bg-white/60">
        <div className="lt-container">
          <div className="mb-10 text-center">
            <p className="lt-eyebrow">{t('landing.whyChoose.badge')}</p>
            <h2 className="lt-heading-2 mt-3">{t('landing.whyChoose.title')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ClipboardList, title: t('landing.whyChoose.items.tracking.title'), desc: t('landing.whyChoose.items.tracking.desc') },
              { icon: Ruler, title: t('landing.whyChoose.items.storage.title'), desc: t('landing.whyChoose.items.storage.desc') },
              { icon: Truck, title: t('landing.whyChoose.items.delivery.title'), desc: t('landing.whyChoose.items.delivery.desc') },
              { icon: Workflow, title: t('landing.whyChoose.items.workflow.title'), desc: t('landing.whyChoose.items.workflow.desc') },
            ].map((item) => (
              <div key={item.title} className="lt-card p-5">
                <div className="inline-flex rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><item.icon className="h-4 w-4" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="lt-section">
        <div className="lt-container grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="lt-card p-7">
            <p className="lt-eyebrow">{t('landing.workflow.badge')}</p>
            <h2 className="lt-heading-2 mt-3">{t('landing.workflow.title')} {t('landing.workflow.titleHighlight')}</h2>
            <p className="mt-3 text-slate-600">{t('landing.workflow.subtitle')}</p>
            <div className="mt-6 space-y-3">
              {[
                { icon: UserPlus, title: t('landing.workflow.items.profile.title'), desc: t('landing.workflow.items.profile.desc') },
                { icon: Scissors, title: t('landing.workflow.items.order.title'), desc: t('landing.workflow.items.order.desc') },
                { icon: Workflow, title: t('landing.workflow.items.progress.title'), desc: t('landing.workflow.items.progress.desc') },
                { icon: FileCheck, title: t('landing.workflow.items.deliver.title'), desc: t('landing.workflow.items.deliver.desc') },
              ].map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary"><step.icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">{t('landing.workflow.stepPrefix')} {index + 1}</p>
                      <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lt-card p-7">
            <p className="lt-eyebrow">Operational benefits</p>
            <h3 className="lt-heading-3 mt-3">Built for real tailoring workflows, not generic CRMs.</h3>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" /> Structured measurement storage per customer.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" /> Delivery-date visibility to prevent missed commitments.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" /> Invoices and payment tracking connected to each order.</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" /> Team-wide transparency from intake to delivery.</li>
            </ul>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Need implementation guidance?</p>
              <p className="mt-1">Read the full product overview and onboarding flow in our About and Contact sections.</p>
              <div className="mt-4 flex gap-2">
                <Link to="/about"><Button variant="outline" size="sm">About</Button></Link>
                <Link to="/contact"><Button variant="outline" size="sm">Contact</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="lt-section border-y border-slate-200/70 bg-white/60">
        <div className="lt-container grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="lt-card p-8">
            <p className="lt-eyebrow">{t('landing.pricing.badge')}</p>
            <h2 className="lt-heading-3 mt-3" dangerouslySetInnerHTML={{ __html: t('landing.pricing.title') }} />
            <p className="mt-3 text-slate-600">{t('landing.pricing.planDesc')}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {(t('landing.pricing.features') as unknown as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lt-card p-8">
            <p className="text-sm font-semibold text-brand-primary">{t('landing.pricing.planName')}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">{t('landing.pricing.price')}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('landing.pricing.perMonth')} · {t('landing.pricing.freeBeta')}</p>
            <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{t('landing.pricing.planDesc')}</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{t('landing.pricing.noCreditCard')}</p>
            </div>
            <Link to="/signup" className="block"><Button className="w-full">{t('landing.pricing.cta')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="lt-section">
        <div className="lt-container grid gap-6 md:grid-cols-2">
          <div className="lt-card p-7">
            <p className="lt-eyebrow">About Loop Tailor</p>
            <h3 className="lt-heading-3 mt-3">Purpose-built software for tailors and small clothing businesses.</h3>
            <p className="mt-3 text-slate-600">Loop Tailor is focused on reducing admin overhead for tailoring teams so they can deliver better garments faster. The system centralizes client records, measurements, order progress, invoices, and dashboard insights in one place.</p>
            <Link to="/about" className="mt-5 inline-flex items-center text-sm font-semibold text-brand-primary hover:underline">Read full about page <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <div className="lt-card p-7">
            <p className="lt-eyebrow">Contact & support</p>
            <h3 className="lt-heading-3 mt-3">Need onboarding help or have product questions?</h3>
            <p className="mt-3 text-slate-600">Our team supports setup, workflow guidance, and account assistance for tailoring shops moving from paper registers or spreadsheets.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/contact"><Button>Contact us</Button></Link>
              <Link to="/careers"><Button variant="outline">Careers</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lt-section pt-0">
        <div className="lt-container max-w-3xl">
          <div className="text-center">
            <p className="lt-eyebrow">{t('landing.faq.title')}</p>
            <h2 className="lt-heading-3 mt-3">{t('landing.faq.subtitle')}</h2>
          </div>
          {translatedFaqs.map((item, index) => (
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

      <section className="lt-section pt-0">
        <div className="lt-container">
          <div className="rounded-[2rem] bg-brand-primary px-8 py-12 text-center text-white md:px-14">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl" dangerouslySetInnerHTML={{ __html: t('landing.cta.title') }} />
            <p className="mx-auto mt-4 max-w-2xl text-white/85">{t('landing.cta.subtitle')}</p>
            <Link to="/signup" className="mt-6 inline-flex"><Button size="lg" className="bg-white text-brand-primary hover:bg-white/90">{t('landing.cta.button')}</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/70 py-10">
        <div className="lt-container grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-brand-primary p-2 text-white"><Scissors className="h-5 w-5" /></div>
              <span className="font-semibold tracking-tight">Loop Tailor</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{t('landing.footer.tagline')}</p>
            <p className="mt-2 text-xs text-slate-500">{t('landing.footer.rights')}</p>
          </div>

          <div className="grid gap-2 text-sm text-slate-600">
            <Link to="/" className="hover:text-brand-primary">{t('landing.footer.home')}</Link>
            <a href="#features" className="hover:text-brand-primary">{t('landing.footer.features')}</a>
            <Link to="/about" className="hover:text-brand-primary">{t('landing.footer.about')}</Link>
            <Link to="/contact" className="hover:text-brand-primary">{t('landing.footer.contact')}</Link>
            <Link to="/legal" className="hover:text-brand-primary">{t('landing.footer.privacy')}</Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">{t('landing.footer.follow')}</h4>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-primary"
              >
                <Globe className="h-4 w-4" />
                {language === 'en' ? 'اردو' : 'English'}
              </button>
            </div>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit our ${social.label} profile`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:text-brand-primary"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
