import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_METADATA_COOKIE, SESSION_DURATION_MS, sessionToken, timingSafeEqual } from "@/lib/auth";

// In-memory brute-force throttle: after MAX_ATTEMPTS failures from one client,
// lock that client out for LOCKOUT_MS. State lives in the module scope, so it is
// per-process — on a multi-instance/serverless host it is best-effort only.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

type Attempt = { count: number; lockedUntil: number };
const attempts = new Map<string, Attempt>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const password = process.env.APP_PASSWORD;
  // Gate disabled — nothing to authenticate against.
  if (!password) return NextResponse.json({ ok: true });

  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);

  // Currently locked out.
  if (record && record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let submitted = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") submitted = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const correct = submitted.length === password.length && timingSafeEqual(submitted, password);
  if (!correct) {
    const count = (record?.lockedUntil && record.lockedUntil <= now ? 0 : record?.count ?? 0) + 1;
    if (count >= MAX_ATTEMPTS) {
      attempts.set(key, { count, lockedUntil: now + LOCKOUT_MS });
      return NextResponse.json(
        {
          error: `Too many attempts. Try again in ${LOCKOUT_MS / 60000} minute(s).`,
          retryAfter: LOCKOUT_MS / 1000,
        },
        { status: 429, headers: { "Retry-After": String(LOCKOUT_MS / 1000) } },
      );
    }
    attempts.set(key, { count, lockedUntil: 0 });
    const remaining = MAX_ATTEMPTS - count;
    return NextResponse.json(
      { error: `Incorrect password. ${remaining} attempt(s) left.` },
      { status: 401 },
    );
  }

  // Success — clear any failure record for this client.
  attempts.delete(key);

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
  
  // Store session metadata (not httpOnly so client can access expiration time)
  response.cookies.set(SESSION_METADATA_COOKIE, JSON.stringify({ issuedAt: now, expiresAt }), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000, // 15 minutes
  });
  
  return response;
}
