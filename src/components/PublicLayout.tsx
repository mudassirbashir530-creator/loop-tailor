import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 w-full pt-20">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
