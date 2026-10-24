import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/AppShell";
import type { FarmSettings } from "@/types";
import { getSettings } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import pkg from "../package.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:9999");
const siteName = "Cattle Herd Manager";
const siteDescription =
  "Keep cattle records, breeding plans, health notes, and farm finances together in one thoughtful workspace.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "cattle management",
    "herd management",
    "farm management",
    "breeding records",
    "livestock health",
    "farm finances",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cattle Herd Manager — thoughtful tools for better herd care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export const dynamic = "force-dynamic";

const emptySettings: FarmSettings = {
  farmName: "",
  ownerName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = emptySettings;
  if (getSupabasePublicConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") {
      throw new Error(`Could not load the signed-in user: ${error.message}`);
    }
    if (data.user) settings = await getSettings();
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full bg-background">
        <Providers>
        <AppShell settings={settings} version={pkg.version} authEnabled={Boolean(getSupabasePublicConfig())}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
