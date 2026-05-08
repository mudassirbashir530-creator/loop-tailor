import React from 'react';
import { Target, Heart, Users, Zap } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">About Loop Tailor</h1>
          <p className="text-xl text-muted-foreground">We're on a mission to digitize the tailoring industry.</p>
        </div>

        {/* Story */}
        <Card className="mb-24 p-8 md:p-12 bg-white">
          <div className="max-w-3xl mx-auto space-y-6 text-lg text-foreground/80 leading-relaxed">
            <p>
              Loop Tailor was born out of a simple observation: tailors run incredible businesses, but they rely on outdated tools. Dairies get lost, measurements get mixed up, and managing customer updates over WhatsApp becomes chaotic as the business grows.
            </p>
            <p>
              We realized that while other industries were moving forward with technology, local tailors were left behind. We set out to change that.
            </p>
            <p>
              Today, we serve over 500+ tailors across Pakistan. Our platform replaces the physical diary with a secure, always-accessible digital system that handles everything from measurements to automated WhatsApp notifications.
            </p>
          </div>
        </Card>

        {/* Values */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ValueCard 
              icon={<Target className="h-6 w-6" />}
              title="Our Mission"
              description="To empower tailors with digital tools that help them save time, increase revenue, and grow their shop."
            />
            <ValueCard 
              icon={<Heart className="h-6 w-6" />}
              title="Customer First"
              description="We build features based on real feedback from tailors. If it doesn't solve a real problem, we don't build it."
            />
            <ValueCard 
              icon={<Users className="h-6 w-6" />}
              title="Community Driven"
              description="Building a community of tailors who can share knowledge, trends, and grow together."
            />
            <ValueCard 
              icon={<Zap className="h-6 w-6" />}
              title="Innovation"
              description="Continuously bringing the latest technology, like AI and automation, to local tailoring businesses."
            />
          </div>
        </div>

        {/* Team */}
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Built by Tailors, for Tailors</h2>
          <p className="text-lg text-muted-foreground">
            Our founding team includes experienced tailors who understand the daily struggles of managing a shop, combined with expert engineers who know how to build reliable, simple software.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-primary text-white p-12 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold mb-6">Join Our Growing Community</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Experience the difference a dedicated tailoring management system can make for your business.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">Get Started for Free</Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="h-full">
      <CardContent className="pt-8 flex flex-col items-center text-center">
        <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
