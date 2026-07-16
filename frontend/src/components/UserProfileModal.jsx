import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, Info, X, ShieldAlert, Flag } from 'lucide-react';
import TiltCard from './TiltCard';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { applyMotion, fadeUp, springPop, useMotionPreferences } from '../lib/motion';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const { authUser, blockUser, unblockUser } = useAuthStore();
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const { shouldReduceMotion } = useMotionPreferences();

  const isBlocked = authUser?.blockedUsers?.includes(user?._id);

  const handleBlockToggle = async () => {
    if (isBlocked) {
      await unblockUser(user._id);
    } else {
      if (window.confirm(`Are you sure you want to block ${user.fullName}? You will not be able to send or receive messages from them in direct conversations.`)) {
        await blockUser(user._id);
      }
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await axiosInstance.post('/reports', {
        reportedUserId: user._id,
        reason: reportReason,
        details: reportDetails
      });
      toast.success("Report submitted — thank you");
      setIsReporting(false);
      setReportReason("spam");
      setReportDetails("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (!user) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            {...applyMotion({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, shouldReduceMotion)}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            {...applyMotion(springPop, shouldReduceMotion)}
            className="relative w-full max-w-sm pointer-events-none"
          >
            <TiltCard>
              <div className="bg-surface-2 p-6 sm:p-8 rounded-2xl border border-line shadow-elevation-3 pointer-events-auto relative overflow-hidden">
                <button 
                  onClick={onClose}
                  aria-label="Close modal"
                  className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink hover:bg-surface-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 mb-6">
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-elevation-1"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink tracking-tight">{user.fullName}</h2>
                    <p className="text-accent font-medium flex items-center justify-center gap-1 mt-0.5">
                      <AtSign className="w-4 h-4" />
                      {user.username}
                    </p>
                  </div>
                </div>

                <div className="bg-surface-3 rounded-xl p-4 border border-line shadow-elevation-1">
                  <div className="flex items-center gap-2 text-ink-muted text-sm font-medium mb-2">
                    <Info className="w-4 h-4" />
                    About
                  </div>
                  <p className="text-ink text-sm leading-relaxed">
                    {user.about || "Hey there! I am using Chatty"}
                  </p>
                </div>

                {authUser?._id !== user._id && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleBlockToggle}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${
                        isBlocked
                          ? "bg-surface-3 text-ink hover:bg-surface-4 focus:ring-accent"
                          : "bg-red-500/10 text-red-500 hover:bg-red-500/20 focus:ring-red-500"
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      {isBlocked ? "Unblock User" : "Block User"}
                    </button>

                    {!isReporting ? (
                      <button
                        onClick={() => setIsReporting(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report User
                      </button>
                    ) : (
                      <form onSubmit={handleReportSubmit} className="bg-surface-3 p-4 rounded-xl border border-line space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-ink">Report User</h4>
                          <button type="button" onClick={() => setIsReporting(false)} aria-label="Cancel report" className="text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {["spam", "harassment", "inappropriate", "other"].map(reason => (
                            <label key={reason} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                              <input
                                type="radio"
                                name="reason"
                                value={reason}
                                checked={reportReason === reason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="text-accent focus:ring-accent accent-accent"
                              />
                              <span className="capitalize">{reason}</span>
                            </label>
                          ))}
                        </div>

                        <textarea
                          placeholder="Additional details (optional)..."
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          maxLength={500}
                          className="w-full bg-surface-2 border border-line rounded-lg p-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent resize-none h-20"
                        />
                        
                        <button
                          type="submit"
                          disabled={isSubmittingReport}
                          className="w-full py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent shadow-glow-accent"
                        >
                          {isSubmittingReport ? "Submitting..." : "Submit Report"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </TiltCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default UserProfileModal;
