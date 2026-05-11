import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Database, UserCheck, Image as ImageIcon, MessageCircle, ExternalLink, Mail, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

const sections = [
  { id: 'data-collection', title: 'Data Collection', icon: Database },
  { id: 'password-security', title: 'Password Security', icon: Lock },
  { id: 'data-security', title: 'Data Security', icon: Shield },
  { id: 'user-ownership', title: 'User Data Ownership', icon: UserCheck },
  { id: 'cloudinary', title: 'Cloudinary Uploads', icon: ImageIcon },
  { id: 'whatsapp', title: 'WhatsApp Integration', icon: MessageCircle },
  { id: 'cookies', title: 'Cookies & Analytics', icon: ExternalLink },
  { id: 'third-party', title: 'Third-Party Services', icon: ExternalLink },
  { id: 'children', title: 'Children’s Privacy', icon: UserCheck },
  { id: 'updates', title: 'Policy Updates', icon: ExternalLink },
  { id: 'contact', title: 'Contact Information', icon: MapPin },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              At Loop Tailor, we are committed to protecting your privacy and ensuring the security of your data. This policy outlines how we collect, use, and safeguard your information.
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-8">
              Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 relative">
          
          {/* Table of Contents - Sticky Sidebar */}
          <div className="w-full md:w-64 shrink-0 hidden md:block">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-6 px-3">
                Contents
              </h3>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all",
                        activeSection === section.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-3xl prose prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-16"
            >
              
              <section id="data-collection" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">1. Data Collection</h2>
                <p>To provide you with the best possible service, Loop Tailor collects specific information necessary for the operation of your tailoring business tools.</p>
                <p>We clearly collect the following data:</p>
                <ul>
                  <li><strong>Personal Information:</strong> User name, email address, and phone number.</li>
                  <li><strong>Business Information:</strong> Shop details and configuration.</li>
                  <li><strong>Operational Data:</strong> Customer information, order data, measurements, and uploaded images.</li>
                  <li><strong>Technical Data:</strong> Device and browser information, along with usage analytics to improve our platform.</li>
                </ul>
              </section>

              <section id="password-security" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">2. Password Security</h2>
                <p>Your security is our top priority. We use robust authentication systems to ensure your credentials remain safe.</p>
                <ul>
                  <li>User passwords are encrypted and securely stored.</li>
                  <li>Passcode and passwords are never visible to the Loop Tailor team or any third party.</li>
                  <li>Authentication is protected using secure and industry-standard Firebase Authentication systems.</li>
                </ul>
              </section>

              <section id="data-security" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">3. Data Security</h2>
                <p>We employ enterprise-grade security measures to protect your data against unauthorized access, alteration, disclosure, or destruction.</p>
                <ul>
                  <li>Data is securely stored using Firebase and protected cloud systems.</li>
                  <li>We implement industry-standard security measures and architecture.</li>
                  <li>We offer unauthorized access protection on both database and application levels.</li>
                  <li>All communications between your device and our servers are encrypted via secure HTTPS connections.</li>
                </ul>
              </section>

              <section id="user-ownership" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">4. User Data Ownership</h2>
                <p>You remain the sole owner of your data. We act only as custodians of the information you entrust to our platform.</p>
                <ul>
                  <li>Users fully own their data. We claim no ownership over your customers, orders, or shop information.</li>
                  <li>Users can update, modify, or delete their information at any time within the application.</li>
                  <li><strong>Your data is never sold to third parties under any circumstances.</strong></li>
                </ul>
              </section>

              <section id="cloudinary" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">5. Cloudinary Uploads</h2>
                <p>When you upload images, such as customer references, shop logos, or profile pictures, they are handled with care.</p>
                <ul>
                  <li>Uploaded images and designs may be stored securely using Cloudinary CDN services to ensure fast delivery and reliable hosting.</li>
                </ul>
              </section>

              <section id="whatsapp" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">6. WhatsApp Integration</h2>
                <p>We provide capabilities to share invoices and updates easily via WhatsApp.</p>
                <ul>
                  <li>All WhatsApp features are strictly user-initiated. We do not send automated messages on your behalf without your explicit trigger.</li>
                  <li>Loop Tailor does not, and cannot, access your private WhatsApp chats or read your messages.</li>
                </ul>
              </section>

              <section id="cookies" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">7. Cookies & Analytics</h2>
                <p>To ensure a smooth and personalized experience on our platform, we utilize standard web technologies.</p>
                <ul>
                  <li>Our website may use cookies and analytics tools to improve platform performance, analyze usage patterns, and enhance user experience.</li>
                </ul>
              </section>

              <section id="third-party" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">8. Third-Party Services</h2>
                <p>We integrate with reliable third-party providers to deliver our services. These include:</p>
                <ul>
                  <li><strong>Firebase:</strong> For secure database hosting and authentication.</li>
                  <li><strong>Cloudinary:</strong> For secure image storage and delivery.</li>
                  <li><strong>WhatsApp:</strong> For external communication and invoice sharing.</li>
                  <li><strong>Payment Systems:</strong> (Future support) For securing subscription and invoice payments.</li>
                </ul>
              </section>

              <section id="children" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">9. Children's Privacy</h2>
                <p>Our platform is designed for professionals and businesses.</p>
                <ul>
                  <li>Our service is not intended for children under 13 years of age, and we do not knowingly collect information from children.</li>
                </ul>
              </section>

              <section id="updates" className="scroll-mt-24">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">10. Policy Updates</h2>
                <p>As our services evolve, so might our privacy practices.</p>
                <ul>
                  <li>Loop Tailor may update this Privacy Policy at any time.</li>
                  <li>Users will be notified of any important changes via email or an in-app announcement.</li>
                </ul>
              </section>

              <section id="contact" className="scroll-mt-24 bg-muted p-8 rounded-2xl">
                <h2 className="text-2xl mt-0 border-b border-border pb-4 mb-6">11. Contact Information</h2>
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please get in touch with us:</p>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Us</p>
                      <a href="mailto:looptailor@gmail.com" className="text-base font-semibold text-foreground hover:text-primary transition-colors">looptailor@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-base font-semibold text-foreground">Manzoor Colony, Karachi, Pakistan</p>
                    </div>
                  </div>
                </div>
              </section>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
