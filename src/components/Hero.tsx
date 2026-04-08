import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle2, ClipboardList, Scissors, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

const stats = [
  { label: 'Orders tracked', value: '12k+' },
  { label: 'Active shops', value: '1.8k+' },
  { label: 'Avg. time saved', value: '9 hrs/week' },
];

export default function Hero() {
  const { isRTL } = useLanguage();

  return (
    <section className="lt-section relative overflow-hidden pt-28 md:pt-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
      </div>

      <div className="lt-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            <Scissors className="h-4 w-4" />
            Built for modern tailoring teams
          </div>

          <h1 className="lt-heading-1 max-w-xl text-balance text-slate-900">
            Run your tailoring business with precision, speed, and zero clutter.
          </h1>

          <p className="lt-body-lg max-w-xl text-slate-600">
            Loop Tailor brings orders, clients, measurements, and invoices into one intelligent workflow so your team can focus on craftsmanship.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/signup">
              <Button size="lg" className="min-w-44">
                Start free trial
                <ArrowRight className={cn('h-4 w-4', isRTL ? 'mr-2 rotate-180' : 'ml-2')} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="min-w-44">
                View demo dashboard
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-600">
            {['No credit card required', '2-minute setup', 'Built for mobile teams'].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06 }}
          className="lt-card p-5 md:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {[
              { icon: ClipboardList, title: 'Order pipeline', subtitle: 'Track every stage from intake to delivery' },
              { icon: Users, title: 'Client records', subtitle: 'History, measurements, and preferences in one place' },
              { icon: Scissors, title: 'Production clarity', subtitle: 'Keep cutters and stitchers aligned daily' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="rounded-xl bg-brand-primary/10 p-2 text-brand-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
