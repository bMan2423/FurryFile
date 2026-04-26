"use client"

import { useEffect } from "react"
import { useThemeStore } from "@/store/themeStore"

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore(s => s.theme)
  const setTheme = useThemeStore(s => s.setTheme)

  // On mount: read localStorage immediately to avoid flash before zustand hydrates
  useEffect(() => {
    try {
      const stored = localStorage.getItem("furryfile-theme")
      if (stored) {
        const parsed = JSON.parse(stored)
        const savedTheme = parsed?.state?.theme
        if (savedTheme === "dark" || savedTheme === "light") {
          setTheme(savedTheme)
          if (savedTheme === "dark") {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync theme changes to <html> class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  return <>{children}</>
}
