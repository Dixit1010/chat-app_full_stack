import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useUiThemeStore } from "../store/useUiThemeStore";
import { LogOut, MessageSquare, Moon, Settings, Sun, User } from "lucide-react";

const NavIconLink = ({ to, icon: Icon, label, onClick }) => {
  const inner = (
    <motion.span
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.94 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </motion.span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <Link to={to}>{inner}</Link>;
};

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { isDark, toggle } = useUiThemeStore();

  return (
    <header className="fixed w-full top-0 z-40 border-b border-line bg-surface/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center transition-shadow group-hover:shadow-[0_0_20px_-4px_var(--accent)]">
            <MessageSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Chatty</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle color theme"
            className="relative size-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? "moon" : "sun"}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <NavIconLink to="/settings" icon={Settings} label="Settings" />

          {authUser && (
            <>
              <NavIconLink to="/profile" icon={User} label="Profile" />
              <NavIconLink icon={LogOut} label="Logout" onClick={logout} />
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
