import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

export default function PricingPage() {
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
            Start with a 30-day free trial. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          
          {/* Basic Plan */}
          <PricingCard 
            title="Basic"
            price="500"
            badge="Start Here"
            badgeColor="bg-accent"
            features={[
              "Customer Management (CMS)",
              "Worker Assign",
              "Order Tracking",
              "Basic Dashboard",
              "Measurement Profiles",
              "Up to 10 Customers",
              "Order Status Updates",
              "Basic Reports",
            ]}
          />

          {/* Standard Plan */}
          <PricingCard 
            title="Standard"
            price="1,000"
            badge="Most Popular"
            badgeColor="bg-primary"
            isPopular
            features={[
              "Everything in Basic",
              "Unlimited Customers",
              "WhatsApp Integration",
              "WhatsApp Order Notifications",
              "WhatsApp Payment Reminders",
              "Advanced Analytics",
              "Multiple Workers",
              "Priority Support",
            ]}
          />

          {/* Premium Plan */}
          <PricingCard 
            title="Premium"
            price="2,000"
            badge="Best Value"
            badgeColor="bg-accent"
            extraTag="Save more vs hiring staff"
            features={[
              "Everything in Standard",
              "Digital Invoice Generation",
              "Image Upload per Order",
              "Customer Design Gallery",
              "Invoice via WhatsApp",
              "Custom Invoice Templates",
              "Dedicated Account Manager",
              "Phone Support",
            ]}
          />
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-2xl font-bold text-center mb-8">Pricing FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-sm text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time from your account settings.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-muted-foreground">We accept all major credit cards, EasyPaisa, and JazzCash for your convenience.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-sm text-muted-foreground">No hidden fees or setup costs. You only pay the flat monthly rate specified.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What happens after the free trial?</h3>
                <p className="text-sm text-muted-foreground">You will be prompted to choose a plan and enter your billing details to continue using the service.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-card p-12 rounded-3xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8">Our team is ready to help you choose the right plan for your shop.</p>
          <Link to="/contact">
            <Button size="lg" className="text-white font-semibold">Contact Sales</Button>
          </Link>
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
  features, 
  isPopular = false,
  extraTag
}: { 
  title: string, 
  price: string, 
  badge: string, 
  badgeColor: string, 
  features: string[], 
  isPopular?: boolean,
  extraTag?: string
}) {
  return (
    <Card className={cn("relative flex flex-col h-full", isPopular ? "border-primary shadow-xl scale-105 z-10" : "")}>
      <div className={cn("absolute -top-4 left-1/2 -translate-x-1/2 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", badgeColor)}>
        {badge}
      </div>
      <CardHeader className="text-center pt-10 pb-6 border-b">
        <CardTitle className="text-xl mb-2 text-muted-foreground font-normal">{title}</CardTitle>
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className="text-3xl font-bold text-foreground">PKR</span>
          <span className="text-5xl font-extrabold tracking-tighter text-foreground">{price}</span>
        </div>
        <CardDescription className="text-base">per month</CardDescription>
        {extraTag && (
          <p className="text-accent text-sm font-medium mt-2">{extraTag}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-6">
        <ul className="space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-accent shrink-0" />
              <span className="text-sm text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-6">
        <Link to="/auth/signup" className="w-full">
          <Button fullWidth variant={isPopular ? "default" : "outline"} size="lg" className={isPopular ? "text-white font-semibold" : "font-semibold"}>
            Start Free Trial
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
