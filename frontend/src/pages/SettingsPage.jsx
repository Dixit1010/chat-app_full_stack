import { useUiThemeStore } from "../store/useUiThemeStore";
import { Send, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import TiltCard from "../components/TiltCard";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { isDark, toggleTheme } = useUiThemeStore();

  return (
    <div className="min-h-screen bg-surface text-ink pt-20 pb-10 relative overflow-hidden ambient-glow">
      <div className="container mx-auto px-4 max-w-5xl relative z-[1]">
        <motion.div 
          className="space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Theme Toggle Section */}
          <section className="space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Appearance</h2>
              <p className="text-sm text-ink-muted">Customize how Chatty looks on your device.</p>
            </div>

            <TiltCard>
              <div className="bg-surface-2 border border-line rounded-xl p-4 flex items-center justify-between max-w-md shadow-elevation-1">
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
            </TiltCard>
          </section>

          {/* Preview Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight mb-3 text-ink">Preview</h3>
            <TiltCard>
              <div className="rounded-2xl border border-line overflow-hidden bg-surface shadow-elevation-2">
                <div className="p-4 sm:p-8 bg-surface-2 flex items-center justify-center">
                  <div className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-line bg-surface/70 backdrop-blur-xl shadow-elevation-1 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-ink">John Doe</h3>
                      <p className="text-xs text-online">Online</p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-surface">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-elevation-1 ${message.isSent ? "bg-gradient-to-br from-accent to-accent-hover text-white rounded-br-md" : "bg-surface-2 text-ink border border-line-soft rounded-bl-md"}`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-[10px] mt-1 ${message.isSent ? "text-white/70 text-right" : "text-ink-muted"}`}>
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-line bg-surface flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent placeholder:text-ink-faint shadow-elevation-1 focus:shadow-elevation-2 transition-all focus:ring-2 focus:ring-accent/20"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="p-2 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center shadow-glow-accent transition-all">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </TiltCard>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
export default SettingsPage;
