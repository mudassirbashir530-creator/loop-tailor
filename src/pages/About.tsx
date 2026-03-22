import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">About Loop Tailor</h1>
          <p className="text-xl text-slate-600 leading-relaxed">We are dedicated to empowering craftsmen with digital tools that streamline their workflow, enhance customer relationships, and grow their businesses.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-slate-200 rounded-3xl h-96 w-full overflow-hidden shadow-lg">
             <img src="https://picsum.photos/seed/tailor-shop/800/600" alt="Tailor working" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold mb-4 text-slate-900">Our Mission</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">To digitize and elevate the tailoring experience globally, making precision and craftsmanship accessible and manageable through intuitive technology.</p>
            
            <h2 className="text-3xl font-display font-bold mb-4 text-slate-900">Our Story</h2>
            <p className="text-slate-600 text-lg leading-relaxed">Founded by a team of technologists and tailoring enthusiasts, Loop Tailor was born out of a desire to solve the everyday challenges faced by bespoke tailors. From lost measurements to missed deadlines, we saw an opportunity to bring order and efficiency to a beautiful, traditional craft.</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
