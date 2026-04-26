"use client"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, X, ImagePlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import api from "@/lib/api"
import { SPECIES_OPTIONS, GENDER_OPTIONS, BREEDS_BY_SPECIES } from "@/lib/constants"

const schema = z.object({
  name:         z.string().min(1, "Name is required"),
  species:      z.string().min(1, "Species is required"),
  breed:        z.string().optional(),
  customBreed:  z.string().optional(),
  gender:       z.string().optional(),
  date_of_birth:z.string().optional(),
  weight_kg:    z.number().optional(),
  microchip_id: z.string().optional(),
  is_neutered:  z.boolean().default(false),
  color:        z.string().optional(),
  description:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function EditPetPage() {
  const { petId } = useParams<{ petId: string }>()
  const router = useRouter()
  const [loading, setLoading]           = useState(false)
  const [petLoading, setPetLoading]     = useState(true)
  const [selectedSpecies, setSelectedSpecies] = useState("")
  const [selectedBreed, setSelectedBreed]     = useState("")
  const [isCustomBreed, setIsCustomBreed]     = useState(false)
  const [showAddSpecies, setShowAddSpecies]   = useState(false)
  const [newSpeciesName, setNewSpeciesName]   = useState("")
  const [extraSpecies, setExtraSpecies]       = useState<string[]>([])
  // Existing + new photos
  const [existingPhotos, setExistingPhotos]   = useState<any[]>([])
  const [newPhotos, setNewPhotos]             = useState<File[]>([])
  const [newPreviews, setNewPreviews]         = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  // ── Load pet data ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/pets/${petId}`)
      .then(res => {
        const p = res.data
        setSelectedSpecies(p.species ?? "")
        const existingBreed = p.breed ?? ""
        const knownBreeds = BREEDS_BY_SPECIES[p.species] ?? []
        if (existingBreed && !knownBreeds.includes(existingBreed)) {
          setSelectedBreed("Other (type manually)")
          setIsCustomBreed(true)
        } else {
          setSelectedBreed(existingBreed)
        }
        setExistingPhotos(p.photos ?? [])
        reset({
          name:          p.name,
          species:       p.species,
          breed:         knownBreeds.includes(existingBreed) ? existingBreed : "",
          customBreed:   !knownBreeds.includes(existingBreed) ? existingBreed : "",
          gender:        p.gender,
          date_of_birth: p.date_of_birth ?? "",
          weight_kg:     p.weight_kg ?? undefined,
          microchip_id:  p.microchip_id ?? "",
          is_neutered:   p.is_neutered ?? false,
          color:         p.color ?? "",
          description:   p.description ?? "",
        })
      })
      .catch(() => toast.error("Failed to load pet"))
      .finally(() => setPetLoading(false))
  }, [petId, reset])

  const allSpecies = [...SPECIES_OPTIONS.filter(s => s !== "other"), ...extraSpecies, "other"]
  const breeds = selectedSpecies
    ? [...(BREEDS_BY_SPECIES[selectedSpecies] ?? []).sort(), "Other (type manually)"]
    : []

  function handleSpeciesChange(val: string) {
    setSelectedSpecies(val)
    setSelectedBreed("")
    setIsCustomBreed(false)
    setValue("species", val)
    setValue("breed", "")
    setValue("customBreed", "")
  }

  function handleBreedChange(val: string) {
    setSelectedBreed(val)
    if (val === "Other (type manually)") {
      setIsCustomBreed(true)
      setValue("breed", "")
    } else {
      setIsCustomBreed(false)
      setValue("breed", val)
    }
  }

  function handleAddSpecies() {
    const trimmed = newSpeciesName.trim().toLowerCase()
    if (!trimmed) return
    if (![...SPECIES_OPTIONS, ...extraSpecies].includes(trimmed)) {
      setExtraSpecies(prev => [...prev, trimmed])
    }
    setNewSpeciesName("")
    setShowAddSpecies(false)
    handleSpeciesChange(trimmed)
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const total = existingPhotos.length + newPhotos.length + files.length
    if (total > 5) { toast.error("Maximum 5 photos"); return }
    setNewPhotos(prev => [...prev, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeNewPhoto(idx: number) {
    setNewPhotos(prev => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function deleteExistingPhoto(photoId: string) {
    try {
      await api.delete(`/pets/${petId}/photos/${photoId}`)
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
      toast.success("Photo deleted")
    } catch { toast.error("Failed to delete photo") }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const breedValue = isCustomBreed ? (data.customBreed || "") : (data.breed || "")
      await api.patch(`/pets/${petId}`, {
        name:          data.name,
        species:       data.species,
        breed:         breedValue || undefined,
        gender:        data.gender,
        date_of_birth: data.date_of_birth || undefined,
        weight_kg:     data.weight_kg,
        microchip_id:  data.microchip_id || undefined,
        is_neutered:   data.is_neutered,
        color:         data.color || undefined,
        description:   data.description || undefined,
      })

      // Upload any new photos
      for (let i = 0; i < newPhotos.length; i++) {
        const fd = new FormData()
        fd.append("file", newPhotos[i])
        fd.append("is_primary", (existingPhotos.length === 0 && i === 0) ? "true" : "false")
        await api.post(`/pets/${petId}/photos`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      toast.success("Pet updated!")
      router.push(`/pets/${petId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update pet")
    } finally {
      setLoading(false)
    }
  }

  if (petLoading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/pets/${petId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Pet</h1>
          <p className="text-gray-500">Update your pet&apos;s details</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Name + Species */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Species *</Label>
                  <button type="button" onClick={() => setShowAddSpecies(v => !v)}
                    className="text-xs text-orange-500 hover:underline">+ Add species</button>
                </div>
                {showAddSpecies && (
                  <div className="flex gap-2 mb-1">
                    <Input placeholder="e.g. Hamster" value={newSpeciesName}
                      onChange={e => setNewSpeciesName(e.target.value)} className="h-8 text-sm"
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddSpecies())} />
                    <Button type="button" size="sm" className="h-8 bg-orange-500 hover:bg-orange-600" onClick={handleAddSpecies}>Add</Button>
                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setShowAddSpecies(false)}>✕</Button>
                  </div>
                )}
                <Controller control={control} name="species" render={({ field }) => (
                  <Select onValueChange={handleSpeciesChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                    <SelectContent>
                      {allSpecies.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {/* Breed + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Breed</Label>
                {breeds.length > 0 ? (
                  <Select onValueChange={handleBreedChange} value={selectedBreed}>
                    <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                    <SelectContent>
                      {breeds.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input placeholder={selectedSpecies ? "Type breed" : "Select species first"}
                    {...register("breed")} disabled={!selectedSpecies} />
                )}
                {isCustomBreed && (
                  <Input placeholder="Type breed name" {...register("customBreed")} className="mt-1" autoFocus />
                )}
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Controller control={control} name="gender" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {[...GENDER_OPTIONS].sort().map(g => (
                        <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {/* DOB + Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" {...register("date_of_birth")} />
              </div>
              <div className="space-y-1">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" {...register("weight_kg", { valueAsNumber: true })} />
              </div>
            </div>

            {/* Microchip + Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Microchip ID</Label>
                <Input {...register("microchip_id")} />
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <Input {...register("color")} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Controller control={control} name="is_neutered" render={({ field }) => (
                <Checkbox id="neutered" checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <Label htmlFor="neutered">Neutered / Spayed</Label>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea {...register("description")} rows={3} />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Photos <span className="text-gray-400 text-xs font-normal">(max 5)</span></Label>

              {/* Existing photos */}
              {existingPhotos.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {existingPhotos.map((ph, i) => (
                    <div key={ph.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img src={`http://65.21.153.206${ph.url}`} alt="" className="w-full h-full object-cover" />
                      {ph.is_primary && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-orange-500 text-white py-0.5">Primary</span>
                      )}
                      <button type="button" onClick={() => deleteExistingPhoto(ph.id)}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New photo previews */}
              {newPreviews.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-dashed border-orange-300">
                      <Image src={src} alt="" fill className="object-cover" />
                      <button type="button" onClick={() => removeNewPhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(existingPhotos.length + newPhotos.length) < 5 && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors w-full justify-center">
                    <ImagePlus className="w-4 h-4" /> Add more photos
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? "Saving…" : "Save Changes"}
              </Button>
              <Link href={`/pets/${petId}`}><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
