import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { Smartphone, WifiOff, Zap, Download } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export default function MobileApp() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-slate-900">Tailoring on the Go</h1>
          <p className="text-xl text-slate-600 leading-relaxed">Take Loop Tailor wherever you go with our Progressive Web App (PWA). It works seamlessly on both iOS and Android devices, right from your browser.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <Card className="border-none shadow-lg hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <WifiOff className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-slate-900">Offline Mode</h3>
              <p className="text-slate-600 leading-relaxed">Access your customers, measurements, and orders even without an internet connection. Changes sync automatically when you're back online.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-slate-900">Lightning Fast</h3>
              <p className="text-slate-600 leading-relaxed">Cached assets ensure the app loads instantly, saving you precious time during busy hours in the shop.</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg hover:-translate-y-1 transition-transform duration-300">
            <CardContent className="p-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-slate-900">Native Feel</h3>
              <p className="text-slate-600 leading-relaxed">Enjoy a full-screen, app-like experience without the browser chrome getting in the way. It looks and feels like a native app.</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px] opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-4 mb-12">
              <Download className="h-10 w-10 text-brand-primary" />
              <h2 className="text-4xl font-display font-bold text-center">How to Install</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-16">
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Smartphone className="h-6 w-6 text-brand-primary"/> On iOS (Safari)</h3>
                <ol className="list-decimal list-outside ml-5 space-y-4 text-white/80 text-lg">
                  <li className="pl-2">Open Loop Tailor in Safari.</li>
                  <li className="pl-2">Tap the <strong>Share</strong> button at the bottom of the screen.</li>
                  <li className="pl-2">Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li className="pl-2">Tap <strong>"Add"</strong> in the top right corner.</li>
                </ol>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Smartphone className="h-6 w-6 text-brand-primary"/> On Android (Chrome)</h3>
                <ol className="list-decimal list-outside ml-5 space-y-4 text-white/80 text-lg">
                  <li className="pl-2">Open Loop Tailor in Chrome.</li>
                  <li className="pl-2">Tap the menu icon (three dots) in the top right corner.</li>
                  <li className="pl-2">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li className="pl-2">Follow the on-screen prompts to install.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
