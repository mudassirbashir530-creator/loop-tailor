import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, Navigate } from 'react-router-dom';
import Hero from '../components/Hero';
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
  X,
  UserPlus,
  Activity,
  FileCheck,
  ListTodo,
  Plus
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
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
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
            </Link>
            
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
      <Hero />


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
      <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-3xl"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-400/5 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">The Workflow</h2>
              <h3 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 mb-6">From first measurement <br className="hidden md:block" /> to final delivery.</h3>
              <p className="text-lg text-slate-500 mb-10">We've simplified the entire tailoring process into four easy steps, so you can focus on what you do best: crafting beautiful clothes.</p>
              
              <div className="space-y-4">
                {[
                  { icon: UserPlus, title: "Create Profile", desc: "Add a new customer and save their measurements once. They're stored forever securely." },
                  { icon: Scissors, title: "Take Order", desc: "Select dress type, set delivery date, and upload reference photos for the design." },
                  { icon: Activity, title: "Track Progress", desc: "Update status as you stitch. The dashboard shows you exactly what's due today." },
                  { icon: FileCheck, title: "Deliver & Invoice", desc: "Mark as delivered and generate a professional invoice instantly. Get paid faster." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 hover:border-brand-primary/30 hover:shadow-md transition-all group cursor-default">
                    <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-colors text-brand-primary">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 0{idx + 1}</span>
                        <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative lg:h-[650px] flex items-center justify-center mt-10 lg:mt-0"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 to-emerald-400/20 rounded-[3rem] transform rotate-3 scale-105 blur-2xl opacity-60"></div>
              
              {/* Phone Mockup */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[360px] aspect-[9/19] bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 flex flex-col z-10"
              >
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                  <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
                </div>

                {/* Mock App Header */}
                <div className="px-6 pt-10 pb-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 backdrop-blur z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                      <Scissors className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-bold text-white tracking-wide">Loop Tailor</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                
                {/* Mock App Content */}
                <div className="p-5 flex-1 space-y-6 overflow-hidden relative">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Orders</div>
                      <div className="text-2xl font-black text-white">24</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Today</div>
                      <div className="text-2xl font-black text-brand-primary">5</div>
                    </div>
                  </div>
                  
                  {/* Recent Orders List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Orders</div>
                      <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">View All</div>
                    </div>
                    {[
                      { name: "Ahmed Khan", item: "Shalwar Kameez", status: "Cutting", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                      { name: "Ali Raza", item: "Kurta Pajama", status: "Stitching", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                      { name: "Usman Tariq", item: "Waistcoat", status: "Ready", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                      { name: "Zain Ali", item: "Shalwar Kameez", status: "Pending", color: "bg-slate-800 text-slate-400 border-slate-700" },
                    ].map((order, i) => (
                      <div key={i} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                            {order.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{order.name}</div>
                            <div className="text-xs text-slate-500">{order.item}</div>
                          </div>
                        </div>
                        <div className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${order.color}`}>
                          {order.status}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Gradient Fade at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>
                </div>

                {/* Mock Bottom Nav */}
                <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 pb-2 z-20">
                  <div className="flex flex-col items-center gap-1 text-brand-primary">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Home</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Users className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Clients</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white -mt-6 shadow-lg shadow-brand-primary/30 border-4 border-slate-950">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Scissors className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Orders</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <FileText className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Invoices</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Accents */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -right-4 lg:-right-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 max-w-[220px]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notification</div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">Order Delivered</div>
                    <div className="text-xs text-emerald-600 font-bold mt-0.5">+ PKR 4,500</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 -left-4 lg:-left-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 max-w-[220px]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-brand-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <ListTodo className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task Due</div>
                    <div className="text-sm font-bold text-slate-900 leading-tight">Measure Ali Raza</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Today, 4:00 PM</div>
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
                  <div className="bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wide px-3 py-1 rounded-full">
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
                <li><a href="#features" className="hover:text-brand-primary">Features</a></li>
                <li><a href="#pricing" className="hover:text-brand-primary">Pricing</a></li>
                <li><Link to="/mobile-app" className="hover:text-brand-primary">Mobile App</Link></li>
                <li><Link to="/updates" className="hover:text-brand-primary">Updates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><Link to="/about" className="hover:text-brand-primary">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-brand-primary">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-brand-primary">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-brand-primary">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><Link to="/privacy" className="hover:text-brand-primary">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-brand-primary">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-brand-primary">Cookie Policy</Link></li>
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
