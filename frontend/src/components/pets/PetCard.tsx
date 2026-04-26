import Link from "next/link";
import Image from "next/image";
import { capitalize, getPrimaryPhoto, formatDate } from "@/lib/utils";
import type { Pet } from "@/types";
import { Dog } from "lucide-react";

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const photoUrl = getPrimaryPhoto(pet.photos);

  return (
    <Link
      href={`/pets/${pet.id}`}
      className="card hover:shadow-md transition-shadow block group"
    >
      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 mb-4">
        {photoUrl ? (
          <Image src={photoUrl} alt={pet.name} fill className="object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Dog className="w-16 h-16" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="badge bg-primary-100 text-primary-700 capitalize">{pet.species}</span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg">{pet.name}</h3>
      <p className="text-sm text-gray-500">
        {pet.breed ?? "Mixed"} · {capitalize(pet.gender)}
      </p>
      {pet.date_of_birth && (
        <p className="text-xs text-gray-400 mt-1">Born {formatDate(pet.date_of_birth)}</p>
      )}
    </Link>
  );
}
