
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { initE2EE, generateUserKeyPair } from "../lib/e2ee.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5002" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
      get().setupE2EE(res.data);
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
      get().setupE2EE(res.data);
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      
      get().connectSocket();
      get().subscribeToPush();
      get().setupE2EE(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  subscribeToPush: async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const register = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "BLBzVonKFt1dNGZHZT9i205W1UE066sJGm2LuONQUxLOHsZTbFC7LxAnyGjH_FW8-zrqFHu5r-ldjHJAqs5K8m8",
      });
      await axiosInstance.post("/auth/push-subscribe", { subscription });
    } catch (error) {
      console.log("Push subscription failed", error);
    }
  },

  setupE2EE: async (user) => {
    try {
      await initE2EE();
      let privateKey = localStorage.getItem(`chatty_priv_${user._id}`);
      
      if (!privateKey) {
        const keys = generateUserKeyPair();
        localStorage.setItem(`chatty_priv_${user._id}`, keys.privateKey);
        await axiosInstance.put("/auth/public-key", { publicKey: keys.publicKey });
      }
    } catch (e) {
      console.log("Failed to setup E2EE", e);
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
