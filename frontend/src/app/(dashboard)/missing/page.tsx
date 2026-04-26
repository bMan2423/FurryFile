"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Clock, PawPrint, AlertTriangle, User } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface MissingReport {
  id: string
  pet_id: string
  reported_by_id: string
  status: string
  last_seen_at: string
  last_seen_address?: string
  description?: string
  reward_amount?: number
  contact_phone?: string
  contact_email?: string
  created_at: string
  pet?: {
    name: string; species: string; breed?: string
    color?: string; date_of_birth?: string
    photos?: { url: string; is_primary: boolean }[]
  }
  reporter?: {
    full_name: string; phone?: string; profile_photo_url?: string
  }
}

/** Days elapsed since a date string */
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

/** Age string from date_of_birth */
function petAge(dob?: string): string {
  if (!dob) return "Unknown age"
  const years = Math.floor(daysSince(dob) / 365)
  if (years < 1) {
    const months = Math.floor(daysSince(dob) / 30)
    return months <= 1 ? "< 1 month" : `${months} months`
  }
  return years === 1 ? "1 year" : `${years} years`
}

/**
 * Returns Tailwind bg + border + text classes based on days missing.
 * Deepens in 3-day steps: 0-2 → lightest, 3-5 → deeper, etc.
 */
function urgencyClasses(days: number): { card: string; badge: string; label: string } {
  if (days < 3)  return { card: "border-red-200 bg-red-50",   badge: "bg-red-100 text-red-600",   label: `${days}d` }
  if (days < 6)  return { card: "border-red-300 bg-red-100",  badge: "bg-red-200 text-red-700",   label: `${days}d` }
  if (days < 9)  return { card: "border-red-400 bg-red-200",  badge: "bg-red-300 text-red-800",   label: `${days}d` }
  if (days < 12) return { card: "border-red-500 bg-red-300",  badge: "bg-red-400 text-red-900",   label: `${days}d` }
  if (days < 21) return { card: "border-red-600 bg-red-400",  badge: "bg-red-500 text-white",     label: `${days}d` }
  return             { card: "border-red-800 bg-red-600",  badge: "bg-red-800 text-white",     label: `${days}d` }
}

/** Friendly duration string */
function durationLabel(days: number): string {
  if (days === 0) return "Missing since today"
  if (days === 1) return "Missing for 1 day"
  if (days < 7)   return `Missing for ${days} days`
  const weeks = Math.floor(days / 7)
  const rem   = days % 7
  const wLabel = weeks === 1 ? "1 week" : `${weeks} weeks`
  return rem === 0 ? `Missing for ${wLabel}` : `Missing for ${wLabel} ${rem}d`
}

export default function MissingPetsPage() {
  const [reports, setReports] = useState<MissingReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/missing-pets")
      .then(r => setReports(r.data))
      .catch(() => toast.error("Failed to load missing pets"))
      .finally(() => setLoading(false))
  }, [])

  const active = reports.filter(r => r.status === "missing")
  const found  = reports.filter(r => r.status !== "missing")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Missing Pets</h1>
          <p className="text-gray-500">
            {active.length} active report{active.length !== 1 ? "s" : ""}
            {found.length > 0 && ` · ${found.length} reunited`}
          </p>
        </div>
        <Link href="/pets">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <AlertTriangle className="w-4 h-4 mr-2" /> Report Missing
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      )}

      {!loading && active.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <PawPrint className="w-14 h-14 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No missing pets reported 🎉</p>
            <p className="text-gray-400 text-sm mt-1">All pets are safe!</p>
          </CardContent>
        </Card>
      )}

      {/* Active missing pets */}
      {!loading && active.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map(r => {
            const days   = daysSince(r.created_at)
            const urg    = urgencyClasses(days)
            const photo  = r.pet?.photos?.find(p => p.is_primary) ?? r.pet?.photos?.[0]

            return (
              <Card key={r.id} className={`border-2 ${urg.card} transition-colors`}>
                <CardContent className="pt-4 space-y-3">
                  {/* Top row: photo + name + urgency */}
                  <div className="flex items-start gap-3">
                    {/* Pet photo */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-red-100 flex-shrink-0">
                      {photo
                        ? <img src={`http://65.21.153.206${photo.url}`} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><PawPrint className="w-7 h-7 text-red-300" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg leading-tight">{r.pet?.name ?? "Unknown"}</h3>
                        <Badge className={`${urg.badge} text-xs font-semibold`}>
                          <Clock className="w-3 h-3 mr-1 inline" />{durationLabel(days)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {r.pet?.species ?? "—"}
                        {r.pet?.breed    ? ` · ${r.pet.breed}` : ""}
                        {r.pet?.color    ? ` · ${r.pet.color}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">{petAge(r.pet?.date_of_birth)}</p>
                    </div>
                  </div>

                  {/* Last seen */}
                  {r.last_seen_address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      Last seen: {r.last_seen_address}
                    </p>
                  )}
                  {r.description && (
                    <p className="text-sm text-gray-500 italic line-clamp-2">{r.description}</p>
                  )}

                  {/* Owner contact */}
                  <div className="border-t border-red-200 pt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {r.reporter?.full_name ?? "Anonymous"}
                      </span>
                    </div>
                    {(r.reporter?.phone || r.contact_phone) && (
                      <a
                        href={`tel:${r.reporter?.phone ?? r.contact_phone}`}
                        className="flex items-center gap-1 text-sm text-orange-600 font-medium hover:underline flex-shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {r.reporter?.phone ?? r.contact_phone}
                      </a>
                    )}
                  </div>

                  {r.reward_amount && r.reward_amount > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                      💰 Reward: ${r.reward_amount}
                    </Badge>
                  )}

                  <p className="text-xs text-gray-400">Reported {formatDate(r.created_at)}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reunited section */}
      {!loading && found.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-700 mt-4">Reunited 🎉</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {found.map(r => (
              <Card key={r.id} className="border border-green-200 bg-green-50">
                <CardContent className="py-3 flex items-center gap-3">
                  <PawPrint className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">{r.pet?.name ?? "Pet"}</p>
                    <p className="text-xs text-gray-500 capitalize">{r.pet?.species}</p>
                  </div>
                  <Badge className="ml-auto bg-green-100 text-green-700 capitalize">{r.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
