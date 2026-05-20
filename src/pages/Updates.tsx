import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';

export default function Updates() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-20 text-center">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Product Updates</h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">Stay up to date with the latest features, improvements, and bug fixes in Loop Tailor.</p>
        </motion.div>
        
        <div className="space-y-16 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-brand-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-xs">v2.1</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-slate-900">Version 2.1.0</h2>
                <span className="text-sm font-medium text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">March 2026</span>
              </div>
              <ul className="space-y-3 text-slate-600 leading-relaxed">
                <li className="flex gap-3"><span className="text-brand-primary font-bold">&bull;</span> <span><strong>Progressive Web App (PWA):</strong> Install Loop Tailor on your mobile device and use it offline.</span></li>
                <li className="flex gap-3"><span className="text-brand-primary font-bold">&bull;</span> <span><strong>Multi-Shop Support:</strong> Manage multiple shops under a single account with isolated data.</span></li>
                <li className="flex gap-3"><span className="text-brand-primary font-bold">&bull;</span> <span><strong>Performance Improvements:</strong> Faster load times and smoother animations across the app.</span></li>
              </ul>
            </div>
          </div>
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-xs">v2.0</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-slate-900">Version 2.0.0</h2>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">January 2026</span>
              </div>
              <ul className="space-y-3 text-slate-600 leading-relaxed">
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Complete UI redesign with a modern, intuitive interface.</span></li>
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Advanced measurement tracking and history.</span></li>
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Automated invoice generation and PDF export.</span></li>
              </ul>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <span className="font-bold text-xs">v1.5</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-slate-900">Version 1.5.0</h2>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">November 2025</span>
              </div>
              <ul className="space-y-3 text-slate-600 leading-relaxed">
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Added Quick Order functionality for faster entry.</span></li>
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Improved customer search and filtering.</span></li>
                <li className="flex gap-3"><span className="text-slate-400 font-bold">&bull;</span> <span>Bug fixes related to date formatting.</span></li>
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </PublicLayout>
  );
}
