"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit2, Heart, PawPrint } from "lucide-react"
import api from "@/lib/api"
import { getAge } from "@/lib/utils"
import { toast } from "sonner"

export default function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>()
  const [pet, setPet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    api.get(`/pets/${petId}`)
      .then(r => setPet(r.data))
      .catch(() => toast.error("Pet not found"))
      .finally(() => setLoading(false))
  }, [petId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )
  if (!pet) return <div className="text-center py-16 text-gray-500">Pet not found</div>

  const photos = pet.photos ?? []
  const displayPhoto = photos[activePhoto] || photos.find((p: any) => p.is_primary)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/pets">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-gray-500 capitalize">
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}
          </p>
        </div>
        <Link href={`/pets/${petId}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" /> Edit
          </Button>
        </Link>
        <Link href={`/pets/${petId}/health`}>
          <Button variant="outline" className="gap-2">
            <Heart className="w-4 h-4" /> Health
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Photo card */}
        <Card>
          <div className="h-56 bg-orange-50 rounded-t-lg overflow-hidden">
            {displayPhoto ? (
              <img
                src={`http://65.21.153.206${displayPhoto.url}`}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <PawPrint className="w-20 h-20 text-orange-200" />
              </div>
            )}
          </div>
          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {photos.map((ph: any, i: number) => (
                <button
                  key={ph.id}
                  onClick={() => setActivePhoto(i)}
                  className={`w-14 h-14 rounded overflow-hidden border-2 flex-shrink-0 transition-all ${
                    i === activePhoto ? "border-orange-500" : "border-transparent"
                  }`}
                >
                  <img src={`http://65.21.153.206${ph.url}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <CardContent className="pt-3 pb-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{pet.species}</Badge>
              <Badge variant="outline" className="capitalize">{pet.gender}</Badge>
              {pet.is_neutered && <Badge className="bg-blue-100 text-blue-700">Neutered</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Name",      value: pet.name },
              { label: "Species",   value: pet.species },
              { label: "Breed",     value: pet.breed || "—" },
              { label: "Gender",    value: pet.gender },
              { label: "Age",       value: pet.date_of_birth ? getAge(pet.date_of_birth) : "—" },
              { label: "Weight",    value: pet.weight_kg ? `${pet.weight_kg} kg` : "—" },
              { label: "Color",     value: pet.color || "—" },
              { label: "Microchip", value: pet.microchip_id || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pet.description && (
        <Card>
          <CardHeader><CardTitle>About {pet.name}</CardTitle></CardHeader>
          <CardContent><p className="text-gray-600">{pet.description}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
