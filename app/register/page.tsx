import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export default function RegisterPage() {
  const configured = Boolean(getSupabasePublicConfig());

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="rounded-3xl border border-border bg-card p-7 text-card-foreground shadow-lg sm:p-9">
          <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Start your farm workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create your account and set up a fresh space for your herd.
          </p>
          {!configured && (
            <p role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Supabase is not configured yet. Add the project URL and publishable key to enable registration.
            </p>
          )}
          <div className="mt-7">
            <RegisterForm />
          </div>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Your new account starts with a fresh farm. Existing records are not imported.
        </p>
      </div>
    </div>
  );
}
