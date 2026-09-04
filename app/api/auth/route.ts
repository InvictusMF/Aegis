import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("aegis_user_id")?.value;
  const user = (userId && db.profiles.get(userId)) || db.profiles.get("d0000000-0000-0000-0000-000000000001");
  return NextResponse.json({ user, allProfiles: Array.from(db.profiles.values()) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, role, full_name } = body;

    let targetUser = userId ? db.profiles.get(userId) : null;

    if (!targetUser && email) {
      for (const p of db.profiles.values()) {
        if (p.email.toLowerCase() === email.toLowerCase()) {
          targetUser = p;
          break;
        }
      }
    }

    if (!targetUser && email && full_name && role) {
      targetUser = {
        id: `usr-${Date.now()}`,
        email,
        full_name,
        role,
        created_at: new Date().toISOString(),
      };
      db.profiles.set(targetUser.id, targetUser);
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("aegis_user_id", targetUser.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, user: targetUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process auth" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("aegis_user_id");
  return NextResponse.json({ success: true });
}
