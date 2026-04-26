"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  BookOpen, Plus, X, User, Calendar, DollarSign,
  Home, Sun, Dog, Scissors, GraduationCap, ChevronDown,
} from "lucide-react"
import api from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { BOOKING_SERVICES, BOOKING_SERVICE_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface Sitter { id: string; full_name: string; bio?: string }
interface Pet    { id: string; name: string; species: string }
interface Booking {
  id: string; service_type: string; start_datetime: string; end_datetime: string
  status: string; total_price?: number; owner_notes?: string
}

// ── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; badge: string; border: string }> = {
  pending:     { label: "Pending",     badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300", border: "border-l-yellow-400 dark:border-l-yellow-500" },
  confirmed:   { label: "Confirmed",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",         border: "border-l-blue-400 dark:border-l-blue-500" },
  in_progress: { label: "In Progress", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300", border: "border-l-purple-400 dark:border-l-purple-500" },
  completed:   { label: "Completed",   badge: "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300",     border: "border-l-green-400 dark:border-l-green-500" },
  cancelled:   { label: "Cancelled",   badge: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",             border: "border-l-red-400 dark:border-l-red-500" },
}

// ── Service icon config ────────────────────────────────────────────
const SERVICE_CONFIG: Record<string, { icon: React.ElementType; bg: string; iconColor: string }> = {
  boarding:    { icon: Home,           bg: "bg-blue-100 dark:bg-blue-900",   iconColor: "text-blue-600 dark:text-blue-400" },
  day_care:    { icon: Sun,            bg: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600 dark:text-green-400" },
  dog_walking: { icon: BookOpen,       bg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600 dark:text-orange-400" },
  drop_in:     { icon: Calendar,       bg: "bg-teal-100 dark:bg-teal-900",   iconColor: "text-teal-600 dark:text-teal-400" },
  grooming:    { icon: Scissors,       bg: "bg-purple-100 dark:bg-purple-900", iconColor: "text-purple-600 dark:text-purple-400" },
  training:    { icon: GraduationCap,  bg: "bg-pink-100 dark:bg-pink-900",   iconColor: "text-pink-600 dark:text-pink-400" },
}

function getServiceConfig(serviceType: string) {
  return SERVICE_CONFIG[serviceType] ?? { icon: BookOpen, bg: "bg-gray-100 dark:bg-gray-700", iconColor: "text-gray-500 dark:text-gray-400" }
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300", border: "border-l-gray-300 dark:border-l-gray-600" }
}

// ── Main Page ─────────────────────────────────────────────────────
export default function BookingsPage() {
  const user      = useAuthStore(s => s.user)
  const [bookings,   setBookings]   = useState<Booking[]>([])
  const [sitters,    setSitters]    = useState<Sitter[]>([])
  const [pets,       setPets]       = useState<Pet[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    sitter_id: "", pet_id: "", service_type: "boarding",
    start_datetime: "", end_datetime: "", total_price: "", owner_notes: "",
  })

  useEffect(() => {
    Promise.all([api.get("/bookings"), api.get("/users/sitters"), api.get("/pets")])
      .then(([b, s, p]) => { setBookings(b.data); setSitters(s.data); setPets(p.data) })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false))
  }, [])

  const isSitter = user?.role === "pet_sitter"

  const handleSubmit = async () => {
    if (!form.sitter_id)      return toast.error("Select a sitter")
    if (!form.pet_id)         return toast.error("Select a pet")
    if (!form.start_datetime) return toast.error("Set a start date/time")
    if (!form.end_datetime)   return toast.error("Set an end date/time")
    if (new Date(form.end_datetime) <= new Date(form.start_datetime))
      return toast.error("End must be after start")

    setSubmitting(true)
    try {
      const res = await api.post("/bookings", {
        sitter_id:      form.sitter_id,
        pet_id:         form.pet_id,
        service_type:   form.service_type,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime:   new Date(form.end_datetime).toISOString(),
        total_price:    form.total_price ? parseFloat(form.total_price) : undefined,
        owner_notes:    form.owner_notes || undefined,
      })
      setBookings(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ sitter_id:"", pet_id:"", service_type:"boarding", start_datetime:"", end_datetime:"", total_price:"", owner_notes:"" })
      toast.success("Booking request sent!")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create booking")
    } finally { setSubmitting(false) }
  }

  const patchStatus = async (id: string, action: "confirm" | "complete") => {
    try {
      const res = await api.patch(`/bookings/${id}/${action}`)
      setBookings(prev => prev.map(b => b.id === id ? res.data : b))
      toast.success(`Booking ${action === "confirm" ? "confirmed" : "completed"}`)
    } catch { toast.error("Action failed") }
  }

  const cancelBooking = async (id: string) => {
    try {
      await api.delete(`/bookings/${id}`)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b))
      toast.success("Booking cancelled")
    } catch { toast.error("Cancel failed") }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
            {!loading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {bookings.length} total
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSitter ? "Manage your incoming booking requests" : "Your pet service bookings"}
          </p>
        </div>
        {!isSitter && (
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 flex-shrink-0"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm
              ? <><X className="w-4 h-4" /> Cancel</>
              : <><Plus className="w-4 h-4" /> New Booking</>
            }
          </Button>
        )}
      </div>

      {/* ── New Booking Form ── */}
      {showForm && (
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-md">
          <CardContent className="pt-6 pb-6">
            {/* Form header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">New Booking</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fill in the details to request a pet care service</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section: Who & What */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Service Details</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sitter */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sitter *</Label>
                  {sitters.length === 0
                    ? <p className="text-sm text-gray-400 italic py-2">No sitters registered yet.</p>
                    : <Select value={form.sitter_id} onValueChange={v => setForm(f => ({ ...f, sitter_id: v }))}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Select a sitter" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...sitters].sort((a,b) => a.full_name.localeCompare(b.full_name)).map(s => (
                            <SelectItem key={s.id} value={s.id} textValue={s.full_name}>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-gray-400" />
                                <span>{s.full_name}</span>
                                {s.bio && <span className="text-gray-400 text-xs truncate max-w-[100px]">· {s.bio}</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  }
                </div>

                {/* Pet */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pet *</Label>
                  {pets.length === 0
                    ? <p className="text-sm text-gray-400 italic py-2">Add a pet first.</p>
                    : <Select value={form.pet_id} onValueChange={v => setForm(f => ({ ...f, pet_id: v }))}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Select your pet" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...pets].sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                            <SelectItem key={p.id} value={p.id} textValue={p.name}>
                              <span>{p.name}</span>
                              <span className="text-gray-400 capitalize text-xs ml-1">({p.species})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  }
                </div>

                {/* Service type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Service *</Label>
                  <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOKING_SERVICES.map(s => (
                        <SelectItem key={s} value={s} textValue={BOOKING_SERVICE_LABELS[s] ?? s}>
                          {BOOKING_SERVICE_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: When & Price */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Schedule & Pricing</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date &amp; Time *</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_datetime}
                    onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date &amp; Time *</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_datetime}
                    onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agreed Price ($)
                    <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal text-xs">optional</span>
                  </Label>
                  <Input
                    type="number" min="0" step="0.01" placeholder="e.g. 50.00"
                    value={form.total_price}
                    onChange={e => setForm(f => ({ ...f, total_price: e.target.value }))}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Additional Info</p>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes for Sitter</Label>
                <Textarea
                  placeholder="Feeding schedule, medication, special instructions…"
                  rows={3}
                  value={form.owner_notes}
                  onChange={e => setForm(f => ({ ...f, owner_notes: e.target.value }))}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSubmit}
                disabled={submitting || sitters.length === 0 || pets.length === 0}
              >
                {submitting ? "Sending…" : "Send Booking Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Booking List ── */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : bookings.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-5 shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No bookings yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            {isSitter
              ? "You haven't received any booking requests yet."
              : "Book a sitter to get your pet care journey started."}
          </p>
          {!isSitter && (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Make a Booking
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const svc    = getServiceConfig(b.service_type)
            const status = getStatusConfig(b.status)
            const SvcIcon = svc.icon
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-stretch bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden",
                  "border-l-4", status.border
                )}
              >
                {/* Left: service icon */}
                <div className="flex items-center justify-center px-5 py-4 flex-shrink-0">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", svc.bg)}>
                    <SvcIcon className={cn("w-6 h-6", svc.iconColor)} />
                  </div>
                </div>

                {/* Center: details */}
                <div className="flex-1 py-4 pr-4 min-w-0 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                    {BOOKING_SERVICE_LABELS[b.service_type] ?? b.service_type.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatDateTime(b.start_datetime)}</span>
                    <span className="text-gray-300 dark:text-gray-600">→</span>
                    <span>{formatDateTime(b.end_datetime)}</span>
                  </div>
                  {b.total_price != null && (
                    <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{b.total_price.toFixed(2)}</span>
                    </div>
                  )}
                  {b.owner_notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate">{b.owner_notes}</p>
                  )}
                </div>

                {/* Right: status + actions */}
                <div className="flex flex-col items-end justify-center gap-2 px-4 py-4 flex-shrink-0">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", status.badge)}>
                    {status.label}
                  </span>
                  {isSitter && b.status === "pending" && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white h-7 text-xs px-3"
                      onClick={() => patchStatus(b.id, "confirm")}
                    >
                      Confirm
                    </Button>
                  )}
                  {isSitter && b.status === "confirmed" && (
                    <Button
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white h-7 text-xs px-3"
                      onClick={() => patchStatus(b.id, "complete")}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {!isSitter && (b.status === "pending" || b.status === "confirmed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950 gap-1"
                      onClick={() => cancelBooking(b.id)}
                    >
                      <X className="w-3 h-3" /> Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
