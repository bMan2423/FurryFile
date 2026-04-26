"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, getApiError } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SPECIES_OPTIONS } from "@/lib/constants";

const schema = z.object({
  pet_name: z.string().min(1, "Pet name required"),
  species: z.string(),
  breed: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  last_seen_date: z.string().min(1, "Date required"),
  last_seen_location: z.string().min(1, "Location required"),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ReportMissingPetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: "dog" },
  });

  async function onSubmit(data: FormData) {
    try {
      await api.post("/missing-pets", data);
      queryClient.invalidateQueries({ queryKey: ["missing-pets"] });
      toast.success("Missing pet report submitted!");
      router.push("/missing");
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report a Missing Pet</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in as much detail as possible to help find your pet</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
              <input {...register("pet_name")} className="input-field" placeholder="Buddy" />
              {errors.pet_name && <p className="text-red-500 text-xs mt-1">{errors.pet_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
              <select {...register("species")} className="input-field">
                {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input {...register("breed")} className="input-field" placeholder="Golden Retriever" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color / Markings</label>
              <input {...register("color")} className="input-field" placeholder="Golden brown with white patch" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Seen Date *</label>
              <input {...register("last_seen_date")} type="date" className="input-field" />
              {errors.last_seen_date && <p className="text-red-500 text-xs mt-1">{errors.last_seen_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Seen Location *</label>
              <input {...register("last_seen_location")} className="input-field" placeholder="Park Ave, New York" />
              {errors.last_seen_location && <p className="text-red-500 text-xs mt-1">{errors.last_seen_location.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input {...register("contact_phone")} type="tel" className="input-field" placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input {...register("contact_email")} type="email" className="input-field" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register("description")} className="input-field h-24 resize-none" placeholder="Wearing a red collar, responds to name Buddy..." />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
