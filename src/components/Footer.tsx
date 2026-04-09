import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Facebook, Linkedin, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brand-primary p-2 rounded-xl">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">Loop Tailor</span>
            </div>
            <p className="text-slate-400 mb-4">Smart Tailor Management Software</p>
            <p className="text-sm text-slate-400">Email: looptailor@gmail.com</p>
            <p className="text-sm text-slate-500 mt-2">© {new Date().getFullYear()} Loop Tailor</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Product</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <a href="/#features" className="hover:text-white transition-colors">Features</a>
              <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">Company</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link to="/careers" className="hover:text-white transition-colors">Careers</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">Legal & Social</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
            <div className="flex gap-2 pt-1">
              <a href="https://www.facebook.com/profile.php?id=61575736701852" target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook profile" className="p-2 hover:text-white transition-colors"><Facebook className="h-6 w-6" /></a>
              <a href="https://www.linkedin.com/in/loop-tailor-1b50543ba/" target="_blank" rel="noopener noreferrer" aria-label="Visit our LinkedIn profile" className="p-2 hover:text-white transition-colors"><Linkedin className="h-6 w-6" /></a>
              <a href="https://www.instagram.com/looptailor/" target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram profile" className="p-2 hover:text-white transition-colors"><Instagram className="h-6 w-6" /></a>
              <a href="https://youtube.com/@looptailor?si=yWxjWbNEXox2WBTd" target="_blank" rel="noopener noreferrer" aria-label="Visit our YouTube channel" className="p-2 hover:text-white transition-colors"><Youtube className="h-6 w-6" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
