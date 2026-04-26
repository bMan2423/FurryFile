"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SPECIES_OPTIONS, GENDER_OPTIONS } from "@/lib/constants";
import { api, getApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Pet } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  species: z.string(),
  breed: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string(),
  weight: z.coerce.number().optional(),
  color: z.string().optional(),
  microchip_id: z.string().optional(),
  is_neutered: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PetFormProps {
  pet?: Pet; // Pass to edit, omit to create
}

export default function PetForm({ pet }: PetFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!pet;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: pet
      ? {
          name: pet.name,
          species: pet.species,
          breed: pet.breed ?? "",
          gender: pet.gender,
          weight: pet.weight ?? undefined,
          color: pet.color ?? "",
          microchip_id: pet.microchip_id ?? "",
          is_neutered: pet.is_neutered,
          notes: pet.notes ?? "",
        }
      : { gender: "unknown", species: "dog", is_neutered: false },
  });

  async function onSubmit(data: FormData) {
    try {
      if (isEdit) {
        await api.patch(`/pets/${pet.id}`, data);
        toast.success("Pet updated!");
      } else {
        await api.post("/pets", data);
        toast.success("Pet added!");
      }
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.push("/pets");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input {...register("name")} className="input-field" placeholder="Buddy" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
          <select {...register("species")} className="input-field">
            {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
          <input {...register("breed")} className="input-field" placeholder="Golden Retriever" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select {...register("gender")} className="input-field">
            {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input {...register("date_of_birth")} type="date" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input {...register("weight")} type="number" step="0.1" className="input-field" placeholder="5.2" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input {...register("color")} className="input-field" placeholder="Golden brown" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Microchip ID</label>
          <input {...register("microchip_id")} className="input-field" placeholder="985..." />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input {...register("is_neutered")} type="checkbox" id="is_neutered" className="rounded" />
        <label htmlFor="is_neutered" className="text-sm text-gray-700">Neutered / Spayed</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register("notes")} className="input-field h-24 resize-none" placeholder="Any special notes..." />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Saving..." : isEdit ? "Update Pet" : "Add Pet"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
