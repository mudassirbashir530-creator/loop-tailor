import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

export default function InstallButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <Button onClick={handleInstall} className={`bg-brand-primary text-white ${className}`}>
      <Download className="mr-2 h-4 w-4" />
      Install Loop Tailor App
    </Button>
  );
}
