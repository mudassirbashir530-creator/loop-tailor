import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import PublicLayout from '../components/PublicLayout';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-6"
        >
          <h1 className="text-8xl font-display font-black text-slate-200">404</h1>
          <h2 className="text-3xl font-bold text-slate-900">Page not found</h2>
          <p className="text-slate-500 text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <div className="pt-4">
            <Button asChild className="rounded-2xl h-14 px-8 bg-brand-primary hover:bg-brand-primary/90 font-bold text-base shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
