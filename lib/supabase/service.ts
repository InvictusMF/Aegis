import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serviceInstance: SupabaseClient | null = null;

/**
 * Returns the server-only Supabase Service-Role client.
 * This client bypasses RLS for authoritative server operations (e.g. grading, AI investigations, audit logging).
 * NEVER expose this or import this file in client components.
 */
export function getServiceSupabase(): SupabaseClient | null {
  if (serviceInstance) {
    return serviceInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("your-project") || serviceRoleKey.includes("your-supabase")) {
    return null;
  }

  serviceInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceInstance;
}
