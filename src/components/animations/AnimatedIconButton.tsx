import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface AnimatedIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  rotateOnTap?: boolean;
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  children,
  className,
  disabled,
  rotateOnTap = true,
  ...props
}) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { 
        scale: 1.1,
        filter: 'brightness(1.1)' 
      }}
      whileTap={disabled ? {} : { 
        scale: 0.9,
        rotate: rotateOnTap ? -4 : 0
      }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center justify-center p-2 rounded-xl transition-all outline-none",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none filter-none",
        className
      )}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedIconButton;
