"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import {
  Heart, Calendar, AlertTriangle, Bell, PawPrint,
  BookOpen, MapPin, ChevronRight, Plus, Stethoscope,
  Users, ArrowRight, TrendingUp,
} from "lucide-react"
import type { Pet, Appointment, Notification } from "@/types"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { ROLES, ROLE_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    no_show: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : ""
}



// ── Greeting helper ───────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// ── Stat Card ─────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  href: string
  iconBg: string
  iconColor: string
  darkIconBg: string
}

function StatCard({ label, value, icon: Icon, href, iconBg, iconColor, darkIconBg }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        iconBg, darkIconBg
      )}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
    </Link>
  )
}

// ── Quick Action Card ─────────────────────────────────────────────
interface QuickActionProps {
  href: string
  icon: React.ElementType
  label: string
  description: string
  gradientFrom: string
  gradientTo: string
}

function QuickActionCard({ href, icon: Icon, label, description, gradientFrom, gradientTo }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
    >
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
        gradientFrom, gradientTo
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()

  const isPetOwner = user?.role === ROLES.PET_OWNER
  const isVet      = user?.role === ROLES.VETERINARIAN
  const isSitter   = user?.role === ROLES.PET_SITTER
  const isShelter  = user?.role === ROLES.SHELTER

  const { data: pets, isLoading: petsLoading } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => (await api.get<Pet[]>("/pets")).data,
    enabled: isPetOwner || isVet || isShelter,
  })

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await api.get<Appointment[]>("/appointments")).data,
    enabled: isPetOwner || isVet || isShelter,
  })

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/notifications")).data,
  })

  const { data: bookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => (await api.get("/bookings")).data,
    enabled: isPetOwner || isSitter,
  })

  const { data: missingPets } = useQuery({
    queryKey: ["missing-pets"],
    queryFn: async () => (await api.get("/missing-pets")).data,
  })

  const firstName = user?.full_name?.split(" ")[0] ?? "there"
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ""

  // Stats for pet owner
  const petOwnerStats: StatCardProps[] = [
    {
      label: "My Pets",
      value: pets?.length ?? 0,
      icon: PawPrint,
      href: "/pets",
      iconBg: "bg-orange-100",
      darkIconBg: "dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Bookings",
      value: (bookings as any[])?.length ?? 0,
      icon: BookOpen,
      href: "/bookings",
      iconBg: "bg-blue-100",
      darkIconBg: "dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Appointments",
      value: appointments?.filter(a => a.status === "pending").length ?? 0,
      icon: Calendar,
      href: "/appointments",
      iconBg: "bg-purple-100",
      darkIconBg: "dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Missing Pets",
      value: (missingPets as any[])?.length ?? 0,
      icon: MapPin,
      href: "/missing",
      iconBg: "bg-red-100",
      darkIconBg: "dark:bg-red-900",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ]

  // Stats for vet
  const vetStats: StatCardProps[] = [
    {
      label: "Pending Appointments",
      value: appointments?.filter(a => a.status === "pending").length ?? 0,
      icon: Calendar,
      href: "/appointments",
      iconBg: "bg-blue-100",
      darkIconBg: "dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Total Appointments",
      value: appointments?.length ?? 0,
      icon: Stethoscope,
      href: "/appointments",
      iconBg: "bg-teal-100",
      darkIconBg: "dark:bg-teal-900",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Patients (Pets)",
      value: pets?.length ?? 0,
      icon: PawPrint,
      href: "/pets",
      iconBg: "bg-orange-100",
      darkIconBg: "dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Unread Alerts",
      value: notifications?.filter(n => !n.is_read).length ?? 0,
      icon: Bell,
      href: "/notifications",
      iconBg: "bg-amber-100",
      darkIconBg: "dark:bg-amber-900",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ]

  // Stats for shelter
  const shelterStats: StatCardProps[] = [
    {
      label: "Shelter Pets",
      value: pets?.length ?? 0,
      icon: PawPrint,
      href: "/pets",
      iconBg: "bg-orange-100",
      darkIconBg: "dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Appointments",
      value: appointments?.filter(a => a.status === "pending" || a.status === "confirmed").length ?? 0,
      icon: Calendar,
      href: "/appointments",
      iconBg: "bg-purple-100",
      darkIconBg: "dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Missing Reports",
      value: (missingPets as any[])?.length ?? 0,
      icon: MapPin,
      href: "/missing",
      iconBg: "bg-red-100",
      darkIconBg: "dark:bg-red-900",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Health Records",
      value: pets?.length ?? 0,
      icon: Stethoscope,
      href: "/health",
      iconBg: "bg-teal-100",
      darkIconBg: "dark:bg-teal-900",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
  ]

  const displayStats = isVet ? vetStats : isShelter ? shelterStats : petOwnerStats

  // Quick actions
  const petOwnerActions: QuickActionProps[] = [
    { href: "/pets/new",     icon: PawPrint,  label: "Add a Pet",          description: "Register a new pet profile",           gradientFrom: "from-orange-400", gradientTo: "to-orange-600" },
    { href: "/appointments", icon: Calendar,  label: "Book Appointment",   description: "Schedule a vet appointment",           gradientFrom: "from-purple-400", gradientTo: "to-purple-600" },
    { href: "/missing",      icon: MapPin,    label: "Report Missing Pet", description: "Alert the community about a lost pet", gradientFrom: "from-red-400",    gradientTo: "to-red-600" },
  ]

  const vetActions: QuickActionProps[] = [
    { href: "/appointments", icon: Calendar,    label: "Manage Appointments",  description: "View and manage your schedule",         gradientFrom: "from-blue-400",   gradientTo: "to-blue-600" },
    { href: "/health",       icon: Stethoscope, label: "Health Records",       description: "Access patient health records",         gradientFrom: "from-teal-400",   gradientTo: "to-teal-600" },
    { href: "/vet-search",   icon: PawPrint,    label: "Search Pets",          description: "Look up registered pets",               gradientFrom: "from-orange-400", gradientTo: "to-orange-600" },
    { href: "/community",    icon: Users,       label: "Community",            description: "Engage with the pet community",         gradientFrom: "from-green-400",  gradientTo: "to-green-600" },
  ]

  const shelterActions: QuickActionProps[] = [
    { href: "/pets/new",     icon: PawPrint,    label: "Add a Pet",          description: "Register a pet into the shelter",    gradientFrom: "from-orange-400", gradientTo: "to-orange-600" },
    { href: "/pets",         icon: PawPrint,    label: "View Shelter Pets",  description: "Browse all pets in your shelter",    gradientFrom: "from-amber-400",  gradientTo: "to-amber-600" },
    { href: "/appointments", icon: Calendar,    label: "Book Appointment",   description: "Schedule a vet visit for a pet",     gradientFrom: "from-purple-400", gradientTo: "to-purple-600" },
    { href: "/missing",      icon: MapPin,      label: "Report Missing",     description: "List a pet as missing",              gradientFrom: "from-red-400",    gradientTo: "to-red-600" },
    { href: "/health",       icon: Stethoscope, label: "Health Records",     description: "View and manage pet health records", gradientFrom: "from-teal-400",   gradientTo: "to-teal-600" },
  ]

  const displayActions = isVet ? vetActions : isShelter ? shelterActions : petOwnerActions

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Welcome Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 p-6 sm:p-8 shadow-lg">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">{getGreeting()},</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {firstName}! 🐾
              </h1>
              <p className="text-orange-100 mt-2 text-sm sm:text-base">
                {isVet
                  ? "Ready for today's appointments?"
                  : isSitter
                  ? "Any new booking requests today?"
                  : isShelter
                  ? "Caring for pets, one home at a time."
                  : "Here's what's happening with your pets today."}
              </p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {roleLabel}
                </span>
                {user?.is_verified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                    Verified Account
                  </span>
                )}
              </div>
            </div>
            <div className="hidden sm:flex w-20 h-20 bg-white/10 rounded-2xl items-center justify-center backdrop-blur-sm flex-shrink-0">
              <PawPrint className="w-10 h-10 text-white/80" />
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-24 w-12 h-12 bg-white/5 rounded-full" />
      </div>

      {/* ── Grow your bookings (pet sitters only) ── */}
      {isSitter && (
        <div className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-orange-900/40 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Grow your bookings</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Keep your profile up to date and respond to requests quickly to get more bookings.
              Head to Settings to update your bio and profile photo.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex-shrink-0 self-center flex items-center gap-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Settings
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Stats Row ── */}
      {(isPetOwner || isVet || isShelter) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {displayStats.map(stat => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayActions.map(action => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      {/* ── Pets Grid (pet owners & shelters) ── */}
      {(isPetOwner || isShelter) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {isShelter ? "Shelter Pets" : "Your Pets"}
            </h2>
            <Link
              href="/pets/new"
              className="flex items-center gap-1 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Pet
            </Link>
          </div>
          {petsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" /></div>
          ) : !pets || pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center mb-4">
                <PawPrint className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {isShelter ? "No pets in shelter yet" : "No pets yet"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {isShelter ? "Register your first pet to the shelter" : "Add your first pet to get started"}
              </p>
              <Link
                href="/pets/new"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isShelter ? "Add first shelter pet" : "Add your first pet"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {pets.slice(0, 6).map((pet) => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  className="group flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
                >
                  <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950 rounded-full flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
                    {pet.species === "dog" ? "🐕" : pet.species === "cat" ? "🐈" : "🐾"}
                  </div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight truncate w-full">{pet.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">{pet.species}</p>
                </Link>
              ))}
              {pets.length > 6 && (
                <Link
                  href="/pets"
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors text-center"
                >
                  <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">+{pets.length - 6}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">View all</p>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
