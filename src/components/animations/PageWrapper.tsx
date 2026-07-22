import React from 'react';
import { motion } from 'motion/react';
import { ANIMATIONS } from '../../constants/animations';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={ANIMATIONS.page.initial}
      animate={ANIMATIONS.page.animate}
      exit={ANIMATIONS.page.exit}
      transition={ANIMATIONS.page.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
