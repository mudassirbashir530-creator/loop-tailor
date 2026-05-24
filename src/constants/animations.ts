export const ANIMATIONS = {
  page: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: 'easeOut' as const }
  },
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.25, ease: 'easeOut' as const }
  },
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { duration: 0.15 }
  },
  iconButton: {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 },
    transition: { duration: 0.15 }
  },
  toast: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { 
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 }
  }
};
