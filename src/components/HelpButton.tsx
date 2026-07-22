import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { openWhatsApp } from '../lib/whatsapp';

const FAQs = [
  {
    question: "How to add a customer?",
    answer: "Go to the Customers tab from the menu, click 'Add Customer', and fill in their name, phone, and standard measurements."
  },
  {
    question: "How to create an order?",
    answer: "Use the + button or go to the Quick Order screen. Select a customer (or create a new one), choose the dress type, delivery date, and save."
  },
  {
    question: "How to share invoice?",
    answer: "Open an order details page and click 'View Invoice'. From there, click the 'Share via WhatsApp' or 'Print' button."
  },
  {
    question: "How to add staff?",
    answer: "Go to the Staff section in the menu. Click 'Add Staff', fill in their details like name, role, and salary per month or per order."
  },
  {
    question: "How to send payment reminders?",
    answer: "Navigate to the Reminders tab. From there, you can view unpaid balances and click 'Send WhatsApp Reminder' to notify them instantly."
  }
];

export default function HelpButton() {
  const { user } = useAuth();
  const { settings } = useShop();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Hidden on login and registration pages
  if (!user || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  const handleWhatsapp = () => {
    const shopPhone = "03321379924";
    openWhatsApp(shopPhone, "Hi! I need some help with Loop Tailor.");
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden shadow-neu-pressed border border-gray-100 flex flex-col mb-2 origin-bottom-right"
          >
            <div className="bg-brand-primary p-4 text-white flex justify-between items-center">
              <h3 className="font-black text-lg">Need Help?</h3>
              <button onClick={() => setIsOpen(false)} className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 max-h-[300px] overflow-y-auto">
              <div className="space-y-3 mb-4">
                {FAQs.map((faq, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-neu-sm overflow-hidden border border-gray-100/50">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full text-left p-3 flex justify-between items-center font-bold text-sm text-slate-800"
                    >
                      {faq.question}
                      {openFaq === idx ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 text-sm text-slate-600 font-medium">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleWhatsapp}
                className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black shadow-neu hover:shadow-neu-pressed transition-all flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-neu hover:shadow-neu-pressed transition-all transform hover:scale-105"
      >
        <HelpCircle className="h-8 w-8" />
      </button>
    </div>
  );
}
