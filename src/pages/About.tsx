import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">About Loop Tailor</h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Loop Tailor is a smart, cloud-based management software designed to digitize and streamline the tailoring industry. We replace messy paper records and scattered WhatsApp messages with a single, organized platform.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-slate-200 rounded-3xl h-96 w-full overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/tailor-shop/800/600" alt="Tailor working" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold mb-4 text-slate-900">Who It Is For</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Built specifically for <strong className="text-slate-900 font-bold">tailors, boutiques, and stitching shops</strong> of all sizes, our system empowers business owners to focus on their craft rather than administrative tasks.
            </p>
            
            <h2 className="text-3xl font-display font-bold mb-4 text-slate-900">Main Features</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              With powerful features like <strong className="text-slate-900 font-bold">real-time order tracking, digital measurement profiles, and automated customer management</strong>, Loop Tailor ensures that every garment is delivered perfectly and on time.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
