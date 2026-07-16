import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUiThemeStore } from "../store/useUiThemeStore";
import { useSoundStore } from "../store/useSoundStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Send, Moon, Sun, Volume2, VolumeX, Bell, Shield, User, Keyboard, Monitor, ArrowRight, ShieldAlert, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const TABS = [
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "account", label: "Account", icon: User },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  const { isDark, toggleTheme } = useUiThemeStore();
  const { isMuted, toggleMute } = useSoundStore();
  const { authUser, unblockUser, subscribeToPush } = useAuthStore();
  const { users } = useChatStore();
  const { shouldReduceMotion } = useMotionPreferences();

  const [pushPermission, setPushPermission] = useState(Notification.permission);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Check if SW has push subscription
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const handlePushToggle = async () => {
    if (pushPermission === "denied") return;
    
    if (pushPermission === "default") {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") {
        await subscribeToPush();
        setPushEnabled(true);
      }
    } else if (pushPermission === "granted") {
      if (!pushEnabled) {
        await subscribeToPush();
        setPushEnabled(true);
      } else {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
          setPushEnabled(false);
        }
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "appearance":
        return (
          <motion.div {...applyMotion(fadeUp, shouldReduceMotion)} className="space-y-8">
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight text-ink">Appearance</h2>
                <p className="text-sm text-ink-muted">Customize how Chatty looks on your device.</p>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-4 flex items-center justify-between shadow-elevation-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-lg text-ink">
                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-ink">Dark Mode</h3>
                    <p className="text-xs text-ink-muted">Toggle dark theme</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface ${isDark ? 'bg-accent' : 'bg-surface-3 border border-line'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-4 flex items-center justify-between shadow-elevation-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-3 rounded-lg text-ink">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-ink">Mute Sounds</h3>
                    <p className="text-xs text-ink-muted">Disable notification sounds</p>
                  </div>
                </div>
                <button 
                  onClick={toggleMute}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface ${isMuted ? 'bg-accent' : 'bg-surface-3 border border-line'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMuted ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Preview</h3>
              <div className="rounded-2xl border border-line overflow-hidden bg-surface shadow-elevation-2 pointer-events-none">
                <div className="p-4 sm:p-8 bg-surface-2 flex items-center justify-center">
                  <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-line bg-surface/70 backdrop-blur-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                        J
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-ink">John Doe</h3>
                        <p className="text-xs text-online">Online</p>
                      </div>
                    </div>

                    <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto chat-wallpaper">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div key={message.id} className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-elevation-1 ${message.isSent ? "bg-gradient-to-br from-accent to-accent-hover text-white rounded-br-md" : "bg-surface-2 text-ink border border-line-soft rounded-bl-md"}`}>
                            <p className="text-[14px] leading-snug">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 border-t border-line bg-surface flex gap-2 items-center">
                      <div className="flex-1 bg-surface-2 border border-line rounded-2xl px-4 py-1.5 text-sm text-ink-faint shadow-elevation-1">
                        Message...
                      </div>
                      <div className="size-10 rounded-full flex items-center justify-center bg-accent text-white shadow-glow-accent">
                        <Send size={17} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        );
      
      case "notifications":
        return (
          <motion.div {...applyMotion(fadeUp, shouldReduceMotion)} className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Notifications</h2>
              <p className="text-sm text-ink-muted">Manage how you're alerted about new messages.</p>
            </div>
            
            <div className="bg-surface-2 border border-line rounded-xl p-4 shadow-elevation-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm text-ink">Push Notifications</h3>
                  <p className="text-xs text-ink-muted max-w-sm mt-1">Receive alerts when the app is backgrounded or closed.</p>
                  {pushPermission === "denied" && (
                    <div className="mt-2 text-xs font-medium text-red-500 bg-red-50 inline-block px-2 py-1 rounded">
                      Blocked by browser settings
                    </div>
                  )}
                </div>
                <button 
                  onClick={handlePushToggle}
                  disabled={pushPermission === "denied"}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface ${pushPermission === "denied" ? 'opacity-50 cursor-not-allowed bg-surface-3 border border-line' : pushEnabled ? 'bg-accent' : 'bg-surface-3 border border-line'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div {...applyMotion(fadeUp, shouldReduceMotion)} className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Privacy</h2>
              <p className="text-sm text-ink-muted">Manage your blocked users and visibility.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Blocked Users</h3>
              {(!authUser?.blockedUsers || authUser.blockedUsers.length === 0) ? (
                <div className="bg-surface-2 border border-line rounded-xl p-8 text-center shadow-elevation-1">
                  <ShieldAlert className="size-8 mx-auto text-ink-faint mb-2" />
                  <p className="text-sm text-ink-muted">You have no blocked users.</p>
                </div>
              ) : (
                <div className="bg-surface-2 border border-line rounded-xl overflow-hidden shadow-elevation-1 divide-y divide-line">
                  {authUser.blockedUsers.map(blockedId => {
                    const blockedUser = users.find(u => u._id === blockedId);
                    return (
                      <div key={blockedId} className="p-4 flex items-center justify-between hover:bg-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={blockedUser?.profilePic || "/avatar.png"} alt="Avatar" className="size-10 rounded-full object-cover bg-surface-3" />
                          <div>
                            <p className="font-medium text-sm text-ink">{blockedUser?.fullName || "Unknown User"}</p>
                            <p className="text-xs text-ink-faint">Blocked</p>
                          </div>
                        </div>
                        <button
                          onClick={() => unblockUser(blockedId)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-3 hover:bg-surface-4 text-ink transition-colors border border-line"
                        >
                          Unblock
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );

      case "account":
        return (
          <motion.div {...applyMotion(fadeUp, shouldReduceMotion)} className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Account</h2>
              <p className="text-sm text-ink-muted">Manage your profile details and credentials.</p>
            </div>

            <div className="bg-surface-2 border border-line rounded-xl p-6 shadow-elevation-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={authUser?.profilePic || "/avatar.png"} alt="Avatar" className="size-16 rounded-full object-cover border-2 border-surface-3" />
                <div>
                  <h3 className="font-medium text-lg text-ink">{authUser?.fullName}</h3>
                  <p className="text-sm text-ink-muted">{authUser?.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors shadow-glow-accent"
              >
                Edit Profile <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        );

      case "shortcuts":
        return (
          <motion.div {...applyMotion(fadeUp, shouldReduceMotion)} className="space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Keyboard Shortcuts</h2>
              <p className="text-sm text-ink-muted">Navigate Chatty efficiently.</p>
            </div>

            <div className="bg-surface-2 border border-line rounded-xl overflow-hidden shadow-elevation-1">
              <div className="p-4 flex items-center justify-between border-b border-line hover:bg-surface transition-colors">
                <span className="text-sm text-ink font-medium">Send message</span>
                <kbd className="px-2 py-1 bg-surface-3 border border-line rounded text-xs font-mono text-ink-muted font-medium">Enter</kbd>
              </div>
              <div className="p-4 flex items-center justify-between border-b border-line hover:bg-surface transition-colors">
                <span className="text-sm text-ink font-medium">Cancel reply / Close modals</span>
                <kbd className="px-2 py-1 bg-surface-3 border border-line rounded text-xs font-mono text-ink-muted font-medium">Escape</kbd>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-surface transition-colors">
                <span className="text-sm text-ink font-medium">Next line in composer</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-surface-3 border border-line rounded text-xs font-mono text-ink-muted font-medium">Shift</kbd>
                  <span className="text-xs text-ink-faint">+</span>
                  <kbd className="px-2 py-1 bg-surface-3 border border-line rounded text-xs font-mono text-ink-muted font-medium">Enter</kbd>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink pt-20 pb-10 relative overflow-hidden ambient-glow">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-[1]">
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-56 shrink-0">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/" className="p-2 -ml-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent" aria-label="Go back">
                <ArrowLeft className="size-5" />
              </Link>
              <h1 className="text-3xl font-bold text-ink">Settings</h1>
            </div>
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-none">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "bg-accent/10 text-accent" 
                      : "text-ink-muted hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  <tab.icon className={`size-4 ${activeTab === tab.id ? "text-accent" : ""}`} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 max-w-2xl min-h-[60vh] md:pt-14">
            <AnimatePresence mode="wait">
              <div key={activeTab}>
                {renderContent()}
              </div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
export default SettingsPage;
