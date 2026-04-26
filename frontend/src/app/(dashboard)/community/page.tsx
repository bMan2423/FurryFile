"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Calendar, MapPin, X, Check, Clock, Globe } from "lucide-react"
import api from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"

interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  location_name?: string
  is_virtual: boolean
  status: string
  organizer_id?: string
}

const STATUS_LABELS: Record<string, string> = {
  upcoming:         "Upcoming",
  pending_approval: "Pending Approval",
  cancelled:        "Cancelled",
  completed:        "Completed",
}

const STATUS_COLOURS: Record<string, string> = {
  upcoming:         "bg-green-100 text-green-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  cancelled:        "bg-red-100 text-red-700",
  completed:        "bg-gray-100 text-gray-600",
}

export default function CommunityPage() {
  const user = useAuthStore(s => s.user)
  const isAdmin = (user as any)?.role === "admin"

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location_name: "",
    is_virtual: false,
  })

  const loadEvents = () => {
    setLoading(true)
    api.get("/community/events")
      .then(r => setEvents(r.data))
      .catch(() => toast.error("Failed to load events"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEvents() }, [])

  const rsvp = async (eventId: string) => {
    try {
      await api.post(`/community/events/${eventId}/rsvp`)
      toast.success("RSVP submitted!")
    } catch {
      toast.error("Failed to RSVP")
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.event_date) {
      toast.error("Title and date are required")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/community/events", form)
      toast.success(isAdmin ? "Event created!" : "Event submitted for admin approval")
      setShowForm(false)
      setForm({ title: "", description: "", event_date: "", location_name: "", is_virtual: false })
      loadEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create event")
    } finally {
      setSubmitting(false)
    }
  }

  const approveEvent = async (eventId: string) => {
    setActionLoading(eventId + "_approve")
    try {
      await api.patch(`/community/events/${eventId}/approve`)
      toast.success("Event approved")
      loadEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to approve")
    } finally {
      setActionLoading(null)
    }
  }

  const rejectEvent = async (eventId: string) => {
    setActionLoading(eventId + "_reject")
    try {
      await api.patch(`/community/events/${eventId}/reject`)
      toast.success("Event rejected")
      loadEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reject")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-gray-500">Events, volunteering and more</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowForm(v => !v)}>
          {showForm ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><Plus className="w-4 h-4 mr-2" />Create Event</>}
        </Button>
      </div>

      {/* ── Create Event Form ── */}
      {showForm && (
        <Card className="border-orange-200">
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-lg">
              {isAdmin ? "Create Event" : "Submit Event for Approval"}
            </h2>
            {!isAdmin && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <Clock className="w-4 h-4 shrink-0" />
                Your event will be reviewed by an admin before it becomes visible to other users.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <Label>Title *</Label>
                <Input
                  placeholder="Event title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your event…"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  placeholder="Venue name or address"
                  value={form.location_name}
                  onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_virtual"
                  checked={form.is_virtual}
                  onChange={e => setForm(f => ({ ...f, is_virtual: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_virtual" className="cursor-pointer font-normal">
                  This is a virtual event
                </Label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Submitting…" : isAdmin ? "Create Event" : "Submit for Approval"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Admin: Pending Events ── */}
      {isAdmin && events.filter(e => e.status === "pending_approval").length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-yellow-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Approval ({events.filter(e => e.status === "pending_approval").length})
          </h2>
          {events.filter(e => e.status === "pending_approval").map(e => (
            <Card key={e.id} className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{e.title}</h3>
                      {e.is_virtual && <Badge className="bg-purple-100 text-purple-700 text-xs">Virtual</Badge>}
                    </div>
                    {e.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{e.description}</p>}
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDateTime(e.event_date)}
                      </p>
                      {e.location_name && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{e.location_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white gap-1"
                      disabled={actionLoading === e.id + "_approve"}
                      onClick={() => approveEvent(e.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {actionLoading === e.id + "_approve" ? "…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50 gap-1"
                      disabled={actionLoading === e.id + "_reject"}
                      onClick={() => rejectEvent(e.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                      {actionLoading === e.id + "_reject" ? "…" : "Reject"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Event List ── */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : events.filter(e => e.status !== "pending_approval").length === 0 && events.filter(e => e.status === "pending_approval").length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming events</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to create one!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Non-admin: show pending badge for events they submitted */}
          {!isAdmin && events.filter(e => e.status === "pending_approval").length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-yellow-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Your Pending Events
              </h2>
              {events.filter(e => e.status === "pending_approval").map(e => (
                <Card key={e.id} className="border-yellow-200 bg-yellow-50 opacity-80">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{e.title}</h3>
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                        <Clock className="w-3 h-3 mr-1" />Awaiting Approval
                      </Badge>
                    </div>
                    {e.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{e.description}</p>}
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{formatDateTime(e.event_date)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Upcoming approved events */}
          {events.filter(e => e.status === "upcoming").length > 0 && (
            <div className="space-y-3">
              {!isAdmin && <h2 className="font-semibold text-gray-700">Upcoming Events</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.filter(e => e.status === "upcoming").map(e => (
                  <Card key={e.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{e.title}</h3>
                        <div className="flex gap-1">
                          {e.is_virtual && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              <Globe className="w-3 h-3 mr-1" />Virtual
                            </Badge>
                          )}
                        </div>
                      </div>
                      {e.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{e.description}</p>}
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatDateTime(e.event_date)}
                        </p>
                        {e.location_name && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{e.location_name}
                          </p>
                        )}
                      </div>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => rsvp(e.id)}>
                        RSVP
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
