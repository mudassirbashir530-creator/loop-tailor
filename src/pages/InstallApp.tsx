import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'framer-motion';
import { Smartphone, WifiOff, Download, CheckCircle } from 'lucide-react';
import InstallButton from '../components/InstallButton';

export default function InstallApp() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Install Loop Tailor App</h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-10">
            Get the full Android-like experience directly on your device. Fast, reliable, and works offline.
          </p>
          <InstallButton className="px-8 py-4 text-lg rounded-full" />
        </motion.div>

        <section className="mb-20">
          <h2 className="text-3xl font-display font-bold mb-10 text-center text-slate-900">Why Install?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex gap-6">
              <div className="bg-brand-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
                <WifiOff className="h-8 w-8 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Works Offline</h3>
                <p className="text-slate-500">Access your orders, measurements, and customer data even when you don't have an internet connection. Changes sync automatically when you're back online.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex gap-6">
              <div className="bg-brand-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
                <Smartphone className="h-8 w-8 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Android-like Experience</h3>
                <p className="text-slate-500">Enjoy a native-app feel with smooth navigation, fast loading times, and easy access from your home screen.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-display font-bold mb-10 text-center text-slate-900">How to Install</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { step: "1", title: "Open in Chrome or Edge", description: "Open the Loop Tailor website in your mobile browser." },
              { step: "2", title: "Tap the Menu", description: "Tap the three-dot menu icon in the top-right or bottom-right corner of your browser." },
              { step: "3", title: "Select 'Install App'", description: "Look for 'Install App' or 'Add to Home Screen' in the menu and tap it." }
            ].map((item, index) => (
              <div key={index} className="flex gap-6 items-start bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="bg-slate-900 text-white font-bold w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{item.title}</h3>
                  <p className="text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
