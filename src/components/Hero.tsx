import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle2, ClipboardList, Scissors, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { cardFade, defaultViewport, fadeUp, staggerContainer } from '../lib/animations';

const stats = [
  { label: 'Orders tracked', value: '12k+' },
  { label: 'Active shops', value: '1.8k+' },
  { label: 'Avg. time saved', value: '9 hrs/week' },
];

export default function Hero() {
  const { isRTL } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="lt-section relative overflow-hidden pt-28 md:pt-32">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
        <motion.div
          animate={prefersReducedMotion ? {} : { x: [0, 18, 0], y: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[10%] top-20 h-40 w-40 rounded-full bg-brand-primary/8 blur-3xl"
        />
        <motion.div
          animate={prefersReducedMotion ? {} : { x: [0, -22, 0], y: [0, 10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 left-[8%] h-44 w-44 rounded-full bg-brand-primary/10 blur-3xl"
        />
      </div>

      <div className="lt-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="space-y-6"
        >
          <motion.div variants={cardFade} className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            <Scissors className="h-4 w-4" />
            Built for modern tailoring teams
          </motion.div>

          <motion.h1 variants={fadeUp} className="lt-heading-1 max-w-xl text-balance text-slate-900">
            Run your tailoring business with precision, speed, and zero clutter.
          </motion.h1>

          <motion.p variants={fadeUp} className="lt-body-lg max-w-xl text-slate-600">
            Loop Tailor brings orders, clients, measurements, and invoices into one intelligent workflow so your team can focus on craftsmanship.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Link to="/signup" aria-label="Start now with Loop Tailor">
              <Button size="lg" className="min-w-44">
                Start now
                <ArrowRight className={cn('h-4 w-4', isRTL ? 'mr-2 rotate-180' : 'ml-2')} />
              </Button>
            </Link>
            <Link to="/#features" aria-label="Learn more about product features">
              <Button size="lg" variant="outline" className="min-w-44">
                Learn more
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-5 text-sm text-slate-600">
            {['No credit card required', '2-minute setup', 'Built for mobile teams'].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
          className="lt-card relative overflow-hidden p-5 md:p-7"
        >
          <div className="absolute inset-x-8 top-4 h-24 rounded-3xl bg-gradient-to-r from-brand-primary/12 via-brand-primary/4 to-brand-primary/12 blur-2xl" />
          <motion.div variants={cardFade} className="relative mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Live operations</p>
              <p className="text-sm font-semibold text-slate-900">Order board synced in real-time</p>
            </div>
            <Sparkles className="h-4 w-4 text-brand-primary" />
            {!prefersReducedMotion && (
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -top-6 right-2 hidden rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur md:block"
              >
                Live tailoring workflow
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={cardFade} className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerContainer} className="mt-5 space-y-3">
            {[
              { icon: ClipboardList, title: 'Order pipeline', subtitle: 'Track every stage from intake to delivery' },
              { icon: Users, title: 'Client records', subtitle: 'History, measurements, and preferences in one place' },
              { icon: Scissors, title: 'Production clarity', subtitle: 'Keep cutters and stitchers aligned daily' },
            ].map((item) => (
              <motion.div key={item.title} variants={cardFade} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
