import { useReducedMotion } from "framer-motion";

// Use this hook in components to conditionally disable animations
export const useMotionPreferences = () => {
  const shouldReduceMotion = useReducedMotion();
  return { shouldReduceMotion };
};

// Standard confident, quiet spring (no bounce)
export const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 1,
};

// Fade up (for page loads, modals)
export const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Simple fade (for toggles, tooltips)
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" }
};

// Spring pop (for bubbles, menus)
export const springPop = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: springConfig
};

// Staggered list container
export const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  },
  exit: { opacity: 0 }
};

// Child of staggered list
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

// Apply preferences wrapper (returns static final state if reduced motion is preferred)
export const applyMotion = (variant, shouldReduceMotion) => {
  if (shouldReduceMotion) {
    return {
      initial: variant.animate,
      animate: variant.animate,
      exit: variant.exit ? variant.exit : variant.initial,
      transition: { duration: 0.001 } // effectively instant
    };
  }
  return variant;
};
