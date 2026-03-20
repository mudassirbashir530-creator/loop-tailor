import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { 
  Scissors, 
  CheckCircle, 
  Clock, 
  Users, 
  Smartphone, 
  Shield, 
  Zap, 
  ChevronRight, 
  Star,
  LayoutDashboard,
  FileText,
  Camera,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

export default function Landing() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-slate-900 overflow-x-hidden selection:bg-brand-primary/10 selection:text-brand-primary">

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2 group cursor-pointer">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="bg-brand-primary p-2 rounded-xl"
              >
                <Scissors className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-emerald-800">
                Loop Tailor
              </span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-primary transition-colors">Pricing</a>
              <Link to="/login">
                <Button variant="ghost" className="text-sm font-semibold">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full px-6">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-600">Features</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-600">How it Works</a>
                <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-slate-600">Pricing</a>
                <div className="pt-4 flex flex-col gap-3">
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button className="w-full bg-brand-primary text-white">Get Started</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-sm font-semibold text-brand-primary mb-8">
              <Star className="h-4 w-4 fill-brand-primary" />
              <span>Trusted by 500+ Tailors in Pakistan</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight text-slate-900 mb-6 sm:mb-8 leading-[0.95]">
              Digitize Your <br />
              <span className="text-brand-primary italic">Tailoring Craft.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              The all-in-one management platform for modern tailors. From measurement tracking to automated invoices, we handle the business so you can focus on the stitch.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 shadow-2xl shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg h-14 sm:h-16 px-8 sm:px-10 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all">
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={itemVariants} className="mt-20 pt-10 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Seamlessly Integrated With</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
                <div className="text-2xl font-black italic">Google Cloud</div>
                <div className="text-2xl font-black italic">Firebase</div>
                <div className="text-2xl font-black italic">Stripe</div>
                <div className="text-2xl font-black italic">WhatsApp</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-[#FDFCF9] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/5 border border-brand-primary/10 mb-6"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Core Capabilities</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-black tracking-tight text-slate-900 mb-6"
            >
              Everything you need to <br className="hidden md:block" /> <span className="text-brand-primary">scale</span> your shop.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
            >
              Designed by tailors, for tailors. We've built the most intuitive 
              platform to manage your craftsmanship and customer relationships.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="h-6 w-6" />,
                title: "Smart Customer CRM",
                desc: "Store unlimited customer profiles with detailed measurement history, style preferences, and contact info.",
                color: "from-blue-500 to-indigo-600",
                lightColor: "bg-blue-50"
              },
              {
                icon: <LayoutDashboard className="h-6 w-6" />,
                title: "Live Order Tracking",
                desc: "Real-time status updates from 'Pending' to 'Delivered'. Automatic delivery date reminders keep you on schedule.",
                color: "from-emerald-500 to-teal-600",
                lightColor: "bg-emerald-50"
              },
              {
                icon: <FileText className="h-6 w-6" />,
                title: "Digital Invoices",
                desc: "Generate professional PDF invoices with one click. Send them directly to customers via WhatsApp or Email.",
                color: "from-amber-500 to-orange-600",
                lightColor: "bg-amber-50"
              },
              {
                icon: <Camera className="h-6 w-6" />,
                title: "Visual References",
                desc: "Attach reference photos and sample designs to every order. Never mix up a customer's vision again.",
                color: "from-purple-500 to-violet-600",
                lightColor: "bg-purple-50"
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Secure Cloud Storage",
                desc: "Your data is encrypted and backed up daily. Access your shop records from any device, anywhere in the world.",
                color: "from-rose-500 to-pink-600",
                lightColor: "bg-rose-50"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Instant Analytics",
                desc: "Track your revenue, pending payments, and order volume with a beautiful, real-time dashboard.",
                color: "from-indigo-500 to-blue-600",
                lightColor: "bg-indigo-50"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500"
              >
                {/* Decorative corner element */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] rounded-bl-[5rem] transition-opacity duration-500`} />
                
                <div className={`h-16 w-16 rounded-[1.5rem] bg-gradient-to-br ${feature.color} p-[1px] mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-slate-200`}>
                  <div className="w-full h-full bg-white rounded-[1.4rem] flex items-center justify-center text-slate-900 group-hover:bg-transparent group-hover:text-white transition-colors duration-500">
                    {feature.icon}
                  </div>
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-brand-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="text-slate-500 leading-relaxed font-medium mb-6">
                  {feature.desc}
                </p>
                
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-primary transition-colors">
                  <span>Explore Feature</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-brand-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">The Workflow</h2>
              <h3 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8">From first measurement <br /> to final delivery.</h3>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Create Profile", desc: "Add a new customer and save their measurements once. They're stored forever." },
                  { step: "02", title: "Take Order", desc: "Select dress type, set delivery date, and upload reference photos for the design." },
                  { step: "03", title: "Track Progress", desc: "Update status as you stitch. The dashboard shows you exactly what's due today." },
                  { step: "04", title: "Deliver & Invoice", desc: "Mark as delivered and generate a professional invoice instantly. Get paid faster." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="text-3xl font-black text-brand-primary/20">{item.step}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] bg-brand-primary/10 flex items-center justify-center p-8">
                <div className="w-full h-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
                  {/* Mock Dashboard UI */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loop Tailor Dashboard</div>
                  </div>
                  <div className="p-6 flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-slate-50 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Active Orders</div>
                        <div className="text-2xl font-black text-brand-primary">24</div>
                      </div>
                      <div className="h-20 bg-slate-50 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Revenue</div>
                        <div className="text-2xl font-black text-emerald-600">PKR 85k</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20"></div>
                          <div className="w-24 h-2 bg-slate-200 rounded"></div>
                        </div>
                        <div className="w-12 h-4 bg-emerald-100 rounded-full"></div>
                      </div>
                      <div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20"></div>
                          <div className="w-32 h-2 bg-slate-200 rounded"></div>
                        </div>
                        <div className="w-12 h-4 bg-amber-100 rounded-full"></div>
                      </div>
                      <div className="h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/20"></div>
                          <div className="w-20 h-2 bg-slate-200 rounded"></div>
                        </div>
                        <div className="w-12 h-4 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Accents */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Order Ready</div>
                    <div className="text-sm font-bold">Ahmed Khan</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Simple Pricing</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Grow your business <br /> without the overhead.</h3>
          </div>

          <div className="max-w-lg mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-brand-primary to-emerald-800 shadow-2xl"
            >
              <div className="bg-white rounded-[2.2rem] p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-2xl font-bold mb-1">Professional Plan</h4>
                    <p className="text-slate-500">Everything you need to manage one shop.</p>
                  </div>
                  <div className="bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-5xl font-black">PKR 0</span>
                  <span className="text-slate-400 font-medium">/ month</span>
                  <span className="ml-2 text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Free Beta</span>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Unlimited Customer Profiles",
                    "Unlimited Orders & Tracking",
                    "Digital PDF Invoices",
                    "Image Uploads (Reference Photos)",
                    "Real-time Dashboard Analytics",
                    "Mobile & Desktop Access",
                    "24/7 Cloud Support"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-slate-600 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup">
                  <Button size="lg" className="w-full h-16 rounded-2xl bg-brand-primary hover:bg-brand-primary/90 text-lg font-bold shadow-xl shadow-brand-primary/20">
                    Get Started Now
                  </Button>
                </Link>
                <p className="text-center text-xs text-slate-400 mt-6 font-medium">No credit card required. Cancel anytime.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-brand-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-display font-black mb-8 leading-tight">Ready to transform your <br /> tailoring business?</h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">Join hundreds of tailors who have already switched to digital management. It's time to stitch smarter.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-white text-brand-primary hover:bg-slate-50 text-lg font-bold shadow-2xl">
                    Join Loop Tailor Today
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-white hover:bg-white/10 text-lg font-bold">
                  Contact Sales
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-brand-primary p-2 rounded-xl">
                  <Scissors className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Loop Tailor</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                The modern operating system for the tailoring industry. Built with love for craftsmen who value precision.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-brand-primary">Features</a></li>
                <li><a href="#" className="hover:text-brand-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-primary">Mobile App</a></li>
                <li><a href="#" className="hover:text-brand-primary">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-brand-primary">About Us</a></li>
                <li><a href="#" className="hover:text-brand-primary">Careers</a></li>
                <li><a href="#" className="hover:text-brand-primary">Contact</a></li>
                <li><a href="#" className="hover:text-brand-primary">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-brand-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-primary">Terms of Service</a></li>
                <li><a href="#" className="hover:text-brand-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 gap-6">
            <p className="text-sm text-slate-400 font-medium">© 2026 Loop Tailor. All rights reserved.</p>
            <div className="flex gap-6">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-primary cursor-pointer transition-colors">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-primary cursor-pointer transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-primary cursor-pointer transition-colors">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
