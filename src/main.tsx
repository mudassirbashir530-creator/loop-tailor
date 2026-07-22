import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);

// Global Error Handlers previously here are now in index.html for earlier capture

// Delegated event listener for sidebar toggling in SPA environment
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  const hamburger = target.closest('.hamburger-btn');
  const overlay = target.closest('.sidebar-overlay');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');

  if (hamburger) {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('visible');
  } else if (overlay) {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('visible');
  }
});
