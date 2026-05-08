import React from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Facebook, Youtube, Instagram, Linkedin } from 'lucide-react';

export default function WebsiteFooter() {
  return (
    <footer className="bg-card border-t py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <Scissors className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-primary">Loop Tailor</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              The complete digital management system designed specifically for tailors in Pakistan.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="https://www.facebook.com/profile.php?id=61575736701852" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110"><Facebook className="h-5 w-5" /></a>
              <a href="https://www.instagram.com/looptailor/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.linkedin.com/in/loop-tailor-1b50543ba/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110"><Linkedin className="h-5 w-5" /></a>
              <a href="https://www.youtube.com/@LoopTailor" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors transform hover:scale-110"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/partners" className="text-sm text-muted-foreground hover:text-primary transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Loop Tailor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
