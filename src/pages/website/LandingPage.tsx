import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sparkles, Package, Users, MessageSquare, FileText, BarChart3, Scissors, CheckCircle, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen" />; // Wait for auth state
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 pt-24 pb-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            Trusted by 500+ tailors in Pakistan
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground max-w-4xl mx-auto">
            Manage Your <span className="text-primary">Tailoring Business</span> Digitally
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Say goodbye to diaries and WhatsApp chaos. Streamline your orders, measurements, and customer communication in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto text-white">Start Free Trial</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">View Pricing</Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-accent" /> 30-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-accent" /> No credit card required</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your shop</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our platform provides all the tools you need to organize your tailoring business and delight your customers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Package className="h-6 w-6" />}
              title="Order Management"
              description="Create, track, and manage all your tailoring orders from start to finish."
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6" />}
              title="Customer Database"
              description="Store customer information, measurements, and order history securely."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6" />}
              title="WhatsApp Integration"
              description="Auto-send order updates, receipts, and delivery reminders to customers."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6" />}
              title="Digital Invoices"
              description="Generate professional digital invoices instantly for any order."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6" />}
              title="Business Analytics"
              description="Track revenue, pending orders, and performance across your shop."
            />
            <FeatureCard 
              icon={<Scissors className="h-6 w-6" />}
              title="Worker Assignment"
              description="Assign specific orders to your team members and track their progress."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-muted-foreground">Start managing your shop efficiently in four simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard number="01" title="Sign Up" description="Create your free account in under 2 minutes." />
            <StepCard number="02" title="Add Customers" description="Import or add your customers and their measurements." />
            <StepCard number="03" title="Create Orders" description="Start managing orders with automated workflows." />
            <StepCard number="04" title="Grow Business" description="Track analytics and scale your tailoring shop." />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Loved by Tailors</h2>
            <p className="text-muted-foreground">See what our customers are saying about Loop Tailor.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Loop Tailor transformed my business! I can now manage 50+ orders without any confusion."
              name="Ahmed Tailor"
              location="Lahore"
              initials="AT"
            />
            <TestimonialCard 
              quote="The best investment for my tailoring shop. The WhatsApp reminders are a game changer."
              name="Fatima Master"
              location="Karachi"
              initials="FM"
            />
            <TestimonialCard 
              quote="Finally, a system designed for tailors! It completely removed the need for my old dairies."
              name="Hassan Khan"
              location="Islamabad"
              initials="HK"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FaqCard question="How does the free trial work?" answer="You get full access to all features for 30 days. No credit card required. You can upgrade to a paid plan anytime." />
            <FaqCard question="Can I use this on my mobile phone?" answer="Yes! Loop Tailor works perfectly on both web and mobile browsers as a fully responsive app." />
            <FaqCard question="Is my data secure?" answer="Absolutely. We use bank-level encryption to ensure all your customer data and measurements remain private and secure." />
            <FaqCard question="Do I need technical knowledge?" answer="Not at all. The interface is designed to be simple and intuitive for anyone who can use WhatsApp." />
            <FaqCard question="Can I export my data?" answer="Yes, you can export all your customer lists and order history at any time in CSV format." />
            <FaqCard question="Is WhatsApp integration included?" answer="WhatsApp integration is included in the Standard and Premium plans automatically." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to Transform Your Tailoring Business?</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-2xl mx-auto text-lg">
            Join hundreds of other tailors who have upgraded to a digital, professional, and chaotic-free workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">Start Free Trial</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" style={{ backgroundColor: '#0d0702' }}>Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-6 shadow-lg shadow-primary/20">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, name, location, initials }: { quote: string, name: string, location: string, initials: string }) {
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="pt-6 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-5 w-5 fill-accent text-accent" />
          ))}
        </div>
        <p className="text-foreground/80 italic mb-6 flex-1">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">{location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FaqCard({ question, answer }: { question: string, answer: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-2">{question}</h3>
        <p className="text-muted-foreground text-sm">{answer}</p>
      </CardContent>
    </Card>
  )
}
