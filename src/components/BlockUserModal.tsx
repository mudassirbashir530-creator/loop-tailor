import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => void;
  userName: string;
}

export default function BlockUserModal({ isOpen, onClose, onConfirm, userName }: BlockUserModalProps) {
  const [reason, setReason] = useState('Suspicious Activity');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason, note);
    setReason('Suspicious Activity');
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-destructive/20 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-lg">Block User Account</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
              Are you sure you want to block <strong className="text-foreground">{userName}</strong>? This will immediately terminate their sessions and restrict them from accessing their shop.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Block Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-foreground bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-destructive focus:border-transparent transition-all outline-none"
                >
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Payment Fraud">Payment Fraud</option>
                  <option value="Fake Account">Fake Account</option>
                  <option value="Terms Violation">Terms Violation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Optional Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Provide any additional details or context..."
                  rows={3}
                  className="w-full text-foreground bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-destructive focus:border-transparent transition-all outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="flex-1 rounded-xl bg-red-650 hover:bg-red-700 text-white"
                >
                  Confirm Block
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
