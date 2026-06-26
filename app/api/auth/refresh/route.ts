import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, SESSION_METADATA_COOKIE, SESSION_DURATION_MS, sessionToken, timingSafeEqual } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  
  // Gate disabled — nothing to authenticate against.
  if (!password) return NextResponse.json({ ok: true });

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (!cookie) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
  }

  // Validate the current session
  const expected = await sessionToken(password);
  if (!timingSafeEqual(cookie, expected)) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Issue new session with extended expiration
  const token = await sessionToken(password);
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;
  
  const response = NextResponse.json({ ok: true, expiresAt });
  
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000, // 15 minutes
  });
  
  response.cookies.set(SESSION_METADATA_COOKIE, JSON.stringify({ issuedAt: now, expiresAt }), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000, // 15 minutes
  });
  
  return response;
}
