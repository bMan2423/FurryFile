"use client";
import Link from "next/link";
import { Bell, LogOut, User, Heart } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification } from "@/types";

export default function Navbar() {
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>("/notifications?unread_only=true");
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = notifications?.length ?? 0;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary-600">
          <Heart className="w-5 h-5" />
          <span>FurryFile</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User info */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="hidden sm:block font-medium">{user?.full_name}</span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
