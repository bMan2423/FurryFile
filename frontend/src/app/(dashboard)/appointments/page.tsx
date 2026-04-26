"use client"
import dynamic from "next/dynamic"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar, Plus, X, MapPin, Loader2, Stethoscope,
  AlertCircle, CheckCircle2, Clock, Ban, PawPrint,
} from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"

const VetMap = dynamic(() => import("@/components/maps/VetMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
    </div>
  ),
})

interface Vet {
  id: string; name: string; lat: number; lon: number
  address?: string; phone?: string; source: "furryfile" | "osm"; bio?: string
}
interface Pet { id: string; name: string; species: string }
interface Appointment {
  id: string
  appointment_type: string
  status: string
  appointment_date?: string
  appointment_time?: string
  location?: string
  notes?: string
  cancellation_reason?: string
  pet_id: string
  pet_name?: string
  created_at: string
}

const STATUS_META: Record<string, { label: string; colour: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   colour: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",  icon: <Clock className="w-3 h-3" /> },
  confirmed: { label: "Confirmed", colour: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",          icon: <CheckCircle2 className="w-3 h-3" /> },
  completed: { label: "Completed", colour: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",      icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", colour: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",              icon: <Ban className="w-3 h-3" /> },
  no_show:   { label: "No Show",   colour: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",             icon: <AlertCircle className="w-3 h-3" /> },
}

const APPT_TYPE_LABELS: Record<string, string> = {
  vet_visit:    "Vet Visit",
  grooming:     "Grooming",
  consultation: "Consultation",
}

// ── Cancel Confirmation Modal ─────────────────────────────────────────────────
function CancelModal({
  appt,
  petName,
  onClose,
  onConfirm,
}: {
  appt: Appointment
  petName: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await onConfirm(reason)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Cancel Appointment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Appointment summary */}
        <div className="px-6 py-4 space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {APPT_TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
            </p>
            {petName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5" /> {petName}
              </p>
            )}
            {appt.appointment_date && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(appt.appointment_date)}
                {appt.appointment_time && ` at ${appt.appointment_time.slice(0, 5)}`}
              </p>
            )}
            {appt.location && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {appt.location}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-gray-700 dark:text-gray-300">
              Reason for cancellation <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              placeholder="e.g. Pet is feeling better, scheduling conflict…"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="resize-none dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <p className="text-xs text-gray-400">
            This action cannot be undone. The vet will be notified of the cancellation.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <Button
            variant="outline"
            className="flex-1 dark:border-gray-700 dark:text-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Keep Appointment
          </Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Appointment"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
  const user = useAuthStore(s => s.user)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [vets, setVets] = useState<Vet[]>([])
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locLoading, setLocLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apptLoading, setApptLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [radius, setRadius] = useState(10000)

  const [form, setForm] = useState({
    provider_id: "", pet_id: "", appointment_type: "vet_visit",
    appointment_date: "", appointment_time: "", location: "", notes: "",
  })

  useEffect(() => {
    Promise.all([api.get("/appointments"), api.get("/pets")])
      .then(([aRes, pRes]) => {
        setAppointments(aRes.data)
        setPets(pRes.data)
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setApptLoading(false))
  }, [])

  const fetchNearbyVets = useCallback(async (lat: number, lon: number, searchRadius = 10000) => {
    let ffVets: Vet[] = []
    try {
      const res = await api.get("/users/vets")
      ffVets = res.data
        .filter((v: any) => v.latitude && v.longitude)
        .map((v: any) => ({
          id: v.id, name: v.full_name, lat: v.latitude, lon: v.longitude,
          address: v.address, bio: v.bio, source: "furryfile" as const,
        }))
    } catch { /* non-fatal */ }

    let osmVets: Vet[] = []
    try {
      const query = `[out:json][timeout:15];
(
  node["amenity"="veterinary"](around:${searchRadius},${lat},${lon});
  way["amenity"="veterinary"](around:${searchRadius},${lat},${lon});
);
out center 40;`
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      const data = await res.json()
      osmVets = (data.elements ?? []).map((el: any) => ({
        id: `osm-${el.id}`,
        name: el.tags?.name || "Veterinary Clinic",
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ") || undefined,
        phone: el.tags?.phone || el.tags?.["contact:phone"],
        source: "osm" as const,
      })).filter((v: Vet) => v.lat && v.lon)
    } catch { /* non-fatal */ }

    setVets([...ffVets, ...osmVets])
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocLoading(false)
      toast.error("Geolocation not supported")
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        setUserPos([lat, lon])
        setLocLoading(false)
        fetchNearbyVets(lat, lon, radius)
      },
      () => {
        setLocLoading(false)
        setUserPos([6.9271, 79.8612])
        fetchNearbyVets(6.9271, 79.8612, radius)
      },
      { timeout: 8000 }
    )
  }, [fetchNearbyVets])

  function handleVetSelect(vet: Vet) {
    setForm(f => ({
      ...f,
      provider_id: vet.source === "furryfile" ? vet.id : "",
      location: vet.address || vet.name,
    }))
    if (vet.source !== "furryfile")
      toast("OSM clinic selected — location pre-filled.")
    setShowForm(true)
  }

  async function handleSubmit() {
    if (!form.pet_id)           return toast.error("Select a pet")
    if (!form.appointment_date) return toast.error("Select a date")
    if (!form.appointment_time) return toast.error("Select a time")

    setSubmitting(true)
    try {
      const payload: any = {
        pet_id: form.pet_id,
        appointment_type: form.appointment_type,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        location: form.location || undefined,
        notes:    form.notes   || undefined,
      }
      const ffVet = vets.find(v => v.source === "furryfile")
      payload.provider_id = form.provider_id || ffVet?.id || user?.id
      const res = await api.post("/appointments", payload)
      setAppointments(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({ provider_id: "", pet_id: "", appointment_type: "vet_visit", appointment_date: "", appointment_time: "", location: "", notes: "" })
      toast.success("Appointment booked!")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to book appointment")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(appt: Appointment, reason: string) {
    try {
      const res = await api.patch(`/appointments/${appt.id}/cancel`, { reason: reason || undefined })
      setAppointments(prev => prev.map(a => a.id === appt.id ? res.data : a))
      toast.success("Appointment cancelled")
      setCancelTarget(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel appointment")
    }
  }

  const ffVets = vets.filter(v => v.source === "furryfile")
  const petMap = Object.fromEntries(pets.map(p => [p.id, p]))

  const upcoming = appointments.filter(a => a.status === "pending" || a.status === "confirmed")
  const past     = appointments.filter(a => a.status !== "pending" && a.status !== "confirmed")

  return (
    <div className="space-y-6">
      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          appt={cancelTarget}
          petName={cancelTarget.pet_name || petMap[cancelTarget.pet_id]?.name || ""}
          onClose={() => setCancelTarget(null)}
          onConfirm={reason => handleCancel(cancelTarget, reason)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">Appointments</h1>
          <p className="text-gray-500 dark:text-gray-400">Book and manage vet appointments</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Close Form" : "Book Appointment"}
        </Button>
      </div>

      {/* Map */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 dark:text-gray-100">
            <MapPin className="w-4 h-4 text-orange-500" />
            Nearby Veterinary Clinics
            {locLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
            <span className="text-xs font-normal text-gray-400 ml-auto">
              {vets.length} clinic{vets.length !== 1 ? "s" : ""} · {radius / 1000} km radius
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {userPos ? (
            <VetMap center={userPos} vets={vets} onVetClick={handleVetSelect} radius={radius} />
          ) : (
            <div className="h-72 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Detecting your location…
            </div>
          )}

          {/* Radius slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8">1 km</span>
            <input
              type="range" min={1000} max={50000} step={1000}
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              onMouseUp={e => userPos && fetchNearbyVets(userPos[0], userPos[1], Number((e.target as HTMLInputElement).value))}
              onTouchEnd={e => userPos && fetchNearbyVets(userPos[0], userPos[1], Number((e.target as HTMLInputElement).value))}
              className="flex-1 accent-orange-500"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">50 km</span>
          </div>

          <p className="text-xs text-gray-400">
            🟠 FurryFile-registered vets &nbsp;|&nbsp; 🔵 OSM clinic &nbsp;|&nbsp;
            Click a marker to pre-fill the booking form.
          </p>
        </CardContent>
      </Card>

      {/* Booking Form */}
      {showForm && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg dark:text-gray-100">New Appointment</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pet */}
              <div className="space-y-1">
                <Label className="dark:text-gray-300">Pet *</Label>
                {pets.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">Add a pet first.</p>
                ) : (
                  <Select value={form.pet_id} onValueChange={v => setForm(f => ({ ...f, pet_id: v }))}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <span className="flex-1 text-left text-sm">
                        {form.pet_id
                          ? (() => { const p = pets.find(p => p.id === form.pet_id); return p ? `${p.name} (${p.species})` : "" })()
                          : <span className="text-gray-400">Select pet</span>}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {[...pets].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} <span className="text-gray-400 text-xs capitalize">({p.species})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label className="dark:text-gray-300">Appointment Type *</Label>
                <Select value={form.appointment_type} onValueChange={v => setForm(f => ({ ...f, appointment_type: v }))}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPT_TYPE_LABELS).map(([val, lbl]) => (
                      <SelectItem key={val} value={val}>{lbl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <Label className="dark:text-gray-300">Date *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.appointment_date}
                  onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Time */}
              <div className="space-y-1">
                <Label className="dark:text-gray-300">Time *</Label>
                <Input
                  type="time"
                  value={form.appointment_time}
                  onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* Location */}
              <div className="space-y-1 md:col-span-2">
                <Label className="dark:text-gray-300">Clinic / Location</Label>
                <Input
                  placeholder="Click a map marker to auto-fill, or type manually"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>

              {/* FurryFile Vet */}
              <div className="space-y-1 md:col-span-2">
                <Label className="dark:text-gray-300">
                  FurryFile Vet{" "}
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </Label>
                <Select value={form.provider_id} onValueChange={v => setForm(f => ({ ...f, provider_id: v }))}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <span className="flex-1 text-left text-sm">
                      {form.provider_id
                        ? (() => { const v = ffVets.find(v => v.id === form.provider_id); return v ? v.name : "" })()
                        : <span className="text-gray-400">Select a registered vet (optional)</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None / External clinic</SelectItem>
                    {[...ffVets].sort((a, b) => a.name.localeCompare(b.name)).map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3 h-3 text-blue-400" />
                          {v.name}
                          {v.address && <span className="text-gray-400 text-xs">· {v.address}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1 md:col-span-2">
                <Label className="dark:text-gray-300">Notes</Label>
                <Textarea
                  placeholder="Reason for visit, symptoms, special instructions…"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleSubmit}
                disabled={submitting || pets.length === 0}
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Booking…</> : "Book Appointment"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="dark:border-gray-600 dark:text-gray-300">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment List */}
      {apptLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No appointments yet — click a vet on the map to book one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.map(a => (
                <AppointmentCard
                  key={a.id}
                  appt={a}
                  petName={a.pet_name || petMap[a.pet_id]?.name}
                  onCancel={() => setCancelTarget(a)}
                />
              ))}
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Past ({past.length})
              </h2>
              {past.map(a => (
                <AppointmentCard
                  key={a.id}
                  appt={a}
                  petName={a.pet_name || petMap[a.pet_id]?.name}
                  onCancel={() => setCancelTarget(a)}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function AppointmentCard({
  appt,
  petName,
  onCancel,
}: {
  appt: Appointment
  petName?: string
  onCancel: () => void
}) {
  const meta   = STATUS_META[appt.status] ?? STATUS_META.pending
  const canCancel = appt.status === "pending" || appt.status === "confirmed"

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl mt-0.5 shrink-0">
            <Stethoscope className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {APPT_TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
              </p>
              <Badge className={`flex items-center gap-1 text-xs ${meta.colour}`}>
                {meta.icon}
                {meta.label}
              </Badge>
            </div>

            {petName && (
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <PawPrint className="w-3.5 h-3.5 text-orange-400" />
                {petName}
              </p>
            )}

            {appt.appointment_date && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(appt.appointment_date)}
                {appt.appointment_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {appt.appointment_time.slice(0, 5)}
                  </span>
                )}
              </p>
            )}

            {appt.location && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {appt.location}
              </p>
            )}

            {appt.notes && (
              <p className="text-xs text-gray-400 italic">{appt.notes}</p>
            )}

            {appt.status === "cancelled" && appt.cancellation_reason && (
              <p className="text-xs text-red-400 dark:text-red-500 flex items-center gap-1">
                <Ban className="w-3 h-3" /> {appt.cancellation_reason}
              </p>
            )}
          </div>

          {/* Cancel button */}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="shrink-0 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
