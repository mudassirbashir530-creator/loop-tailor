import React from 'react';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { openWhatsApp } from '../../lib/whatsapp';

export default function PricingPage() {
  const handleWhatsAppCTA = (planName: string) => {
    const text = `Hi, I am interested in getting started with Loop Tailor's ${planName} plan! Please help me set up my account.`;
    openWhatsApp('03321379924', text);
  };

  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get the leading tailoring software built to streamline your operations and grow your boutique.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24 items-stretch">
          
          {/* Basic Plan */}
          <PricingCard 
            title="Basic"
            price="500"
            badge="Ideal start"
            badgeColor="bg-slate-500"
            includedFeatures={[
              "50 Customers limit",
              "60 Orders/month limit",
              "3 Workers limit",
              "Basic Tailor Invoice",
              "Standard Support",
            ]}
            excludedFeatures={[
              "Professional Invoice & PDF Download",
              "WhatsApp Integration & Alerts",
              "Image Upload & Photo Attachment",
              "Worker Payroll System",
              "Advanced Shop Analytics",
            ]}
            onCTA={() => handleWhatsAppCTA('Basic')}
          />

          {/* Standard Plan */}
          <PricingCard 
            title="Standard"
            price="1,000"
            badge="Most Popular"
            badgeColor="bg-primary"
            isPopular
            includedFeatures={[
              "200 Customers limit",
              "200 Orders/month limit",
              "7 Workers limit",
              "Professional Invoice + PDF Download",
              "WhatsApp Integration & Instant Alerts",
              "Priority Customer Support",
            ]}
            excludedFeatures={[
              "Image Upload & Photo Attachment",
              "Worker Payroll System",
              "Advanced Shop Analytics",
            ]}
            onCTA={() => handleWhatsAppCTA('Standard')}
          />

          {/* Premium Plan */}
          <PricingCard 
            title="Premium"
            price="2,000"
            badge="Best Value"
            badgeColor="bg-emerald-650"
            includedFeatures={[
              "Unlimited Everything",
              "Image Upload & Photo Attachment",
              "Worker Payroll System",
              "Advanced Shop Analytics",
              "Custom Invoice & Brand Styling",
              "WhatsApp Priority Support",
            ]}
            onCTA={() => handleWhatsAppCTA('Premium')}
          />
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-2xl font-bold text-center mb-8">Pricing FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-sm text-muted-foreground">Yes! You can upgrade or switch plans seamlessly by contacting our WhatsApp helpdesk.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-muted-foreground">We support convenient payments via EasyPaisa, JazzCash, bank transfers, and standard credit options.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-sm text-muted-foreground">None at all. Pricing is flat, with all features matching your chosen plan cleanly.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">How fast is my plan activated?</h3>
                <p className="text-sm text-muted-foreground">Subscription renewals or upgrades processed on WhatsApp are activated instantly for your boutique profile.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-card p-12 rounded-3xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8">Our support team is ready to help you choose the right configuration for your business.</p>
          <Button size="lg" className="text-white font-semibold" onClick={() => handleWhatsAppCTA('Custom Query')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ 
  title, 
  price, 
  badge, 
  badgeColor, 
  includedFeatures, 
  excludedFeatures = [],
  isPopular = false,
  onCTA
}: { 
  title: string, 
  price: string, 
  badge: string, 
  badgeColor: string, 
  includedFeatures: string[], 
  excludedFeatures?: string[],
  isPopular?: boolean,
  onCTA: () => void
}) {
  return (
    <Card className={cn("relative flex flex-col h-full justify-between", isPopular ? "border-primary shadow-xl md:scale-105 z-10" : "")}>
      <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 text-white px-3/5 py-1 rounded-full text-xs font-black uppercase tracking-wider", badgeColor)}>
        {badge}
      </div>
      <div>
        <CardHeader className="text-center pt-10 pb-6 border-b">
          <CardTitle className="text-xl mb-2 text-muted-foreground font-normal">{title}</CardTitle>
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="text-2xl font-bold text-foreground">Rs.</span>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground">{price}</span>
          </div>
          <CardDescription className="text-base">per month</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ul className="space-y-3.5">
            {includedFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/80 font-medium">{feature}</span>
              </li>
            ))}
            {excludedFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 opacity-40">
                <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/40 font-medium line-through">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </div>
      <CardFooter className="pt-6">
        <Button 
          fullWidth 
          variant={isPopular ? "default" : "outline"} 
          size="lg" 
          className={cn("w-full font-bold", isPopular ? "text-white" : "")}
          onClick={onCTA}
        >
          Get Started → WhatsApp Us
        </Button>
      </CardFooter>
    </Card>
  )
}
