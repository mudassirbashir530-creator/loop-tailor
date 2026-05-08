import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="max-w-screen-xl mx-auto pb-24 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
