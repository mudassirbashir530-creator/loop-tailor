import React from 'react';
import { Outlet } from 'react-router-dom';
import WebsiteHeader from '../components/website/WebsiteHeader';
import WebsiteFooter from '../components/website/WebsiteFooter';

import FloatingWhatsApp from '../components/FloatingWhatsApp';

export default function WebsiteLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <WebsiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <WebsiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
