import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function Careers() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Join Our Team</h1>
          <p className="text-xl text-slate-600 leading-relaxed">Help us revolutionize the tailoring industry. We're building tools for craftsmen, and we need passionate people to make it happen.</p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-16 mb-24 items-center">
          <div>
            <h2 className="text-4xl font-display font-bold mb-8 text-slate-900">Why Loop Tailor?</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">We believe in giving our team the freedom and resources they need to do their best work. When you join us, you're not just an employee; you're a partner in our mission.</p>
            <ul className="space-y-6">
              {[
                'Competitive salary and equity packages', 
                'Remote-first culture with flexible hours', 
                'Comprehensive health, dental, and vision insurance', 
                'Unlimited paid time off (minimum 3 weeks required)', 
                'Annual learning & development stipend',
                'Home office setup allowance'
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-slate-700 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-primary rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/10 rounded-full blur-3xl"></div>
            <h3 className="text-3xl font-display font-bold mb-6 relative z-10">Open Positions</h3>
            <p className="text-white/80 text-lg mb-10 relative z-10 leading-relaxed">We currently don't have any open roles, but we're always looking for great talent. If you think you'd be a great fit, we want to hear from you.</p>
            <a href="mailto:careers@looptailor.com" className="inline-flex items-center gap-2 bg-white text-brand-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors relative z-10">
              Send your resume <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
