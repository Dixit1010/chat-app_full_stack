import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useUiThemeStore } from "../store/useUiThemeStore";
import { LogOut, MessageSquare, Moon, Settings, Sun, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { isDark, toggle } = useUiThemeStore();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { shouldReduceMotion } = useMotionPreferences();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <header className="fixed w-full top-0 z-40 border-b border-line bg-surface/70 backdrop-blur-xl">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-accent rounded-lg">
          <div className="size-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center transition-shadow group-hover:shadow-[0_0_20px_-4px_var(--accent)]">
            <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Chatty</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle color theme"
            className="relative size-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                {...(shouldReduceMotion 
                  ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
                  : { initial: { opacity: 0, rotate: -90, scale: 0.5 }, animate: { opacity: 1, rotate: 0, scale: 1 }, exit: { opacity: 0, rotate: 90, scale: 0.5 }, transition: { duration: 0.2 } }
                )}
                className="absolute inset-0 flex items-center justify-center"
              >
                {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          {authUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User profile menu"
                aria-expanded={isDropdownOpen}
                className="ml-2 block size-9 rounded-full overflow-hidden border-2 border-transparent hover:border-accent transition-colors focus:outline-none focus:border-accent shadow-sm focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              >
                <img
                  src={authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    {...applyMotion(fadeUp, shouldReduceMotion)}
                    className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-elevation-3 border border-line py-1 origin-top-right overflow-hidden"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 focus:outline-none focus:bg-surface-2 ${
                        location.pathname === "/profile" ? "text-accent bg-accent/5 font-medium" : "text-ink"
                      }`}
                    >
                      <User className="size-4" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 focus:outline-none focus:bg-surface-2 ${
                        location.pathname === "/settings" ? "text-accent bg-accent/5 font-medium" : "text-ink"
                      }`}
                    >
                      <Settings className="size-4" /> Settings
                    </Link>
                    <div className="h-px bg-line my-1" />
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-red-500 hover:bg-red-50 focus:outline-none focus:bg-red-50"
                    >
                      <LogOut className="size-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
