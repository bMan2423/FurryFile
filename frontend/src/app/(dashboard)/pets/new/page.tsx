"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
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
import api from "@/lib/api"
import { SPECIES_OPTIONS, GENDER_OPTIONS, BREEDS_BY_SPECIES } from "@/lib/constants"
import { ArrowLeft, Upload, X, ImagePlus, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  customBreed: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  weight_kg: z.number().optional(),
  microchip_id: z.string().optional(),
  is_neutered: z.boolean().default(false),
  color: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewPetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState("")
  const [selectedBreed, setSelectedBreed] = useState("")
  const [isCustomBreed, setIsCustomBreed] = useState(false)
  const [customSpecies, setCustomSpecies] = useState("")
  const [showAddSpecies, setShowAddSpecies] = useState(false)
  const [newSpeciesName, setNewSpeciesName] = useState("")
  const [extraSpecies, setExtraSpecies] = useState<string[]>([])
  // Photo upload state
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const allSpecies = [...SPECIES_OPTIONS.filter(s => s !== "other"), ...extraSpecies, "other"]
  const breeds = selectedSpecies ? [...(BREEDS_BY_SPECIES[selectedSpecies] ?? []), "Other (type manually)"] : []

  /** Handle species selection — reset breed when species changes */
  function handleSpeciesChange(val: string) {
    setSelectedSpecies(val)
    setSelectedBreed("")
    setIsCustomBreed(false)
    setValue("species", val)
    setValue("breed", "")
    setValue("customBreed", "")
  }

  /** Handle breed selection */
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

  /** Add a new species to the local master list */
  function handleAddSpecies() {
    const trimmed = newSpeciesName.trim()
    if (!trimmed) return
    if (![...SPECIES_OPTIONS, ...extraSpecies].includes(trimmed.toLowerCase())) {
      setExtraSpecies(prev => [...prev, trimmed.toLowerCase()])
      // Add empty breed list for new species
    }
    setNewSpeciesName("")
    setShowAddSpecies(false)
    handleSpeciesChange(trimmed.toLowerCase())
  }

  /** Handle photo file selection */
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed")
      return
    }
    setPhotos(prev => [...prev, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotoPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  /** Remove a photo from the queue */
  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // 1. Resolve breed value
      const breedValue = isCustomBreed ? (data.customBreed || "") : (data.breed || "")
      const payload = {
        name: data.name,
        species: data.species,
        breed: breedValue || undefined,
        gender: data.gender,
        date_of_birth: data.date_of_birth || undefined,
        weight_kg: data.weight_kg,
        microchip_id: data.microchip_id || undefined,
        is_neutered: data.is_neutered,
        color: data.color || undefined,
        description: data.description || undefined,
      }

      // 2. Create the pet
      const petRes = await api.post("/pets", payload)
      const petId = petRes.data.id

      // 3. Upload photos one by one (first becomes primary)
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const fd = new FormData()
          fd.append("file", photos[i])
          fd.append("is_primary", i === 0 ? "true" : "false")
          await api.post(`/pets/${petId}/photos`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        }
      }

      toast.success(`${data.name} added successfully!`)
      router.push(`/pets/${petId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add pet")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/pets">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Pet</h1>
          <p className="text-gray-500">Fill in your pet&apos;s details</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Basic Info ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input placeholder="Buddy" {...register("name")} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              {/* Species selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>Species *</Label>
                  <button
                    type="button"
                    onClick={() => setShowAddSpecies(v => !v)}
                    className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add species
                  </button>
                </div>
                {/* Add new species inline */}
                {showAddSpecies && (
                  <div className="flex gap-2 mb-1">
                    <Input
                      placeholder="e.g. Hamster"
                      value={newSpeciesName}
                      onChange={e => setNewSpeciesName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddSpecies())}
                    />
                    <Button type="button" size="sm" onClick={handleAddSpecies} className="h-8 bg-orange-500 hover:bg-orange-600">Add</Button>
                    <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setShowAddSpecies(false)}>✕</Button>
                  </div>
                )}
                <Controller
                  control={control}
                  name="species"
                  render={({ field }) => (
                    <Select onValueChange={handleSpeciesChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select species" /></SelectTrigger>
                      <SelectContent>
                        {allSpecies.map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.species && <p className="text-red-500 text-xs">{errors.species.message}</p>}
              </div>
            </div>

            {/* Breed — dynamic dropdown based on species */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Breed</Label>
                {breeds.length > 0 ? (
                  <Select onValueChange={handleBreedChange} value={selectedBreed}>
                    <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                    <SelectContent>
                      {breeds.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={selectedSpecies ? "Type breed name" : "Select species first"}
                    {...register("breed")}
                    disabled={!selectedSpecies}
                  />
                )}
                {/* Custom breed text input when "Other" selected */}
                {isCustomBreed && (
                  <Input
                    placeholder="Type your breed name"
                    {...register("customBreed")}
                    className="mt-1"
                    autoFocus
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(g => (
                          <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" {...register("date_of_birth")} />
              </div>
              <div className="space-y-1">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" placeholder="5.5" {...register("weight_kg", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Microchip ID</Label>
                <Input placeholder="Optional" {...register("microchip_id")} />
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <Input placeholder="e.g. Golden" {...register("color")} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="is_neutered"
                render={({ field }) => (
                  <Checkbox
                    id="neutered"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="neutered">Neutered / Spayed</Label>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Tell us about your pet..." {...register("description")} rows={3} />
            </div>

            {/* ── Photo Upload ── */}
            <div className="space-y-2">
              <Label>Photos <span className="text-gray-400 font-normal text-xs">(up to 5 · first photo = profile picture)</span></Label>

              {/* Photo previews */}
              {photoPreviews.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <Image src={src} alt="" fill className="object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-orange-500 text-white py-0.5">Primary</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {photos.length < 5 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors w-full justify-center"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Click to upload photos
                  </button>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Pet"}
              </Button>
              <Link href="/pets">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
