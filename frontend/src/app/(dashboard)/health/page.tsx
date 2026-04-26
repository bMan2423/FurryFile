"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import type { Pet, Vaccination, Allergy } from "@/types";
import { formatDate, getStatusColor, capitalize } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

export default function HealthPage() {
  const queryClient = useQueryClient();
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [showVaccForm, setShowVaccForm] = useState(false);
  const [vaccForm, setVaccForm] = useState({ name: "", date_given: "", next_due: "", notes: "" });

  const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => (await api.get<Pet[]>("/pets")).data,
  });

  const { data: vaccinations } = useQuery({
    queryKey: ["vaccinations", selectedPetId],
    queryFn: async () => (await api.get<Vaccination[]>(`/health/vaccinations?pet_id=${selectedPetId}`)).data,
    enabled: !!selectedPetId,
  });

  const { data: allergies } = useQuery({
    queryKey: ["allergies", selectedPetId],
    queryFn: async () => (await api.get<Allergy[]>(`/health/allergies?pet_id=${selectedPetId}`)).data,
    enabled: !!selectedPetId,
  });

  const addVaccination = useMutation({
    mutationFn: (data: typeof vaccForm) => api.post("/health/vaccinations", { ...data, pet_id: selectedPetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
      setShowVaccForm(false);
      setVaccForm({ name: "", date_given: "", next_due: "", notes: "" });
      toast.success("Vaccination added!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
        <p className="text-gray-500 text-sm mt-1">Track vaccinations, allergies, and treatments</p>
      </div>

      {/* Pet selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Pet</label>
        <select
          className="input-field max-w-xs"
          value={selectedPetId}
          onChange={(e) => setSelectedPetId(e.target.value)}
        >
          <option value="">-- Choose a pet --</option>
          {pets?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedPetId && (
        <>
          {/* Vaccinations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Vaccinations</h2>
              <button onClick={() => setShowVaccForm(!showVaccForm)} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {showVaccForm && (
              <div className="border border-gray-100 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Vaccine name"
                    value={vaccForm.name}
                    onChange={(e) => setVaccForm({ ...vaccForm, name: e.target.value })}
                  />
                  <input
                    type="date"
                    className="input-field"
                    value={vaccForm.date_given}
                    onChange={(e) => setVaccForm({ ...vaccForm, date_given: e.target.value })}
                  />
                  <input
                    type="date"
                    className="input-field"
                    placeholder="Next due date"
                    value={vaccForm.next_due}
                    onChange={(e) => setVaccForm({ ...vaccForm, next_due: e.target.value })}
                  />
                  <input
                    className="input-field"
                    placeholder="Notes"
                    value={vaccForm.notes}
                    onChange={(e) => setVaccForm({ ...vaccForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addVaccination.mutate(vaccForm)}
                    disabled={addVaccination.isPending || !vaccForm.name || !vaccForm.date_given}
                    className="btn-primary text-sm"
                  >
                    Save
                  </button>
                  <button onClick={() => setShowVaccForm(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </div>
            )}

            {vaccinations?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No vaccinations recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {vaccinations?.map((v) => (
                  <div key={v.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{v.name}</p>
                      <p className="text-xs text-gray-500">Given: {formatDate(v.date_given)}</p>
                    </div>
                    {v.next_due && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Next due</p>
                        <p className="text-sm font-medium">{formatDate(v.next_due)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Allergies</h2>
            {allergies?.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No allergies recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies?.map((a) => (
                  <span key={a.id} className={`badge ${getStatusColor(a.severity)} capitalize`}>
                    {a.allergen} ({capitalize(a.severity)})
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
