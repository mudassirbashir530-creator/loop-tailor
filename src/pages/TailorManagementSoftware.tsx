import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Scissors, CheckCircle, Clock, Users, Zap } from 'lucide-react';

export default function TailorManagementSoftware() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Tailor Management Software – Complete Digital Solution</h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Transform your tailoring business with Loop Tailor. Manage orders, measurements, and customers with our all-in-one digital platform.
          </p>
          <div className="mt-10">
            <Link to="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20">
              Try Loop Tailor
            </Link>
          </div>
        </motion.div>

        <section className="mb-20">
          <h2 className="text-3xl font-display font-bold mb-10 text-center text-slate-900">Common Challenges in Tailoring Businesses</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: "Inefficient Order Tracking", description: "Struggling to keep track of deadlines and delivery dates leads to missed commitments and unhappy customers." },
              { icon: Users, title: "Disorganized Customer Data", description: "Scattered paper records and phone notes make it difficult to maintain customer history and preferences." },
              { icon: Scissors, title: "Measurement Errors", description: "Manual measurement recording is prone to errors, resulting in costly alterations and wasted fabric." }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon className="h-7 w-7 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 text-white rounded-3xl p-12 md:p-20 mb-20">
          <h2 className="text-3xl font-display font-bold mb-10 text-center">How Loop Tailor Solves These Problems</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">Streamlined Order Management</h3>
              <p className="text-slate-300 leading-relaxed mb-6">Our software provides a centralized dashboard to track every order from intake to delivery. Get automated reminders for upcoming deadlines so you never miss a delivery date again.</p>
              <h3 className="text-2xl font-bold mb-4">Digital Measurement Profiles</h3>
              <p className="text-slate-300 leading-relaxed">Store customer measurements securely in the cloud. Access them instantly from any device, ensuring accuracy and reducing the need for repeated measurements.</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Automated Customer Database</h3>
              <p className="text-slate-300 leading-relaxed mb-6">Keep all customer details, order history, and preferences in one place. Improve customer service by providing personalized experiences based on their past orders.</p>
              <h3 className="text-2xl font-bold mb-4">Business Analytics</h3>
              <p className="text-slate-300 leading-relaxed">Gain insights into your business performance with easy-to-read reports. Understand your most popular services and peak business times to optimize your operations.</p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <h2 className="text-3xl font-display font-bold mb-6 text-slate-900">Ready to digitize your tailoring shop?</h2>
          <Link to="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20">
            Try Loop Tailor
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
