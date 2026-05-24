import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

// We support primary, secondary, outline, danger types for easy consistent styling, or direct custom className
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'none';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = 'none',
  disabled,
  ...props
}) => {
  // Configs matching instructions
  const isDanger = variant === 'danger';
  const scaleHover = isDanger ? 1.02 : 1.02;
  const scaleTap = isDanger ? 0.95 : 0.97;

  return (
    <motion.button
      whileHover={disabled ? {} : { 
        scale: scaleHover,
        filter: 'brightness(1.05)',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)'
      }}
      whileTap={disabled ? {} : { scale: scaleTap }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        "inline-flex items-center justify-center transition-colors font-semibold outline-none",
        variant === 'primary' && "bg-[#1a3a2a] hover:bg-[#1a3a2a]/95 text-white shadow-sm",
        variant === 'secondary' && "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200",
        variant === 'outline' && "border border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
        variant === 'danger' && "bg-red-600 hover:bg-red-700 text-white shadow-sm",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none transform-none filter-none shadow-none",
        className
      )}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
