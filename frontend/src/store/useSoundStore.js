import { create } from "zustand";

const generateTone = (type, freq1, freq2, duration, type2 = "sine") => {
  if (typeof window === "undefined" || !window.AudioContext) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc1.type = type;
  osc2.type = type2;
  osc1.frequency.setValueAtTime(freq1, ctx.currentTime);
  osc2.frequency.setValueAtTime(freq2, ctx.currentTime);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  
  osc1.stop(ctx.currentTime + duration);
  osc2.stop(ctx.currentTime + duration);
  
  setTimeout(() => ctx.close(), duration * 1000 + 100);
};

export const useSoundStore = create((set, get) => ({
  isMuted: localStorage.getItem("chatty-sound-muted") === "true",

  toggleMute: () => {
    const nextState = !get().isMuted;
    localStorage.setItem("chatty-sound-muted", nextState);
    set({ isMuted: nextState });
  },

  playMessageSent: () => {
    if (get().isMuted) return;
    // Light, ascending pop
    generateTone("sine", 600, 800, 0.15);
  },

  playMessageReceived: () => {
    if (get().isMuted) return;
    // Gentle, descending chime
    generateTone("sine", 800, 600, 0.2);
  },

  playRing: () => {
    if (get().isMuted) return;
    // Ringing tone
    generateTone("square", 440, 440, 0.5);
    setTimeout(() => {
      if (!get().isMuted) generateTone("square", 440, 440, 0.5);
    }, 800);
  }
}));
