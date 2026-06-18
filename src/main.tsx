import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);

// Global Error Handlers previously here are now in index.html for earlier capture

// Add this to your main JS file (from user prompt)
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('visible');
    });
  }
});
