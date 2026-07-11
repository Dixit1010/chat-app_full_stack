import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import TiltCard from "./TiltCard";

const NoChatSelected = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface p-16 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-sm text-center"
      >
        <div className="flex flex-col items-center gap-6">
          <TiltCard>
            <div className="relative size-16 rounded-2xl bg-accent-soft border border-line flex items-center justify-center animate-float-slow shadow-elevation-2">
              <div className="absolute -inset-2 rounded-2xl bg-accent/20 blur-2xl"></div>
              <MessageSquare className="size-8 text-accent relative z-10" />
            </div>
          </TiltCard>

          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Your messages</h2>
            <p className="text-ink-muted">Start a conversation from the sidebar.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NoChatSelected;
