import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Users, Ruler, Scissors, Calculator, CheckCircle2,
  FileText, MessageCircle, BarChart3, Cloud, LayoutDashboard,
  Store, Palette, Building, Briefcase, Shirt, Award,
  ArrowRight, Heart, Target, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AboutPage() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 -left-64 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide shadow-sm border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Built for Modern Tailors
            </span>
          </motion.div>
          
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 text-foreground">
            Empowering Tailors <br className="hidden md:block"/>
            Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Technology</span>
          </motion.h1>
          
          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Loop Tailor helps local and professional tailors manage customers, orders, measurements, invoices, and business operations more efficiently with a modern digital system.
          </motion.p>
          
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/signup">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-primary/20 hover:scale-105 transition-transform text-white font-semibold">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto backdrop-blur-sm border-muted-foreground/30 hover:bg-muted font-semibold">
                Contact Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why We Created Loop Tailor</h2>
            <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground space-y-6">
              <p>
                Many tailors still manage their work manually using diaries, notebooks, WhatsApp chats, and paper records. This creates confusion, missed orders, payment issues, and difficulty managing customers professionally.
              </p>
              <p>
                Loop Tailor was built to solve these problems by providing a complete digital tailoring management system that is simple, modern, and easy to use for every tailor.
              </p>
              <p>
                Whether someone owns a small tailoring shop or a professional tailoring business, Loop Tailor helps streamline daily operations and improve productivity.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our mission is to digitize the tailoring industry and help tailors work smarter, faster, and more professionally using modern technology.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border p-8 md:p-12 rounded-3xl shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-primary/20 to-transparent">
                <Eye className="w-32 h-32" />
              </div>
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-8">
                <Eye className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                To become the leading tailoring management platform that empowers tailors worldwide with simple and powerful business tools.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-24 bg-muted/30 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for the modern tailoring business.
            </p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <FeatureCard icon={Users} title="Customer Management" description="Keep all your client details, history, and preferences in one secure place." />
            <FeatureCard icon={LayoutDashboard} title="Order Tracking" description="Never miss a deadline. Track every order from placed to delivered." />
            <FeatureCard icon={Ruler} title="Measurements Management" description="Digital measurement profiles for every customer. No more lost diaries." />
            <FeatureCard icon={Scissors} title="Worker Assignment" description="Assign tasks to your tailors and track their progress efficiently." />
            <FeatureCard icon={FileText} title="Invoice Generation" description="Create professional, branded invoices in seconds." />
            <FeatureCard icon={MessageCircle} title="WhatsApp Integration" description="Keep customers informed with automatic order updates." />
            <FeatureCard icon={BarChart3} title="Business Analytics" description="Understand your revenue, popular styles, and shop performance." />
            <FeatureCard icon={Cloud} title="Cloud Image Uploads" description="Securely store reference images, receipts, and design sketches." />
          </motion.div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Is Loop Tailor For?</h2>
            <p className="text-lg text-muted-foreground">Built for every scale of the fashion industry.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <TargetAudienceCard icon={Store} title="Local Tailors" />
            <TargetAudienceCard icon={Palette} title="Professional Designers" />
            <TargetAudienceCard icon={Building} title="Boutique Owners" />
            <TargetAudienceCard icon={Shirt} title="Fashion Studios" />
            <TargetAudienceCard icon={Briefcase} title="Tailoring Teams" />
            <TargetAudienceCard icon={Award} title="Custom Clothing Businesses" />
          </div>
        </div>
      </section>

      {/* Why Choose Us (Stats) */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            <StatCard value="500+" label="Tailors Supported" />
            <StatCard value="10k+" label="Orders Managed" />
            <StatCard value="100%" label="Fast & Secure" />
            <StatCard value="Mobile" label="Friendly Design" />
            <StatCard value="24/7" label="Real-Time Data" />
          </div>
        </div>
      </section>

      {/* Team / Brand Section */}
      <section className="py-24 px-4 bg-muted/10">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Built with Passion</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Loop Tailor is built with the vision of simplifying tailoring business management and bringing modern digital solutions to the fashion and tailoring industry. We are dedicated to your success.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border shadow-2xl rounded-3xl p-12 md:p-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to Transform Your Tailoring Business?</h2>
            <p className="text-xl text-muted-foreground mb-10 relative z-10 max-w-2xl mx-auto">
              Join hundreds of tailors who are organizing their shops, saving time, and growing their business with Loop Tailor.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/auth/signup">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-lg hover:scale-105 transition-transform text-white font-semibold">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-background font-semibold">
                  Contact Support
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// Subcomponents

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="bg-card border border-border p-6 rounded-2xl hover:shadow-xl hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TargetAudienceCard({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-card border border-border rounded-2xl hover:bg-muted/50 transition-colors text-center group">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="font-semibold text-lg">{title}</h4>
    </div>
  );
}

function StatCard({ value, label }: { value: string, label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center justify-center p-4"
    >
      <div className="text-4xl md:text-5xl font-black mb-2">{value}</div>
      <div className="text-primary-foreground/80 font-medium text-sm md:text-base uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

