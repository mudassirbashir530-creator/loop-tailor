import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Globe } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [step, setStep] = useState<'selection' | 'video'>('selection');
  const [videoUrl, setVideoUrl] = useState('');

  const handleClose = () => {
    onClose();
    // Reset state after animation completes
    setTimeout(() => {
      setStep('selection');
      setVideoUrl('');
    }, 300);
  };

  const playVideo = (lang: 'urdu' | 'english') => {
    const url = lang === 'urdu'
      ? 'https://www.youtube.com/embed/JC-RLn_TAaQ?autoplay=1'
      : 'https://www.youtube.com/embed/PZwl9VoyjIk?autoplay=1';
    setVideoUrl(url);
    setStep('video');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'selection' ? (
              <div className="p-8 sm:p-10">
                <div className="text-center mb-8 mt-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Choose Your Demo Language</h3>
                  <p className="text-slate-600">Select your preferred language to watch the LoopTailor demo.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Urdu Card */}
                  <div 
                    onClick={() => playVideo('urdu')}
                    className="group relative bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-brand-primary/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer text-center shadow-sm hover:shadow-md flex flex-col h-full"
                  >
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 relative">
                      <img 
                        src="https://img.youtube.com/vi/JC-RLn_TAaQ/hqdefault.jpg" 
                        alt="Urdu Demo Thumbnail" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-5 h-5 text-brand-primary ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow flex flex-col justify-end">
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Urdu Demo</h4>
                      <p className="text-sm text-slate-500 mb-4 font-medium" dir="rtl">مکمل اردو میں سافٹویئر ڈیمو دیکھیں</p>
                      <button className="w-full py-2.5 px-4 bg-white border border-slate-200 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white rounded-xl font-bold transition-colors mt-auto">
                        Watch in Urdu
                      </button>
                    </div>
                  </div>

                  {/* English Card */}
                  <div 
                    onClick={() => playVideo('english')}
                    className="group relative bg-white hover:bg-slate-50 border-2 border-slate-100 hover:border-brand-primary/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer text-center shadow-sm hover:shadow-md flex flex-col h-full"
                  >
                    <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 relative">
                      <img 
                        src="https://img.youtube.com/vi/PZwl9VoyjIk/hqdefault.jpg" 
                        alt="English Demo Thumbnail" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          <Play className="w-5 h-5 text-brand-primary ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow flex flex-col justify-end">
                      <h4 className="text-lg font-bold text-slate-900 mb-1">English Demo</h4>
                      <p className="text-sm text-slate-500 mb-4 font-medium">Watch full software demo in English</p>
                      <button className="w-full py-2.5 px-4 bg-white border border-slate-200 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white rounded-xl font-bold transition-colors mt-auto">
                        Watch in English
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full bg-slate-900 relative">
                <iframe
                  src={videoUrl}
                  title="LoopTailor Demo"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
