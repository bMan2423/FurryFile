export type UserRole = "pet_owner" | "veterinarian" | "pet_sitter" | "shelter" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  profile_photo_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  is_email_verified: boolean;
  bio?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface PetPhoto {
  id: string;
  url: string;
  is_primary: boolean;
  caption?: string;
  created_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  date_of_birth?: string;
  gender: string;
  weight?: number;
  color?: string;
  microchip_id?: string;
  is_neutered: boolean;
  is_active: boolean;
  notes?: string;
  photos: PetPhoto[];
  created_at: string;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  name: string;
  date_given: string;
  next_due?: string;
  notes?: string;
  created_at: string;
}

export interface Allergy {
  id: string;
  pet_id: string;
  allergen: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  slot_id: string;
  pet_id: string;
  owner_id: string;
  vet_id: string;
  reason: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  slot?: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  };
}

export interface Booking {
  id: string;
  pet_id: string;
  owner_id: string;
  sitter_id: string;
  start_date: string;
  end_date: string;
  service_type: "boarding" | "day_care" | "walking";
  status: "pending" | "confirmed" | "ongoing" | "completed" | "cancelled";
  price_per_day: number;
  special_instructions?: string;
  created_at: string;
}

export interface MissingPet {
  id: string;
  reported_by_id: string;
  pet_name: string;
  species: string;
  breed?: string;
  color?: string;
  description?: string;
  last_seen_date: string;
  last_seen_location: string;
  latitude?: number;
  longitude?: number;
  status: "missing" | "found" | "reunited";
  contact_phone?: string;
  contact_email?: string;
  photos: { id: string; url: string; created_at: string }[];
  created_at: string;
}

export interface AdoptionListing {
  id: string;
  shelter_id: string;
  pet_name: string;
  species: string;
  breed?: string;
  age_years?: number;
  gender?: string;
  description?: string;
  requirements?: string;
  status: "available" | "pending" | "adopted";
  photos_urls?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  max_attendees?: number;
  status: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  user: User;
}

export interface ApiError {
  detail: string;
  code?: string;
}
