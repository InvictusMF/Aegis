import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { Profile } from "@/types";

const DEMO_COOKIE_NAME = "aegis_demo_user_id";

export async function GET() {
  const user = await getCurrentUser();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  let demoProfiles: Profile[] = [];
  if (isDemoMode) {
    const serviceSupabase = getServiceSupabase();
    if (serviceSupabase) {
      const { data } = await serviceSupabase.from("profiles").select("*");
      if (data && data.length > 0) {
        demoProfiles = data as Profile[];
      }
    }
    if (demoProfiles.length === 0) {
      demoProfiles = Array.from(db.profiles.values());
    }
  }

  return NextResponse.json({
    user,
    isAuthenticated: !!user,
    isDemoMode,
    demoProfiles: isDemoMode ? demoProfiles : [],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, fullName, role, demoUserId } = body;
    const cookieStore = await cookies();
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    // 1. Explicit Demo Switcher (Only if demo mode is active)
    if (demoUserId) {
      if (!isDemoMode) {
        return NextResponse.json({ error: "Demo mode is disabled in this environment." }, { status: 403 });
      }

      let profile: Profile | null = null;
      const serviceSupabase = getServiceSupabase();
      if (serviceSupabase) {
        const { data } = await serviceSupabase.from("profiles").select("*").eq("id", demoUserId).single();
        if (data) profile = data as Profile;
      }
      if (!profile) {
        profile = db.profiles.get(demoUserId) || null;
      }

      if (!profile) {
        return NextResponse.json({ error: "Demo profile not found" }, { status: 404 });
      }

      cookieStore.set(DEMO_COOKIE_NAME, profile.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({ success: true, user: profile, mode: "demo" });
    }

    // 2. Real Supabase Authentication
    const supabase = await createServerSupabase();

    if (action === "signup" && email && password) {
      if (!supabase) {
        return NextResponse.json({ error: "Supabase client unconfigured. Check environment variables." }, { status: 503 });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split("@")[0],
            role: role || "STUDENT",
          },
        },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Create profile row in public.profiles
      if (data.user) {
        const serviceSupabase = getServiceSupabase();
        const client = serviceSupabase || supabase;
        await client.from("profiles").upsert({
          id: data.user.id,
          email,
          full_name: fullName || email.split("@")[0],
          role: role || "STUDENT",
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === "signin" && email && password) {
      if (!supabase) {
        return NextResponse.json({ error: "Supabase client unconfigured. Check environment variables." }, { status: 503 });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      return NextResponse.json({ success: true, user: data.user });
    }

    return NextResponse.json({ error: "Invalid auth payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication error" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);

  const supabase = await createServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}
