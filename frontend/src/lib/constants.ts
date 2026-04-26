export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://65.21.153.206/api/v1"

export const ROLES = {
  PET_OWNER: "pet_owner",
  VETERINARIAN: "veterinarian",
  PET_SITTER: "pet_sitter",
  SHELTER: "shelter",
  ADMIN: "admin",
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

/** Sorted alphabetically */
export const SPECIES_OPTIONS = ["bird","cat","dog","fish","other","rabbit","reptile"]
export const GENDER_OPTIONS   = ["female","male","unknown"]
export const BOOKING_SERVICES = ["boarding","day_care","dog_walking","drop_in"]
export const APPOINTMENT_TYPES = ["consultation","grooming","vet_visit"]
export const SEVERITY_OPTIONS  = ["mild","moderate","severe"]

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const ROLE_LABELS: Record<string, string> = {
  pet_owner:    "Pet Owner",
  veterinarian: "Veterinarian",
  pet_sitter:   "Pet Sitter",
  shelter:      "Pet Shelter",
  admin:        "Administrator",
}

/** Breed master — all lists sorted alphabetically. "Other (type manually)" appended at runtime. */
export const BREEDS_BY_SPECIES: Record<string, string[]> = {
  bird: [
    "African Grey Parrot","Amazon Parrot","Budgerigar (Budgie)","Caique","Canary",
    "Cockatiel","Cockatoo","Conure","Eclectus","Finch","Lovebird","Lorikeet",
    "Macaw","Parakeet","Quaker Parrot",
  ],
  cat: [
    "Abyssinian","American Shorthair","Bengal","Birman","British Shorthair",
    "Burmese","Cornish Rex","Devon Rex","Maine Coon","Norwegian Forest Cat",
    "Oriental","Persian","Ragdoll","Russian Blue","Scottish Fold","Siamese",
    "Sphynx","Tonkinese",
  ],
  dog: [
    "Akita","Australian Shepherd","Beagle","Border Collie","Boxer",
    "Bulldog","Cavalier King Charles Spaniel","Chihuahua","Cocker Spaniel",
    "Corgi","Dachshund","Doberman Pinscher","French Bulldog","German Shepherd",
    "Golden Retriever","Great Dane","Labrador Retriever","Maltese",
    "Pomeranian","Poodle","Rottweiler","Samoyed","Shih Tzu",
    "Siberian Husky","Yorkshire Terrier",
  ],
  fish: [
    "Angelfish","Betta","Cichlid","Clownfish","Discus","Flowerhorn",
    "Goldfish","Guppy","Koi","Molly","Neon Tetra","Oscar",
    "Parrot Fish","Plecostomus","Swordtail","Zebrafish",
  ],
  other: [],
  rabbit: [
    "Angora","Dutch","Flemish Giant","Harlequin","Holland Lop",
    "Lionhead","Mini Lop","Mini Rex","Netherland Dwarf","New Zealand",
    "Polish","Rex",
  ],
  reptile: [
    "Ball Python","Bearded Dragon","Blue-Tongue Skink","Box Turtle",
    "Chameleon","Corn Snake","Crested Gecko","Green Iguana","King Snake",
    "Leopard Gecko","Red-Eared Slider","Uromastyx",
  ],
}

export const BOOKING_SERVICE_LABELS: Record<string, string> = {
  boarding:    "Boarding (overnight)",
  day_care:    "Day Care",
  dog_walking: "Dog Walking",
  drop_in:     "Drop-In Visit",
}

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  consultation: "Consultation",
  grooming:     "Grooming",
  vet_visit:    "Vet Visit",
}
