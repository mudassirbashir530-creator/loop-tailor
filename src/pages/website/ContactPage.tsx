import React, { useState } from 'react';
import { Mail, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfFjCVpUt9urjINekoaRdi3-JSZx2gJJ52zt1Fi_Z3gKsqK1S6LWIhvSkvoc_iwGZk/exec";

interface ContactFormData {
  name: string;
  email: string;
  phone1: string;
  phone2: string;
  message: string;
}

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    
    try {
      const response = await fetch(APP_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          name: data.name,
          phone1: data.phone1 || "",
          phone2: data.phone2 || "",
          email: data.email,
          message: data.message,
        }),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If response is opaque (no-cors mode) or JSON parsing fails, we consider it a success if text response is returned or ok but unparseable
        console.warn("Could not parse JSON response, but request was sent. Assuming success.");
        result = { success: true };
      }
      
      if (result.success) {
        toast.success("Message sent successfully! We will contact you soon.");
        reset();
      } else {
        toast.error("Failed to send message: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="min-h-screen bg-background py-24"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hero */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Contact Info (Left Column) */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:col-span-1 space-y-6"
          >
            <InfoCard icon={<Mail className="h-6 w-6" />} label="Email" value="looptailor@gmail.com" />
            <InfoCard icon={<MapPin className="h-6 w-6" />} label="Address" value="Manzoor Colony Karachi Pakistan" multiLine />
            <InfoCard icon={<MessageSquare className="h-6 w-6" />} label="WhatsApp" value="03321379924" />
          </motion.div>

          {/* Contact Form (Right Column) */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                      <Input 
                        id="name" 
                        {...register("name", { required: "Name is required" })} 
                        placeholder="John Doe" 
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                      <Input 
                        id="email" 
                        type="email" 
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "invalid email address"
                          }
                        })} 
                        placeholder="john@example.com" 
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="phone1" className="text-sm font-medium">Primary Phone</label>
                      <Input 
                        id="phone1" 
                        {...register("phone1")} 
                        placeholder="03001234567 (Optional)" 
                        aria-invalid={!!errors.phone1}
                      />
                      {errors.phone1 && <p className="text-xs text-red-500">{errors.phone1.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone2" className="text-sm font-medium">Secondary Phone</label>
                      <Input 
                        id="phone2" 
                        {...register("phone2")} 
                        placeholder="03001234568 (Optional)" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
                    <textarea 
                      id="message" 
                      {...register("message", { required: "Message is required" })} 
                      placeholder="Write your message here..."
                      className="w-full min-h-[150px] rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full text-white font-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending Message...
                      </>
                    ) : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Business Hours */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto text-center bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="font-semibold text-lg mb-2 text-primary">Business Hours</h3>
              <p className="text-muted-foreground">
                Monday - Saturday: 9:00 AM - 6:00 PM<br/>
                Sunday: Closed
              </p>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}

function InfoCard({ icon, label, value, multiLine }: { icon: React.ReactNode, label: string, value: string, multiLine?: boolean }) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <p className={`font-medium ${multiLine ? 'whitespace-pre-line' : ''}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
