import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useCallStore } from "./store/useCallStore";
import { useUiThemeStore } from "./store/useUiThemeStore";
import { useEffect } from "react";
import IncomingCallModal from "./components/IncomingCallModal";
import InCallScreen from "./components/InCallScreen";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { subscribeToCalls, unsubscribeFromCalls } = useCallStore();
  const { isDark } = useUiThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(err => {
        console.log("Service Worker registration failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      subscribeToMessages();
      subscribeToCalls();
      return () => {
        unsubscribeFromMessages();
        unsubscribeFromCalls();
      };
    }
  }, [authUser, subscribeToMessages, unsubscribeFromMessages, subscribeToCalls, unsubscribeFromCalls]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <Loader className="size-10 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-surface text-ink min-h-screen">
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
      <IncomingCallModal />
      <InCallScreen />
    </div>
  );
};
export default App;
