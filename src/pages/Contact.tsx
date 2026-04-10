import React, { useState } from 'react';
import PublicLayout from '../components/PublicLayout';
import { motion } from 'motion/react';
import { Mail, MapPin, User, MessageSquare, Loader2, CheckCircle2, Phone } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { safeFetchJSON } from '../lib/apiHelpers';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: fetchError } = await safeFetchJSON('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!fetchError) {
        setIsSuccess(true);
        setFormData({ firstName: '', lastName: '', phone: '', email: '', message: '' });
        
        // Reset success message after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        setError(fetchError || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending contact form:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-display font-black mb-6 text-slate-900">Get in Touch</h1>
          <p className="text-xl text-slate-600">Have questions about Loop Tailor? Our team is here to help you.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <Card className="border-none shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">Email Us</h3>
              <p className="text-slate-500">looptailor@gmail.com</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-900">Visit Us</h3>
              <p className="text-slate-500">manzoor colony karachi</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-display font-bold mb-8 text-slate-900">Send us a message</h2>
          
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-2">Message Sent!</h3>
              <p className="text-emerald-600">Thank you for reaching out. We will get back to you shortly.</p>
              <Button 
                onClick={() => setIsSuccess(false)}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John" 
                      className="h-12 pl-9" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe" 
                      className="h-12 pl-9" 
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com" 
                      className="h-12 pl-9" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000" 
                      className="h-12 pl-9" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 h-4 w-4 text-slate-400 z-10" />
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full min-h-[150px] rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary resize-none" 
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </div>
              </div>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-lg font-bold bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
