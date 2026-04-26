"use client";
import { useState } from "react";
import api from "@/lib/api";
import type { Pet } from "@/types";
import { toast } from "sonner";
import { Search, PawPrint, User, Stethoscope } from "lucide-react";

function getPrimaryPhoto(pet: Pet): string | null {
  if (!pet.photos?.length) return null;
  const primary = pet.photos.find(p => p.is_primary);
  return (primary ?? pet.photos[0]).url;
}

export default function VetSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Pet & { owner?: { full_name: string; email: string; phone?: string } })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data } = await api.get("/pets/search", { params: { q } });
      setResults(data);
      setSearched(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pet Search</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Search by pet name, microchip ID, or owner email</p>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, microchip ID, or owner email…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <PawPrint className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No pets found</p>
          <p className="text-sm mt-1">Try searching by a different name, microchip ID, or owner email</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
          <div className="grid gap-4">
            {results.map(pet => {
              const photoUrl = getPrimaryPhoto(pet);
              return (
                <div
                  key={pet.id}
                  className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Photo */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{pet.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {pet.species}{pet.breed ? ` · ${pet.breed}` : ""} · {pet.gender}
                        </p>
                      </div>
                      {!pet.is_active && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {pet.microchip_id && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Microchip:</span>
                          {pet.microchip_id}
                        </span>
                      )}
                      {pet.date_of_birth && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">DOB:</span>
                          {new Date(pet.date_of_birth).toLocaleDateString()}
                        </span>
                      )}
                      {pet.weight && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Weight:</span>
                          {pet.weight} kg
                        </span>
                      )}
                      {pet.color && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Color:</span>
                          {pet.color}
                        </span>
                      )}
                    </div>

                    {pet.owner && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{pet.owner.full_name}</span>
                        <span>·</span>
                        <span>{pet.owner.email}</span>
                        {pet.owner.phone && (
                          <>
                            <span>·</span>
                            <span>{pet.owner.phone}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
