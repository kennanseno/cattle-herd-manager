"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import {
  createSessionMetadata,
  SESSION_METADATA_COOKIE,
  SESSION_METADATA_MAX_AGE_SECONDS,
  serializeSessionMetadata,
} from "@/lib/session-expiry";

export type AuthFormState = {
  message?: string;
  success?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    farmName?: string[];
  };
};

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(8, "Use a password with at least 8 characters."),
  farmName: z.string().trim().min(2, "Farm name must be at least 2 characters.")
    .max(120, "Farm name must be 120 characters or fewer."),
});

async function startSessionExpiryWindow() {
  const cookieStore = await cookies();
  cookieStore.set(
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

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!getSupabasePublicConfig()) {
    return { message: "Login is unavailable until Supabase is configured for this deployment." };
  }

  let error: Error | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    ({ error } = await supabase.auth.signInWithPassword(parsed.data));
  } catch {
    return { message: "We couldn't reach the sign-in service. Please try again." };
  }

  if (error) {
    return { message: "We couldn't sign you in with those details. Check your email and password, then try again." };
  }

  await startSessionExpiryWindow();
  const destination = formData.get("from");
  redirect(
    typeof destination === "string" &&
      destination.startsWith("/") &&
      !destination.startsWith("//") &&
      !destination.startsWith("/login")
      ? destination
      : "/dashboard",
  );
}

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    farmName: formData.get("farmName"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  if (!getSupabasePublicConfig()) {
    return { message: "Registration is unavailable until Supabase is configured for this deployment." };
  }

  let data: { session: unknown } | null = null;
  let error: { code?: string; message: string } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { farm_name: parsed.data.farmName },
      },
    });
    data = result.data;
    error = result.error;
  } catch {
    return { message: "We couldn't reach the registration service. Please try again." };
  }

  if (error) {
    if (error.code === "user_already_exists" || error.message.toLowerCase().includes("already registered")) {
      return {
        message: "An account may already exist for that email. Try logging in or use a different email address.",
      };
    }
    return { message: "We couldn't create your account. Check your details and try again." };
  }

  if (!data?.session) {
    return {
      success:
        "Your account was created, but email confirmation is enabled in Supabase. Disable email confirmations in Supabase Auth to use the no-verification sign-up flow.",
    };
  }

  await startSessionExpiryWindow();
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error("Supabase could not end the session.");
    }
  } catch {
    throw new Error("Could not sign out. Please try again.");
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_METADATA_COOKIE);
  redirect("/");
}
