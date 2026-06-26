import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, sessionToken, timingSafeEqual } from "@/lib/auth";

// Server-side password gate. Runs before any route is rendered, so unauthenticated
// requests can never reach a page or API. Disabled when APP_PASSWORD is unset
// (e.g. local development), matching the storage backend's opt-in pattern.
export async function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie) {
    const expected = await sessionToken(password);
    if (timingSafeEqual(cookie, expected)) return NextResponse.next();
  }

  // Not authenticated.
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except the login page, the auth endpoints, Next.js
  // internals and the favicon (so the login screen can load its assets).
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
