import Link from "next/link";
import {
  ArrowRight,
  Beef,
  CalendarDays,
  ChartNoAxesCombined,
  FileBadge,
  HeartPulse,
  Sprout,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const features = [
  {
    icon: Beef,
    title: "Know your herd",
    description: "Keep cattle details, status, weights, and notes together in one clear record.",
  },
  {
    icon: CalendarDays,
    title: "Plan breeding",
    description: "Track breeding records and keep estimated calving windows in view.",
  },
  {
    icon: HeartPulse,
    title: "Stay on top of care",
    description: "Keep health treatments, vaccination notes, and related costs organized.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Follow the finances",
    description: "Record farm income and expenses alongside the day-to-day herd activity.",
  },
  {
    icon: FileBadge,
    title: "Create certificates",
    description: "Generate polished PDF ownership certificates when it is time to share the details.",
  },
];

export default function Home() {
  return (
    <main className="min-h-full bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Cattle Herd Manager home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">Cattle Herd Manager</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          <ThemeToggle className="h-10 w-10 rounded-full border border-border text-foreground hover:bg-accent" />
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            A steadier view of farm life
          </p>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Good records.
            <br />
            <span className="font-serif font-medium italic text-primary">Better herd care.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Bring cattle records, breeding plans, health notes, and farm finances into one thoughtful workspace—so the details are easier to keep up with and easier to find.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start your farm workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-card-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Every account starts with a fresh, private workspace. Existing records are not imported.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-accent blur-2xl sm:h-48 sm:w-48" />
          <div className="absolute -right-6 bottom-3 h-40 w-40 rounded-full bg-secondary blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] bg-sidebar p-5 text-sidebar-foreground shadow-xl sm:p-7">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-6 -top-10 h-44 w-44 rounded-full border border-white/10" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-primary">Your farm, in focus</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One place for the details</h2>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sidebar-accent text-sidebar-primary">
                <Beef className="h-6 w-6" />
              </span>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
                <div className="flex items-center gap-2 text-sidebar-primary">
                  <Beef className="h-4 w-4" />
                  <span className="text-xs font-medium">Herd records</span>
                </div>
                <p className="mt-5 text-sm text-sidebar-foreground/75">Profiles, weights & notes</p>
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
                <div className="flex items-center gap-2 text-sidebar-primary">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium">Breeding</span>
                </div>
                <p className="mt-5 text-sm text-sidebar-foreground/75">Dates & calving windows</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-sidebar-primary p-4 text-sidebar-primary-foreground sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-75">Built around your routine</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">Care, costs, and cattle—connected.</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary-foreground/70 text-sidebar-primary">
                    <HeartPulse className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex gap-1.5" aria-hidden="true">
                  <span className="h-1.5 flex-1 rounded-full bg-sidebar-primary" />
                  <span className="h-1.5 flex-1 rounded-full bg-sidebar-primary/80" />
                  <span className="h-1.5 flex-1 rounded-full bg-sidebar-primary/60" />
                  <span className="h-1.5 flex-1 rounded-full bg-sidebar-primary/40" />
                  <span className="h-1.5 flex-1 rounded-full bg-sidebar-primary/40" />
                </div>
              </div>
            </div>
            <p className="relative mt-5 text-xs leading-5 text-sidebar-foreground/70">
              A calm, practical home for the records that keep your operation moving.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Made for the whole picture</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              The everyday work, thoughtfully organized.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              From the first record to the next calving window, keep the information you rely on close at hand.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col justify-between gap-7 rounded-[2rem] bg-secondary p-7 text-secondary-foreground sm:p-10 lg:flex-row lg:items-center lg:p-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">A fresh start for your farm</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Keep your herd’s details close.
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Create your account and give your farm a dedicated space to grow into.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-7 text-center text-xs text-muted-foreground sm:px-8">
        Cattle Herd Manager · Practical tools for the work you do every day.
      </footer>
    </main>
  );
}
