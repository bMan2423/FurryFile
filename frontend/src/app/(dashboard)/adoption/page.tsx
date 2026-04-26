"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, X, Users, Phone, User, MessageSquare } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"

interface Application {
  id: string
  applicant_name: string | null
  applicant_phone: string | null
  motivation: string
  living_situation: string | null
  has_other_pets: boolean | null
  experience: string | null
  status: string
  created_at: string
}

export default function AdoptionPage() {
  const [listings, setListings]           = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [applyingTo, setApplyingTo]       = useState<any | null>(null)
  const [motivation, setMotivation]       = useState("")
  const [submitting, setSubmitting]       = useState(false)
  const [viewingApps, setViewingApps]     = useState<any | null>(null)
  const [applications, setApplications]   = useState<Application[]>([])
  const [appsLoading, setAppsLoading]     = useState(false)
  const user = useAuthStore(s => s.user)
  const isShelter = user?.role === "shelter"

  useEffect(() => {
    api.get("/adoption")
      .then(r => setListings(r.data))
      .catch(() => toast.error("Failed to load listings"))
      .finally(() => setLoading(false))
  }, [])

  async function handleApply() {
    if (!applyingTo || !motivation.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/adoption/${applyingTo.id}/apply`, { motivation: motivation.trim() })
      toast.success("Application submitted!")
      setApplyingTo(null)
      setMotivation("")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  async function viewApplications(listing: any) {
    setViewingApps(listing)
    setApplications([])
    setAppsLoading(true)
    try {
      const res = await api.get(`/adoption/${listing.id}/applications`)
      setApplications(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to load applications")
    } finally {
      setAppsLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    adopted:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    closed:    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
  }

  const appStatusColors: Record<string, string> = {
    submitted:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    under_review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    approved:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    rejected:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-gray-100">Adoption Center</h1>
        <p className="text-gray-500 dark:text-gray-400">Find your perfect companion</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No adoption listings yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l: any) => (
            <Card key={l.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg dark:text-gray-100">{l.title}</h3>
                  <Badge className={statusColors[l.status] || ""}>{l.status}</Badge>
                </div>
                {l.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{l.description}</p>
                )}
                {l.requirements && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 mb-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">{l.requirements}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Listed {formatDate(l.created_at)}</p>
                  {l.fee_amount > 0
                    ? <p className="text-orange-600 font-medium">${l.fee_amount} fee</p>
                    : <Badge className="bg-green-100 text-green-700 text-xs dark:bg-green-900/40 dark:text-green-400">Free</Badge>
                  }
                </div>
                {isShelter ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    size="sm"
                    onClick={() => viewApplications(l)}
                  >
                    <Users className="w-4 h-4" /> View Applications
                  </Button>
                ) : (
                  l.status === "available" && (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="sm"
                      onClick={() => { setApplyingTo(l); setMotivation("") }}
                    >
                      <Heart className="w-4 h-4 mr-2" /> Apply to Adopt
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Apply modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-gray-100">Apply to Adopt</h2>
              <button onClick={() => setApplyingTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Applying for: <span className="font-medium dark:text-gray-200">{applyingTo.title}</span>
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Why do you want to adopt this pet? <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={4}
              placeholder="Tell us about yourself and why you'd be a great match..."
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-300" onClick={() => setApplyingTo(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleApply} disabled={submitting || !motivation.trim()}>
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Applications viewer (shelter only) */}
      {viewingApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold dark:text-gray-100">Applications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewingApps.title}</p>
              </div>
              <button onClick={() => setViewingApps(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              {appsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No applications yet</p>
                </div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm dark:text-gray-100">{app.applicant_name ?? "Unknown"}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(app.created_at)}</p>
                        </div>
                      </div>
                      <Badge className={appStatusColors[app.status] || ""}>{app.status.replace("_", " ")}</Badge>
                    </div>

                    {app.applicant_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{app.applicant_phone}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{app.motivation}</p>
                    </div>

                    {app.living_situation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Living: {app.living_situation}</p>
                    )}
                    {app.has_other_pets !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Other pets: {app.has_other_pets ? "Yes" : "No"}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
