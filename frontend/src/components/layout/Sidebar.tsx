"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import {
  Home, Heart, Calendar, BookOpen, MapPin, Users,
  Bell, Settings, PawPrint, Search, Stethoscope, Database,
} from "lucide-react"

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500")} />
      {label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />}
    </Link>
  )
}

export default function Sidebar() {
  const user = useAuthStore(s => s.user)
  const role = user?.role ?? ""

  const isPetOwner  = role === "pet_owner"
  const isVet       = role === "veterinarian"
  const isPetSitter = role === "pet_sitter"
  const isShelter   = role === "shelter"

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-orange-600 transition-colors">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight block">FurryFile</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight block">Pet Management</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

        {/* ── Everyone ── */}
        <NavItem href="/dashboard"     label="Dashboard"     icon={Home} />

        {/* ── Pet Owner ── */}
        {isPetOwner && <NavItem href="/pets"         label="My Pets"        icon={PawPrint} />}
        {isPetOwner && <NavItem href="/appointments" label="Appointments"   icon={Calendar} />}
        {isPetOwner && <NavItem href="/bookings"     label="Bookings"       icon={BookOpen} />}

        {/* ── Veterinarian ── */}
        {isVet && <NavItem href="/vet-search"   label="Pet Search"     icon={Search} />}
        {isVet && <NavItem href="/health"       label="Health Records" icon={Stethoscope} />}
        {isVet && <NavItem href="/appointments" label="Appointments"   icon={Calendar} />}

        {/* ── Pet Sitter ── */}
        {isPetSitter && <NavItem href="/bookings" label="Bookings" icon={BookOpen} />}

        {/* ── Shelter ── */}
        {isShelter && <NavItem href="/pets"         label="Shelter Pets"   icon={PawPrint} />}
        {isShelter && <NavItem href="/pets/new"     label="Add a Pet"      icon={PawPrint} />}
        {isShelter && <NavItem href="/appointments" label="Appointments"   icon={Calendar} />}

        {/* ── Everyone ── */}
        <NavItem href="/missing"       label="Missing Pets"  icon={MapPin} />
        <NavItem href="/adoption"      label="Adoption"      icon={Heart} />
        <NavItem href="/community"     label="Community"     icon={Users} />
        <NavItem href="/notifications" label="Notifications" icon={Bell} />
        <NavItem href="/data"          label="Import / Export" icon={Database} />
        <NavItem href="/settings"      label="Settings"      icon={Settings} />
      </nav>

      {/* Bottom user info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{user?.full_name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize leading-tight">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
