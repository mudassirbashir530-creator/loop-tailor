import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Grid, Scissors } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface DesignModalProps {
  partName: string;
  options: { id: string; label: string; icon?: any }[];
  selectedOption: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function DesignModal({ partName, options, selectedOption, onSelect, onClose, onSave }: DesignModalProps) {
  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4 bg-white border-b border-[#F8FAFC]">
        <button onClick={onClose} type="button" className="p-2">
          <ArrowLeft className="h-6 w-6 text-[#0F172A]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#0F172A] flex-1 text-center pr-10">
          Customize {partName}
        </h1>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8 bg-[#F5F7FA]">
        <div className="grid grid-cols-2 gap-4">
          {options.map(option => {
            const isActive = selectedOption === option.id;
            const Icon = option.icon || Grid;
            
            return (
              <div 
                key={option.id}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "aspect-square rounded-[24px] flex flex-col items-center justify-center p-4 cursor-pointer transition-all border-2 relative",
                  isActive 
                    ? "bg-[#22C55E]/5 border-[#22C55E]" 
                    : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                )}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <Icon className={cn("w-12 h-12 mb-4", isActive ? "text-[#22C55E]" : "text-[#94A3B8]")} />
                <span className={cn("text-[14px] font-bold", isActive ? "text-[#22C55E]" : "text-[#64748B]")}>
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Fixed Area */}
      <div className="p-4 bg-white border-t border-[#F8FAFC] pb-8 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <Button 
          onClick={onSave}
          className="w-full h-14 bg-[#22C55E] hover:bg-[#0D3D33] text-white rounded-[16px] font-bold text-[16px] shadow-[0_4px_16px_rgba(34, 197, 94,0.3)]"
        >
          Save & Continue
        </Button>
      </div>
    </motion.div>
  );
}
