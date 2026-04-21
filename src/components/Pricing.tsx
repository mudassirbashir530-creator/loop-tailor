import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-24 bg-[#FDFCF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">{t('landing.pricing.badge')}</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900" dangerouslySetInnerHTML={{ __html: t('landing.pricing.title') }}></h3>
        </div>

        <div className="max-w-lg mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.4 }}
            className="relative p-[2px] rounded-[2.5rem] bg-gradient-to-b from-brand-primary/20 to-transparent shadow-2xl shadow-brand-primary/5"
          >
            <div className="bg-white rounded-[2.4rem] p-10 h-full border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-2xl font-bold mb-1 text-slate-900">{t('landing.pricing.planName')}</h4>
                  <p className="text-slate-500">{t('landing.pricing.planDesc')}</p>
                </div>
                <div className="bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wide px-3 py-1 rounded-full">
                  {t('landing.pricing.mostPopular')}
                </div>
              </div>
              
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-5xl font-black text-slate-900">{t('landing.pricing.price')}</span>
                <span className="text-slate-400 font-medium">{t('landing.pricing.perMonth')}</span>
                <span className="ml-2 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">{t('landing.pricing.freeBeta')}</span>
              </div>

              <ul className="space-y-4 mb-10">
                {(t('landing.pricing.features') as unknown as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-slate-600 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button size="lg" className="w-full h-14 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-base font-bold text-white shadow-xl shadow-brand-primary/20 hover:-translate-y-1 transition-all">
                  {t('landing.pricing.cta')}
                </Button>
              </Link>
              <p className="text-center text-xs text-slate-400 mt-6 font-medium">{t('landing.pricing.noCreditCard')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
