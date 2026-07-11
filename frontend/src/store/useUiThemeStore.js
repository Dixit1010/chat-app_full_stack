import { create } from "zustand";

const getInitialIsDark = () => {
  const stored = localStorage.getItem("ui-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
};

export const useUiThemeStore = create((set, get) => ({
  isDark: getInitialIsDark(),
  toggle: () => {
    const next = !get().isDark;
    localStorage.setItem("ui-theme", next ? "dark" : "light");
    set({ isDark: next });
  },
}));
