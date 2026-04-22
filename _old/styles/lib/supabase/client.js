import { createClient } from "@supabase/supabase-js";

// Browser client: uses the anon key, respects Row Level Security (RLS).
// Safe to use in pages and components.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
