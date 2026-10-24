import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import {
  createSessionMetadata,
  parseSessionMetadata,
  SESSION_METADATA_COOKIE,
  SESSION_METADATA_MAX_AGE_SECONDS,
  serializeSessionMetadata,
} from "@/lib/session-expiry";

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/icon.svg",
  "/apple-icon",
  "/opengraph-image",
]);
const sessionApiPaths = new Set(["/api/auth/logout", "/api/auth/refresh"]);
const protectedPagePaths = new Set([
  "/dashboard",
  "/cattle",
  "/breeding",
  "/health",
  "/finances",
  "/settings",
]);

function isTenantDataApi(pathname: string): boolean {
  return pathname === "/api/auth/delete-account" ||
    /^\/api\/(cattle(?:\/[^/]+)?|cattle\/[^/]+\/pdf-exports|breeding(?:\/[^/]+)?|health(?:\/[^/]+)?|finances(?:\/[^/]+)?|settings)$/.test(pathname);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (sessionApiPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") && !isTenantDataApi(pathname)) {
    return NextResponse.json(
      { error: "This API is unavailable until its storage is scoped to the signed-in farm." },
      { status: 403 },
    );
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const sessionMetadata = parseSessionMetadata(
    request.cookies.get(SESSION_METADATA_COOKIE)?.value,
  );
  if (sessionMetadata && sessionMetadata.expiresAt <= Date.now()) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("[auth/session-expiry] Supabase sign-out failed:", signOutError.message);
    }

    const expiredResponse = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 })
      : (() => {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/login";
          loginUrl.search = "";
          loginUrl.searchParams.set("expired", "true");
          loginUrl.searchParams.set("from", `${pathname}${request.nextUrl.search}`);
          return NextResponse.redirect(loginUrl);
        })();
    const redirectResponse = copyCookies(response, expiredResponse);
    redirectResponse.cookies.set(SESSION_METADATA_COOKIE, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return redirectResponse;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (!sessionMetadata) {
    response.cookies.set(
      SESSION_METADATA_COOKIE,
      serializeSessionMetadata(createSessionMetadata()),
      {
        httpOnly: false,
        maxAge: SESSION_METADATA_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );
  }

  if (pathname === "/farm") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  if (
    !pathname.startsWith("/api/") &&
    !protectedPagePaths.has(pathname) &&
    !/^\/cattle\/[^/]+$/.test(pathname)
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
