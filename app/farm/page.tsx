import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Sprout } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FarmPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("name")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  return (
    <main className="min-h-full bg-[#f7f7f1] px-5 py-10 text-slate-950 dark:bg-[#101a14] dark:text-slate-100 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#183d2d] text-[#d8edc1]">
              <Sprout className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">Cattle Herd Manager</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-10 w-10 rounded-full border border-[#cfd7c8] text-slate-700 hover:bg-white dark:border-[#49624f] dark:text-slate-200 dark:hover:bg-white/10" />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[#cfd7c8] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f4f6ef] dark:border-[#49624f] dark:bg-[#17251b] dark:text-slate-200 dark:hover:bg-white/10">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </form>
          </div>
        </header>

        {farmError ? (
          <section className="mt-12 rounded-3xl border border-red-200 bg-white p-7 shadow-sm dark:border-red-900 dark:bg-[#17251b] sm:p-10">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">We couldn’t load your farm</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Your account is signed in, but the farm record could not be retrieved. Please try again later. If this continues, contact support.
            </p>
          </section>
        ) : !farm ? (
          <section className="mt-12 rounded-3xl border border-amber-200 bg-white p-7 shadow-sm dark:border-amber-900 dark:bg-[#17251b] sm:p-10">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Your farm workspace is not ready yet</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              We couldn’t find a farm linked to this account. Please contact support so we can help finish setting up your workspace.
            </p>
          </section>
        ) : (
          <section className="mt-12 overflow-hidden rounded-[2rem] bg-[#193d2d] p-7 text-white shadow-[0_35px_90px_-42px_rgba(18,54,37,0.8)] sm:p-11">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c2d7b1]">Your private farm workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {farm.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75">
              Your account and farm workspace are ready. We’re preparing the secure, farm-specific records that will bring cattle, breeding, health, and finances together here.
            </p>
            <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-5">
              <p className="text-sm font-semibold">Your workspace starts fresh</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Existing records are not imported into this workspace.
              </p>
            </div>
            <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-[#d5e8bf] underline-offset-4 hover:underline">
              Back to the home page
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
