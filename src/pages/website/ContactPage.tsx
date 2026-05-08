import React, { useState } from 'react';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const data = new URLSearchParams(formData as any);
      
      const response = await fetch('https://script.google.com/macros/s/AKfycbwcJtQ4K9Tw0O7xjD2MkEsgKDFyCjIqhZU1d4ZUxA9uqo31Ih5vHC_hnkNc0wXMSI2Y/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data.toString(),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      toast.success('Message sent successfully!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Contact Info (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
            <InfoCard icon={<Mail className="h-6 w-6" />} label="Email" value="looptailor@gmail.com" />
            <InfoCard icon={<MapPin className="h-6 w-6" />} label="Address" value="Manzoor Colony Karachi Pakistan" multiLine />
            <InfoCard icon={<MessageSquare className="h-6 w-6" />} label="WhatsApp" value="03321379924" />
          </div>

          {/* Contact Form (Right Column) */}
          <Card className="lg:col-span-2">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <Input id="name" name="name" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                    <Input id="phone" name="phone" required placeholder="03001234567" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input id="subject" name="subject" required placeholder="How can we help?" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    required 
                    placeholder="Write your message here..."
                    className="w-full min-h-[150px] rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button type="submit" size="lg" fullWidth disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Business Hours */}
        <Card className="max-w-2xl mx-auto text-center bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <h3 className="font-semibold text-lg mb-2 text-primary">Business Hours</h3>
            <p className="text-muted-foreground">
              Monday - Saturday: 9:00 AM - 6:00 PM<br/>
              Sunday: Closed
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, multiLine }: { icon: React.ReactNode, label: string, value: string, multiLine?: boolean }) {
  return (
    <Card>
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
