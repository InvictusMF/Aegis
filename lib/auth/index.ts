import { createServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { Profile, Role } from "@/types";
import { cookies } from "next/headers";

const DEMO_COOKIE_NAME = "aegis_demo_user_id";

/**
 * Retrieves the currently authenticated user session.
 * 1. Checks official Supabase Auth session via SSR cookies.
 * 2. If valid, looks up profile from PostgreSQL profiles table.
 * 3. If in explicit DEMO MODE, permits switching between clearly labeled demo accounts.
 * 4. NEVER falls back to an unauthenticated default examiner identity.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  // 1. Check Supabase Auth
  try {
    const supabase = await createServerSupabase();
    if (supabase) {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (!error && authUser) {
        // Query profile from PostgreSQL
        const serviceSupabase = getServiceSupabase();
        const client = serviceSupabase || supabase;
        const { data: profile } = await client
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          return profile as Profile;
        }

        // Auto-create minimal profile if authenticated but no profile row yet
        const defaultRole: Role = "STUDENT";
        const newProfile: Profile = {
          id: authUser.id,
          email: authUser.email || "",
          full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Authenticated User",
          role: (authUser.user_metadata?.role as Role) || defaultRole,
          avatar_url: authUser.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
        };

        if (serviceSupabase) {
          await serviceSupabase.from("profiles").insert(newProfile);
        }
        return newProfile;
      }
    }
  } catch (err) {
    // Supabase auth check error handled below
  }

  // 2. Explicit DEMO MODE check (only if NEXT_PUBLIC_DEMO_MODE is true)
  const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (isDemoEnabled) {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get(DEMO_COOKIE_NAME)?.value;

    if (demoUserId) {
      const serviceSupabase = getServiceSupabase();
      if (serviceSupabase) {
        const { data: profile } = await serviceSupabase
          .from("profiles")
          .select("*")
          .eq("id", demoUserId)
          .single();
        if (profile) return profile as Profile;
      }

      if (db.profiles.has(demoUserId)) {
        return db.profiles.get(demoUserId)!;
      }
    }
  }

  // Unauthenticated visitors do NOT get an examiner identity
  return null;
}

/**
 * Server-side authorization guard.
 * Returns the user or throws an unauthorized error.
 */
export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required. Please sign in.");
  }
  return user;
}

/**
 * Enforces role-based authorization server-side.
 */
export async function requireRole(allowedRoles: Role[]): Promise<Profile> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role '${user.role}' lacks permission for this action.`);
  }
  return user;
}
