import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface text-ink">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden ambient-glow">
        <motion.div 
          className="w-full max-w-md space-y-8 relative z-[1]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-accent/10 flex items-center justify-center 
              group-hover:bg-accent/20 transition-all shadow-elevation-1 group-hover:shadow-glow-accent"
              >
                <MessageSquare className="size-6 text-accent" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">Create Account</h1>
              <p className="text-ink-muted">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-muted">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-ink-faint" />
                </div>
                <input
                  type="text"
                  className={`w-full pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-lg focus:outline-none focus:border-accent text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-accent/20 transition-all shadow-elevation-1 focus:shadow-elevation-2`}
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-muted">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-ink-faint" />
                </div>
                <input
                  type="email"
                  className={`w-full pl-10 pr-4 py-2 bg-surface-2 border border-line rounded-lg focus:outline-none focus:border-accent text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-accent/20 transition-all shadow-elevation-1 focus:shadow-elevation-2`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-muted">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-ink-faint" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-10 py-2 bg-surface-2 border border-line rounded-lg focus:outline-none focus:border-accent text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-accent/20 transition-all shadow-elevation-1 focus:shadow-elevation-2`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-ink-muted hover:text-ink transition-colors" />
                  ) : (
                    <Eye className="size-5 text-ink-muted hover:text-ink transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2.5 font-medium flex items-center justify-center transition-all shadow-glow-accent hover:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.2),0_10px_28px_-6px_rgba(var(--accent-rgb),0.45)] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSigningUp}
              whileTap={{ scale: 0.98 }}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="text-center">
            <p className="text-ink-muted text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:text-accent-hover underline-offset-4 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};
export default SignUpPage;
