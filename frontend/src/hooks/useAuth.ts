"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import type { TokenResponse } from "@/types";
import { toast } from "sonner";


export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();

  async function login(email: string, password: string) {
    const { data } = await api.post<TokenResponse>("/auth/login", { email, password });
    setAuth(data.user, data.access_token, data.refresh_token);
    return data.user;
  }

  async function register(payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: string;
    subscription_plan?: string | null;
  }) {
    await api.post("/auth/register", payload);
    toast.success("Account created! Please log in.");
    router.push("/login");
  }

  async function logout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Best-effort logout
    } finally {
      storeLogout();
      router.push("/login");
    }
  }

  return { user, isAuthenticated, login, register, logout };
}
