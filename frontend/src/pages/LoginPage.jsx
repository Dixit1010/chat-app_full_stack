import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface text-ink">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-hidden ambient-glow">
        <div className="w-full max-w-md space-y-8 relative z-[1]">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-accent/10 flex items-center justify-center 
              group-hover:bg-accent/20 transition-all shadow-elevation-1 group-hover:shadow-glow-accent"
              >
                <MessageSquare className="size-6 text-accent" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-2">Welcome Back</h1>
              <p className="text-lg text-ink-muted mt-1">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-muted">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-ink-muted" />
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
                  <Lock className="h-5 w-5 text-ink-muted" />
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
                    <EyeOff className="h-5 w-5 text-ink-muted hover:text-ink transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-ink-muted hover:text-ink transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2.5 font-medium flex items-center justify-center transition-all shadow-glow-accent hover:shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.2),0_10px_28px_-6px_rgba(var(--accent-rgb),0.45)] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoggingIn}
              whileTap={{ scale: 0.98 }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <div className="text-center">
            <p className="text-ink-muted text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-accent hover:text-accent-hover underline-offset-4 hover:underline font-medium">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      />
    </div>
  );
};
export default LoginPage;
