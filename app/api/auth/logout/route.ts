import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_METADATA_COOKIE } from "@/lib/session-expiry";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_METADATA_COOKIE);

  if (error) {
    console.error("[auth/logout] Supabase sign-out failed:", error.message);
    return NextResponse.json({ error: "We couldn't end your session. Please try again." }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
