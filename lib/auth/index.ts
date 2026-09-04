import { db } from "@/lib/db";
import { Profile, Role } from "@/types";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "aegis_user_id";

export async function getCurrentUser(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (userId && db.profiles.has(userId)) {
    return db.profiles.get(userId)!;
  }

  // Fallback default demo user: Examiner Dr. Evelyn Vance
  return db.profiles.get("d0000000-0000-0000-0000-000000000001") || null;
}

export function getUserById(id: string): Profile | null {
  return db.profiles.get(id) || null;
}

export function getUserByEmail(email: string): Profile | null {
  for (const profile of db.profiles.values()) {
    if (profile.email.toLowerCase() === email.toLowerCase()) {
      return profile;
    }
  }
  return null;
}

export function registerUser(email: string, fullName: string, role: Role): Profile {
  const existing = getUserByEmail(email);
  if (existing) {
    return existing;
  }

  const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newProfile: Profile = {
    id,
    email,
    full_name: fullName,
    role,
    avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    created_at: new Date().toISOString(),
  };

  db.profiles.set(id, newProfile);
  return newProfile;
}
