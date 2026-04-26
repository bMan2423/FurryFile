import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface ThemeState {
  theme: "light" | "dark"
  toggle: () => void
  setTheme: (t: "light" | "dark") => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggle: () => set(s => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "furryfile-theme", storage: createJSONStorage(() => localStorage) }
  )
)
