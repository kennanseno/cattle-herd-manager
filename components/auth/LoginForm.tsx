"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(loginAction, initialState);
  const from = searchParams.get("from");

  return (
    <form action={action} className="space-y-5">
      {from && <input type="hidden" name="from" value={from} />}
      {searchParams.get("expired") === "true" && (
        <p role="status" className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">
          Your session expired after 15 minutes. Log in again to continue.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password?.map((error) => (
          <p key={error} className="text-sm text-destructive">{error}</p>
        ))}
      </div>
      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to Cattle Herd Manager?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
