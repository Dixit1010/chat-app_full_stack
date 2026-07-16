import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useMotionPreferences } from "../lib/motion";

const TiltCard = ({ children, className = "" }) => {
  const ref = useRef(null);
  const { shouldReduceMotion } = useMotionPreferences();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXPos = useMotionValue(0);
  const mouseYPos = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-6, 6]);

  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.12, 0, 0.12]);
  
  const background = useMotionTemplate`radial-gradient(circle at ${mouseXPos}px ${mouseYPos}px, rgba(var(--accent-rgb), 0.10) 0%, transparent 80%)`;

  const handleMouseMove = (e) => {
    if (!ref.current || shouldReduceMotion) return;
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
    
    mouseXPos.set(mouseX);
    mouseYPos.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className={className} 
      style={{ perspective: 800 }}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={shouldReduceMotion ? {} : {
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative"
      >
        {children}
        {!shouldReduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-50 rounded-[inherit]"
            style={{
              opacity: glareOpacity,
              background,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
