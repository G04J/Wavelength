/** Matches public.profiles in Supabase */
export type Profile = {
  id: string;
  name: string;
  age: number | null;
  email: string;
  facebook_url?: string | null;
  instagram_handle?: string | null;
  show_social_to_nearby?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Matches public.user_interests in Supabase */
export type UserInterestRow = {
  id?: number;
  user_id: string;
  interest: string;
  category: string | null;
  created_at?: string;
};

/** Form state for one interest (before we have user_id) */
export type InterestInput = {
  interest: string;
  category: string;
};

/** Section IDs for profile interests (Groq autocomplete categories) */
export type InterestSectionId = "music" | "tv" | "games" | "interests";

/** Sectioned interests: section id -> list of interest strings */
export type SectionData = Record<InterestSectionId, string[]>;
