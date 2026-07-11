import React, { Suspense } from "react";
import { motion } from "framer-motion";
import TiltCard from "./TiltCard";
import ErrorBoundary from "./ErrorBoundary";

const AuthScene = React.lazy(() => import("./AuthScene"));

const STACK = [
  { text: "Hey! Are you around?", isOwn: false, rotate: -6, x: -30, y: -40, delay: 0 },
  { text: "Yep, what's up? 👋", isOwn: true, rotate: 4, x: 20, y: 0, delay: 0.15 },
  { text: "Let's catch up later today.", isOwn: false, rotate: -3, x: -10, y: 55, delay: 0.3 },
];

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-surface-2 p-12 relative overflow-hidden ambient-glow">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <AuthScene />
        </Suspense>
      </ErrorBoundary>
      
      <div className="max-w-md text-center z-[1] relative w-full">
        <div className="relative h-64 mb-8 z-[1] flex items-center justify-center">
          {STACK.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: card.y, rotate: card.rotate, x: card.x }}
              transition={{ delay: card.delay, duration: 0.6, ease: "easeOut" }}
              className="absolute"
            >
              <TiltCard className="w-fit h-fit">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-elevation-2 ${
                    card.isOwn
                      ? "bg-gradient-to-br from-accent to-accent-hover text-white"
                      : "bg-surface text-ink border border-line-soft"
                  }`}
                >
                  {card.text}
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
        
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{title}</h2>
        <p className="text-ink-muted">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
