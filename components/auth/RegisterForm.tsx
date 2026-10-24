"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="farmName">Farm name</Label>
        <Input id="farmName" name="farmName" autoComplete="organization" maxLength={120} required />
        {state.fieldErrors?.farmName?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
        {state.fieldErrors?.password?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>
      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      {state.success && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {state.success}{" "}
          <Link href="/login" className="font-semibold underline">Go to login</Link>
        </p>
      )}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Creating your farm…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
