import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { Target, Users, Zap } from 'lucide-react';

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">About Loop Tailor</h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Loop Tailor is a smart, cloud-based management software designed to digitize and streamline the tailoring industry. We replace messy paper records and scattered communications with a single, organized platform.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div className="rounded-3xl h-96 w-full overflow-hidden shadow-2xl">
             {/* TODO: Replace with a proper-hosted image */}
             <img src="https://picsum.photos/1920/1080" alt="Loop Tailor App Interface" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold mb-6 text-slate-900">Our Mission: Digitizing Tailoring Businesses</h2>
            <p className="text-slate-600 mb-6 text-lg leading-relaxed">
              Our mission is to empower tailors and boutique owners by providing them with the digital tools they need to scale their businesses. We believe that by automating administrative tasks, we can help artisans focus on what they do best: creating beautiful garments.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed">
              We are committed to building a reliable, secure, and user-friendly platform that grows with your business.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Users, title: "Built for Tailors & Boutiques", description: "Designed specifically for the unique needs of tailoring shops and fashion boutiques." },
            { icon: Target, title: "Precision & Organization", description: "Manage measurements, orders, and customer profiles with absolute precision." },
            { icon: Zap, title: "Seamless Digitization", description: "Transition from paper-based chaos to a streamlined digital workflow effortlessly." }
          ].map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="bg-brand-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <item.icon className="h-7 w-7 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="mt-24 text-center bg-brand-primary/5 rounded-[3rem] p-12 md:p-20 border border-brand-primary/10"
        >
          <h2 className="text-3xl md:text-4xl font-display font-black mb-6 text-slate-900">Ready to digitize your tailoring business?</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">Join thousands of tailors and boutiques who have streamlined their operations with LoopTailor.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto px-10 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full font-bold text-lg shadow-xl shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
              Start Free Trial
            </a>
            <a href="/contact" className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-slate-200 hover:border-brand-primary/30 text-slate-900 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95">
              Contact Sales
            </a>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
