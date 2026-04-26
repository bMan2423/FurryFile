"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import ThemeProvider from "@/components/providers/ThemeProvider"
import { useAuthStore } from "@/store/authStore"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  // `mounted` becomes true only after the first client-side render, by which
  // point Zustand has already synchronously loaded auth state from localStorage.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login")
    }
  }, [mounted, isAuthenticated, router])

  // Show spinner until client has mounted (localStorage read is complete)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mt-4" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
