import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingWhatsApp({ phoneNumber = "923321379924" }: { phoneNumber?: string }) {
  return (
    <motion.a
      href={`https://wa.me/${phoneNumber}?text=Hi,%20I%20need%20help%20with%20Loop%20Tailor`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-xl hover:bg-green-600 hover:scale-110 transition-all duration-300"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      title="Contact Support"
    >
      <MessageCircle className="h-7 w-7" />
    </motion.a>
  );
}
