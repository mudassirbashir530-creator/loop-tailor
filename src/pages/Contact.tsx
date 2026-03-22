import React from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Contact() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Get in Touch</h1>
          <p className="text-xl text-slate-600">Have questions about Loop Tailor? Our team is here to help you.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-none shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">Email Us</h3>
              <p className="text-slate-500">support@looptailor.com</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <Phone className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">Call Us</h3>
              <p className="text-slate-500">+1 (555) 123-4567</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">Visit Us</h3>
              <p className="text-slate-500">123 Tailor St, Tech City</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-display font-bold mb-8 text-slate-900">Send us a message</h2>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">First Name</label>
                <Input placeholder="John" className="h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Last Name</label>
                <Input placeholder="Doe" className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <Input type="email" placeholder="john@example.com" className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Message</label>
              <textarea className="w-full min-h-[150px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <Button className="w-full h-12 text-lg font-bold bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl">Send Message</Button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
