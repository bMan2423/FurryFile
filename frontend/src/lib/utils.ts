import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, fmt = "MMM d, yyyy"): string {
  try {
    // new Date() correctly converts UTC ISO strings (with or without Z) to local time
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return format(d, fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "MMM d, yyyy h:mm a");
}

export function getAge(dateStr: string): string {
  try {
    const birth = new Date(dateStr)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth() +
      (now.getDate() < birth.getDate() ? -1 : 0) +
      years * 12
    if (months < 1) return "< 1 month"
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`
    const y = Math.floor(months / 12)
    const m = months % 12
    return m > 0 ? `${y}y ${m}m` : `${y} year${y !== 1 ? "s" : ""}`
  } catch {
    return ""
  }
}

export function getImageUrl(path?: string | null): string {
  if (!path) return "/placeholder-pet.png";
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`;
}

export function getPrimaryPhoto(photos: { url: string; is_primary: boolean }[]): string | null {
  const primary = photos.find((p) => p.is_primary);
  return primary ? getImageUrl(primary.url) : photos[0] ? getImageUrl(photos[0].url) : null;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)   return "just now"
    if (mins < 60)  return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)   return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7)   return `${days}d ago`
    return formatDate(dateStr)
  } catch {
    return ""
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("")
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    missing: "bg-red-100 text-red-800",
    found: "bg-blue-100 text-blue-800",
    reunited: "bg-green-100 text-green-800",
    available: "bg-green-100 text-green-800",
    adopted: "bg-purple-100 text-purple-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}
