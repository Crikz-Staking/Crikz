import { Variants } from 'framer-motion';

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      duration: 0.6,
      bounce: 0.3
    }
  },
};

export const glassHover = {
  scale: 1.02,
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  borderColor: "rgba(245, 158, 11, 0.4)", // Primary color (orange) glow
  transition: { duration: 0.2 }
};

export const pulseScale = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};