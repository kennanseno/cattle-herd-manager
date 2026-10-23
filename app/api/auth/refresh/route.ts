import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSessionMetadata,
  parseSessionMetadata,
  SESSION_METADATA_COOKIE,
  SESSION_METADATA_MAX_AGE_SECONDS,
  serializeSessionMetadata,
} from "@/lib/session-expiry";

export async function POST() {
  const cookieStore = await cookies();
  const metadata = parseSessionMetadata(cookieStore.get(SESSION_METADATA_COOKIE)?.value);
  if (metadata && metadata.expiresAt <= Date.now()) {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return NextResponse.json({ error: "Your session could not be renewed. Please log in again." }, { status: 401 });
  }

  const { data, error } = await supabase.auth.refreshSession(sessionData.session);
  if (error || !data.session) {
    return NextResponse.json({ error: "Your session could not be renewed. Please log in again." }, { status: 401 });
  }

  const renewedMetadata = createSessionMetadata();
  cookieStore.set(
    SESSION_METADATA_COOKIE,
    serializeSessionMetadata(renewedMetadata),
    {
      httpOnly: false,
      maxAge: SESSION_METADATA_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  return NextResponse.json({ ok: true, expiresAt: renewedMetadata.expiresAt }, {
    headers: { "Cache-Control": "no-store" },
  });
}
