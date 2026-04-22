import { createClient } from "@supabase/supabase-js";

// Admin client: uses the SERVICE ROLE KEY, bypasses Row Level Security.
// SERVER-SIDE ONLY. Never import this into any file that runs in the browser.
// Only use in /pages/api/* routes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
