export interface Place {
  place_id: string;
  name: string;
  location: { lat: number; lng: number };
  formatted_address?: string;
  rating?: number;
  price_level?: number;
  photos?: { url: string }[];
  types?: string[];
  opening_hours?: { open_now?: boolean };
}

export interface CoupleSettings {
  defaultLocation?: { lat: number; lng: number; address: string };
  defaultRadius?: number;
  preferredTypes?: ('restaurant' | 'cafe' | 'bar')[];
}

export interface SwipeProgress {
  userId: string;
  current: number;
  total: number;
  liked: string[]; // placeIds
}
