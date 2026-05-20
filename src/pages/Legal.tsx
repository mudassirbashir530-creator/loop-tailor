import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';

interface LegalProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function Legal({ title, lastUpdated, children }: LegalProps) {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">{title}</h1>
          <p className="text-slate-500 mb-16 text-lg font-medium">Last updated: {lastUpdated}</p>
          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-brand-primary hover:prose-a:text-brand-primary/80 prose-p:leading-relaxed prose-li:leading-relaxed bg-white p-10 md:p-16 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            {children}
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
