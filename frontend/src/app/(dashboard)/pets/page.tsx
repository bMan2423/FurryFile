"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, PawPrint, Edit2, Heart, AlertTriangle, CheckCircle2, HandHeart } from "lucide-react"
import api from "@/lib/api"
import { getAge } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { ROLES } from "@/lib/constants"

interface Pet {
  id: string; name: string; species: string; breed?: string
  gender: string; date_of_birth?: string; is_neutered: boolean
  photos: { id: string; url: string; is_primary: boolean }[]
}

export default function PetsPage() {
  const user = useAuthStore(s => s.user)
  const isShelter = user?.role === ROLES.SHELTER

  const [pets, setPets]                 = useState<Pet[]>([])
  const [missingIds, setMissingIds]     = useState<Set<string>>(new Set())
  const [missingReportMap, setMissingReportMap] = useState<Record<string, string>>({})
  const [adoptionPetIds, setAdoptionPetIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)
  const [reporting, setReporting]       = useState<string | null>(null)
  const [markingFound, setMarkingFound] = useState<string | null>(null)
  const [listingForAdoption, setListingForAdoption] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get("/pets"),
      api.get("/missing-pets?status=missing"),
      api.get("/adoption"),
    ]).then(([petsRes, missingRes, adoptionRes]) => {
      setPets(petsRes.data)
      const ids = new Set<string>(missingRes.data.map((r: any) => r.pet_id))
      setMissingIds(ids)
      const rm: Record<string, string> = {}
      missingRes.data.forEach((r: any) => { rm[r.pet_id] = r.id })
      setMissingReportMap(rm)
      const adoptedIds = new Set<string>(
        adoptionRes.data.filter((r: any) => r.pet_id).map((r: any) => r.pet_id)
      )
      setAdoptionPetIds(adoptedIds)
    }).catch(() => toast.error("Failed to load pets"))
      .finally(() => setLoading(false))
  }, [])

  async function reportMissing(pet: Pet) {
    setReporting(pet.id)
    try {
      const res = await api.post("/missing-pets", {
        pet_id:       pet.id,
        last_seen_at: new Date().toISOString(),
        description:  `${pet.name} is missing. Please contact owner if found.`,
      })
      toast.success(`${pet.name} reported as missing`)
      setMissingIds(prev => new Set(prev).add(pet.id))
      setMissingReportMap(prev => ({ ...prev, [pet.id]: res.data.id }))
      window.location.href = "/missing"
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to report missing")
    } finally {
      setReporting(null)
    }
  }

  async function markAsFound(pet: Pet) {
    const reportId = missingReportMap[pet.id]
    if (!reportId) return
    setMarkingFound(pet.id)
    try {
      await api.patch(`/missing-pets/${reportId}`, { status: "reunited" })
      toast.success(`${pet.name} marked as found!`)
      setMissingIds(prev => { const next = new Set(prev); next.delete(pet.id); return next })
      setMissingReportMap(prev => { const next = { ...prev }; delete next[pet.id]; return next })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update status")
    } finally {
      setMarkingFound(null)
    }
  }

  async function putForAdoption(pet: Pet) {
    setListingForAdoption(pet.id)
    try {
      const ageYears = pet.date_of_birth
        ? Math.floor((Date.now() - new Date(pet.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
        : undefined
      await api.post("/adoption", {
        title:       `${pet.name} is available for adoption`,
        description: `${pet.species}${pet.breed ? ` · ${pet.breed}` : ""}. ${pet.is_neutered ? "Neutered. " : ""}Looking for a loving home.`,
        pet_id:      pet.id,
        age_years:   ageYears,
        fee_amount:  0,
      })
      toast.success(`${pet.name} listed for adoption!`)
      setAdoptionPetIds(prev => new Set(prev).add(pet.id))
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to list for adoption")
    } finally {
      setListingForAdoption(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">{isShelter ? "Shelter Pets" : "My Pets"}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isShelter
              ? `${pets.length} pet${pets.length !== 1 ? "s" : ""} in your shelter`
              : `${pets.length} pet${pets.length !== 1 ? "s" : ""} registered`}
          </p>
        </div>
        <Link href="/pets/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Add Pet
          </Button>
        </Link>
      </div>

      {pets.length === 0 ? (
        <Card className="text-center py-16 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <PawPrint className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isShelter ? "No pets in shelter yet" : "No pets yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {isShelter ? "Register your first pet into the shelter" : "Add your first pet to get started"}
            </p>
            <Link href="/pets/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                {isShelter ? "Add First Shelter Pet" : "Add Your First Pet"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => {
            const primary   = pet.photos?.find(p => p.is_primary) ?? pet.photos?.[0]
            const isMissing = missingIds.has(pet.id)
            return (
              <Card
                key={pet.id}
                className={`hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 ${isMissing ? "border-red-300 dark:border-red-700" : ""}`}
              >
                {/* Photo + edit overlay */}
                <div className="h-40 bg-orange-50 dark:bg-gray-700 rounded-t-lg overflow-hidden relative">
                  {primary
                    ? <img src={`http://65.21.153.206${primary.url}`} alt={pet.name} className="w-full h-full object-cover" />
                    : <div className="h-full flex items-center justify-center"><PawPrint className="w-16 h-16 text-orange-200" /></div>
                  }
                  {isMissing && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/85 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> MISSING
                    </div>
                  )}
                  <Link href={`/pets/${pet.id}/edit`}>
                    <button className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow text-gray-600 hover:text-orange-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>

                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg dark:text-gray-100">{pet.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                        {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="capitalize text-xs dark:border-gray-600 dark:text-gray-300">{pet.gender}</Badge>
                      {isMissing && (
                        <Badge className="bg-red-100 text-red-600 border border-red-300 text-xs dark:bg-red-900/40 dark:text-red-400 dark:border-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />Missing
                        </Badge>
                      )}
                    </div>
                  </div>
                  {pet.date_of_birth && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Age: {getAge(pet.date_of_birth)}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/pets/${pet.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">View</Button>
                    </Link>
                    <Link href={`/pets/${pet.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        <Edit2 className="w-3 h-3" /> Edit
                      </Button>
                    </Link>
                    {!isShelter && (
                      <Link href={`/pets/${pet.id}/health`}>
                        <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                          <Heart className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}

                    {isShelter && (
                      adoptionPetIds.has(pet.id) ? (
                        <Button
                          variant="outline" size="sm"
                          className="text-teal-600 border-teal-300 bg-teal-50 cursor-not-allowed gap-1 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                          disabled
                        >
                          <HandHeart className="w-3.5 h-3.5" /> Listed
                        </Button>
                      ) : (
                        <Button
                          variant="outline" size="sm"
                          className="text-teal-600 border-teal-300 hover:bg-teal-50 hover:border-teal-500 gap-1 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950"
                          disabled={listingForAdoption === pet.id}
                          onClick={() => putForAdoption(pet)}
                          title="List this pet for adoption"
                        >
                          <HandHeart className="w-3.5 h-3.5" />
                          {listingForAdoption === pet.id ? "…" : "Adopt"}
                        </Button>
                      )
                    )}

                    {isMissing ? (
                      <>
                        {/* Disabled "Missing" indicator button */}
                        <Button
                          variant="outline" size="sm"
                          className="text-red-400 border-red-200 bg-red-50 cursor-not-allowed gap-1 dark:border-red-800 dark:bg-red-950/40 dark:text-red-500"
                          disabled
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Missing
                        </Button>
                        {/* "Found" button — only visible when pet is missing */}
                        <Button
                          variant="outline" size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 gap-1 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                          disabled={markingFound === pet.id}
                          onClick={() => markAsFound(pet)}
                          title="Mark this pet as found/reunited"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {markingFound === pet.id ? "…" : "Found"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline" size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 gap-1 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        disabled={reporting === pet.id}
                        onClick={() => reportMissing(pet)}
                        title="Report this pet as missing"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {reporting === pet.id ? "…" : "Missing"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
